(() => {
    'use strict';

    const ONI_TIME_LIMIT = 60;       // 秒
    const ONI_PENALTY_SECONDS = 5;   // ミス時のマイナス秒数
    const ONI_TRAY_SIZE = 3;         // おにモードでトレイに常時並べるカード枚数

    // ======== ゲーム状態 ========
    const state = {
        category: 'cycle',      // 'cycle' | 'sketch'
        difficulty: 'easy',     // 'easy' | 'normal' | 'oni'
        score: 0,
        totalQuestions: 10,
        selectedItemId: null,
        items: [],
        stagePlacedCount: {},
        nextItemUid: 0,
        timeLeft: ONI_TIME_LIMIT,
        oniEndTime: 0,
        isPlaying: false,
        justUnlockedOni: false,
        timerInterval: null,
        toastTimeout: null,
        returnTimeout: null
    };

    // ======== DOM参照 ========
    const els = {
        homeScreen: document.getElementById('home-screen'),
        gameScreen: document.getElementById('game-screen'),
        homeDesc: document.getElementById('home-desc'),
        ruleOniItem: document.getElementById('rule-oni-item'),
        btnOni: document.getElementById('btn-oni'),
        tabScoreSketch: document.getElementById('tab-score-sketch'),
        categoryTabs: document.querySelectorAll('.category-tab'),
        modeButtons: document.querySelectorAll('.mode-btn'),
        homeBtn: document.getElementById('home-btn'),
        modeDisplay: document.getElementById('mode-display'),
        trayTitleText: document.getElementById('tray-title-text'),
        progressContainer: document.getElementById('progress-container'),
        timerBadge: document.getElementById('timer-badge'),
        timerText: document.getElementById('timer-text'),
        scoreText: document.getElementById('score-text'),
        progressFill: document.getElementById('progress-fill'),
        graphWrapper: document.getElementById('graph-wrapper'),
        linearSvg: document.getElementById('linear-svg'),
        circleSvg: document.getElementById('circle-svg'),
        dropZone: document.getElementById('drop-zone'),
        cardList: document.getElementById('card-list'),
        toast: document.getElementById('toast'),
        clearOverlay: document.getElementById('clear-overlay'),
        clearTitle: document.getElementById('clear-title'),
        clearSubtitle: document.getElementById('clear-subtitle'),
        clearActions: document.getElementById('clear-actions'),
        autoReturnText: document.getElementById('auto-return-text'),
        retryBtn: document.getElementById('retry-btn'),
        overlayHomeBtn: document.getElementById('overlay-home-btn')
    };

    function getActiveSvg() {
        return state.difficulty === 'easy' ? els.linearSvg : els.circleSvg;
    }

    function getActiveStageNodes() {
        return getActiveSvg().querySelectorAll('.stage-node');
    }

    // ======== 初期化 ========
    function init() {
        els.categoryTabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                setCategory(tab.dataset.category);
            });
        });

        els.modeButtons.forEach((btn) => {
            btn.addEventListener('click', () => {
                startGame(btn.dataset.difficulty);
            });
        });

        els.homeBtn.addEventListener('click', resetToHome);
        els.overlayHomeBtn.addEventListener('click', resetToHome);
        els.retryBtn.addEventListener('click', () => {
            els.clearOverlay.classList.remove('active');
            startGame(state.difficulty);
        });

        // ボード上のホバー・ドラッグ拡大ハイライトとドロップ／タップ判定
        els.graphWrapper.addEventListener('mousemove', (e) => {
            const node = findStageNodeAtPoint(e.clientX, e.clientY);
            setActiveStageHighlight(node);
        });

        els.graphWrapper.addEventListener('mouseleave', () => {
            setActiveStageHighlight(null);
        });

        els.graphWrapper.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const node = findStageNodeAtPoint(e.clientX, e.clientY);
            setActiveStageHighlight(node);
        });

        els.graphWrapper.addEventListener('dragleave', (e) => {
            if (!els.graphWrapper.contains(e.relatedTarget)) {
                setActiveStageHighlight(null);
            }
        });

        els.graphWrapper.addEventListener('drop', (e) => {
            e.preventDefault();
            setActiveStageHighlight(null);
            handlePlacementAttempt(e.clientX, e.clientY);
        });

        els.graphWrapper.addEventListener('click', (e) => {
            handlePlacementAttempt(e.clientX, e.clientY);
        });

        setCategory('cycle');
        updateTabScores();
    }

    // ======== 学習カテゴリ切替＆記録管理 ========
    function getOniBestKey() {
        return 'mitosis-master-oni-best-sketch';
    }

    function getOniUnlockKey() {
        return 'mitosis-master-oni-unlocked-sketch';
    }

    function isOniUnlocked(category) {
        // 細胞周期タブでは「おに」は不要（細胞スケッチタブのみ）
        return category === 'sketch' && localStorage.getItem(getOniUnlockKey()) === 'true';
    }

    function updateTabScores() {
        const saved = localStorage.getItem(getOniBestKey());
        if (saved !== null) {
            els.tabScoreSketch.textContent = `👹 ${saved}問`;
            els.tabScoreSketch.hidden = false;
        } else {
            els.tabScoreSketch.hidden = true;
        }
    }

    function updateDifficultyVisibility(animateReveal = false) {
        const oniVisible = isOniUnlocked(state.category);
        els.ruleOniItem.hidden = !oniVisible;
        els.btnOni.hidden = !oniVisible;
        els.btnOni.classList.toggle('just-unlocked', oniVisible && animateReveal);
    }

    function setCategory(category) {
        state.category = category;
        const config = CATEGORY_CONFIG[category];

        els.categoryTabs.forEach((tab) => {
            const isActive = tab.dataset.category === category;
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-selected', String(isActive));
        });

        els.homeDesc.textContent = config.description;
        updateDifficultyVisibility();
    }

    // ======== ゲーム開始 ========
    function startGame(difficulty) {
        stopTimers();
        state.difficulty = difficulty;
        state.score = 0;
        state.selectedItemId = null;
        state.stagePlacedCount = {};
        state.nextItemUid = 0;
        state.timeLeft = ONI_TIME_LIMIT;
        state.isPlaying = true;

        els.dropZone.innerHTML = '';

        const isEasy = difficulty === 'easy';
        const isOni = difficulty === 'oni';
        const isSketch = state.category === 'sketch';

        // かんたん＝一直線の図、ふつう・おに＝円の周期図
        els.linearSvg.classList.toggle('active-board', isEasy);
        els.circleSvg.classList.toggle('active-board', !isEasy);

        els.graphWrapper.classList.toggle('sketch-mode', isSketch);
        els.progressContainer.classList.toggle('oni-active', isOni);
        els.timerBadge.hidden = !isOni;
        els.timerBadge.classList.remove('urgent', 'penalty-flash');
        els.progressFill.classList.toggle('timer-fill', isOni);
        els.progressFill.classList.remove('urgent');

        setupBoardNodes(state.category, difficulty);

        if (isOni) {
            state.items = buildInitialOniItems();
            updateOniHud();
            startOniTimer();
        } else {
            state.items = buildStandardItems(state.category);
            state.totalQuestions = state.items.length;
            shuffleArray(state.items);
            updateStandardProgress();
        }

        const categoryConfig = CATEGORY_CONFIG[state.category];
        els.modeDisplay.textContent = `${categoryConfig.label} / ${DIFFICULTY_LABELS[difficulty]}`;
        els.trayTitleText.textContent = categoryConfig.trayTitle;

        els.homeScreen.classList.remove('active');
        els.gameScreen.classList.add('active');

        showToast(isOni ? categoryConfig.oniToast : categoryConfig.startToast);
        renderCards();
    }

    function setupBoardNodes(category, difficulty) {
        const isOni = difficulty === 'oni';

        [els.linearSvg, els.circleSvg].forEach((svg) => {
            svg.querySelectorAll('.stage-node').forEach((node) => {
                clearTimeout(node._revealTimer);
                node.classList.remove('solved', 'active-target', 'interactive-target', 'masked');

                const labelEl = node.querySelector('.stage-label');
                if (labelEl && node.dataset.defaultLabel) {
                    labelEl.textContent = node.dataset.defaultLabel;
                }
            });
        });

        getActiveStageNodes().forEach((node) => {
            if (category === 'cycle') {
                // 細胞周期モード：全10箇所を「？」にして回答させる
                node.classList.add('interactive-target', 'masked');
            } else {
                // 細胞スケッチモード：間期＋前期〜終期の5箇所のみターゲット
                const isSketchTarget = node.classList.contains('sketch-target');
                node.classList.toggle('interactive-target', isSketchTarget);
                node.classList.toggle('masked', isOni);
            }
        });
    }

    // ======== 問題アイテム生成 ========
    function buildStandardItems(category) {
        if (category === 'cycle') {
            return CYCLE_ITEMS.map((entry) => ({
                id: `item-${state.nextItemUid++}`,
                stageId: entry.stageId,
                stageName: entry.name,
                kind: 'cycle',
                emoji: entry.emoji,
                name: entry.name,
                color: entry.color,
                bg: entry.bg
            }));
        }

        const result = [];
        SKETCH_STAGES.forEach((stage) => {
            stage.sketches.forEach((sketch) => {
                result.push({
                    id: `item-${state.nextItemUid++}`,
                    stageId: stage.id,
                    stageName: stage.stageName,
                    kind: 'sketch',
                    cellType: sketch.cellType,
                    rotated: false,
                    color: stage.color
                });
            });
        });
        return result;
    }

    function createOniItemForSketch(stage) {
        const def = stage.oniSketches[Math.floor(Math.random() * stage.oniSketches.length)];
        return {
            id: `item-${state.nextItemUid++}`,
            stageId: stage.id,
            stageName: stage.stageName,
            kind: 'sketch',
            cellType: def.cellType,
            rotated: Boolean(def.rotated),
            color: stage.color
        };
    }

    function buildInitialOniItems() {
        const pool = [...SKETCH_STAGES];
        shuffleArray(pool);
        return pool.slice(0, ONI_TRAY_SIZE).map(createOniItemForSketch);
    }

    function pickNextOniItem() {
        const activeStageIds = new Set(state.items.map((item) => item.stageId));
        const candidates = SKETCH_STAGES.filter((stage) => !activeStageIds.has(stage.id));
        const source = candidates.length > 0 ? candidates : SKETCH_STAGES;
        const chosen = source[Math.floor(Math.random() * source.length)];
        return createOniItemForSketch(chosen);
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // ======== おにモード タイマー ========
    function startOniTimer() {
        state.oniEndTime = Date.now() + ONI_TIME_LIMIT * 1000;

        state.timerInterval = setInterval(() => {
            const remainingMs = Math.max(0, state.oniEndTime - Date.now());
            state.timeLeft = Math.ceil(remainingMs / 1000);
            updateOniHud(remainingMs);

            if (remainingMs <= 0) {
                stopTimers();
                handleOniTimeUp();
            }
        }, 100);
    }

    function applyOniTimePenalty() {
        state.oniEndTime -= ONI_PENALTY_SECONDS * 1000;
        const remainingMs = Math.max(0, state.oniEndTime - Date.now());
        state.timeLeft = Math.ceil(remainingMs / 1000);
        updateOniHud(remainingMs);

        els.timerBadge.classList.add('penalty-flash');
        setTimeout(() => {
            els.timerBadge.classList.remove('penalty-flash');
        }, 350);

        if (remainingMs <= 0) {
            stopTimers();
            handleOniTimeUp();
            return true;
        }
        return false;
    }

    function updateOniHud(remainingMs = state.timeLeft * 1000) {
        els.timerText.textContent = state.timeLeft;
        els.scoreText.textContent = `🏆 ${state.score}問`;

        const percent = (remainingMs / (ONI_TIME_LIMIT * 1000)) * 100;
        els.progressFill.style.width = `${percent}%`;

        const isUrgent = state.timeLeft <= 10;
        els.timerBadge.classList.toggle('urgent', isUrgent);
        els.progressFill.classList.toggle('urgent', isUrgent);
    }

    function updateStandardProgress() {
        els.scoreText.innerHTML = `<span id="score">${state.score}</span>/<span id="total-questions">${state.totalQuestions}</span>`;
        const percent = (state.score / state.totalQuestions) * 100;
        els.progressFill.style.width = `${percent}%`;
    }

    // ======== カード一覧の描画（説明文なし） ========
    function renderCards() {
        els.cardList.innerHTML = '';

        const isOni = state.difficulty === 'oni';
        const isAdvanced = state.difficulty === 'normal' || isOni;

        state.items.forEach((item) => {
            const card = document.createElement('div');
            const isSelected = state.selectedItemId === item.id;
            const isTextOnlyCard = item.kind === 'cycle' && isAdvanced;

            card.className = `bio-card${isSelected ? ' selected' : ''}${isTextOnlyCard ? ' advanced-card' : ''}`;
            card.draggable = true;

            if (item.kind === 'sketch') {
                const svgMarkup = renderCellSvg(item.stageId, item.cellType, {
                    monochrome: isAdvanced,
                    rotated: item.rotated
                });
                const labelText = item.cellType === 'plant'
                    ? (isAdvanced ? '植物細胞' : '🌱 植物細胞')
                    : (isAdvanced ? '動物細胞' : '🐾 動物細胞');

                card.innerHTML = `
                    <div class="cell-thumb">${svgMarkup}</div>
                    <div class="info">
                        <div class="name">${labelText}</div>
                    </div>
                `;
            } else if (isAdvanced) {
                card.innerHTML = `
                    <div class="info">
                        <div class="name">${item.name}</div>
                    </div>
                `;
            } else {
                card.innerHTML = `
                    <div class="feature-icon" style="background-color: ${item.bg}; border: 2px solid ${item.color};">${item.emoji}</div>
                    <div class="info">
                        <div class="name">${item.name}</div>
                    </div>
                `;
            }

            card.addEventListener('click', () => {
                if (!state.isPlaying) return;
                state.selectedItemId = isSelected ? null : item.id;
                renderCards();
            });

            card.addEventListener('dragstart', (e) => {
                if (!state.isPlaying) return;
                state.selectedItemId = item.id;
                e.dataTransfer.effectAllowed = 'move';
                setTimeout(renderCards, 0);
            });

            els.cardList.appendChild(card);
        });
    }

    // ======== ステージボックス検出＆ハイライト ========
    function findStageNodeAtPoint(clientX, clientY) {
        const activeSvg = getActiveSvg();
        const directEl = document.elementFromPoint(clientX, clientY);
        const directNode = directEl ? directEl.closest('.stage-node.interactive-target') : null;
        if (directNode && activeSvg.contains(directNode)) return directNode;

        const pad = 12;
        let closest = null;
        let bestDist = Infinity;

        getActiveStageNodes().forEach((node) => {
            if (!node.classList.contains('interactive-target')) return;
            const box = node.querySelector('.stage-box');
            if (!box) return;
            const r = box.getBoundingClientRect();
            if (
                clientX >= r.left - pad &&
                clientX <= r.right + pad &&
                clientY >= r.top - pad &&
                clientY <= r.bottom + pad
            ) {
                const cx = (r.left + r.right) / 2;
                const cy = (r.top + r.bottom) / 2;
                const dist = Math.hypot(clientX - cx, clientY - cy);
                if (dist < bestDist) {
                    bestDist = dist;
                    closest = node;
                }
            }
        });

        return closest;
    }

    function setActiveStageHighlight(activeNode) {
        getActiveStageNodes().forEach((node) => {
            node.classList.toggle('active-target', node === activeNode);
        });
    }

    // ======== 配置判定 ========
    function handlePlacementAttempt(clientX, clientY) {
        if (!state.isPlaying || !state.selectedItemId) return;

        const targetNode = findStageNodeAtPoint(clientX, clientY);
        if (!targetNode) return;

        const itemIndex = state.items.findIndex((entry) => entry.id === state.selectedItemId);
        if (itemIndex === -1) return;
        const item = state.items[itemIndex];

        // M期と分裂期は左右どちらに入れても正解とする (data-accept="m,mitosis")
        const acceptedIds = (targetNode.dataset.accept || targetNode.dataset.stage || '').split(',');
        const isCorrect = acceptedIds.includes(item.stageId);

        if (isCorrect) {
            state.score++;
            handleCorrectVisual(item, targetNode);

            if (state.difficulty === 'oni') {
                const replacement = pickNextOniItem();
                state.items.splice(itemIndex, 1, replacement);
                updateOniHud();
                showToast(`⭕ 正解！ ${item.stageName}`);
                state.selectedItemId = null;
                renderCards();
            } else {
                state.items.splice(itemIndex, 1);
                updateStandardProgress();
                if (state.score === state.totalQuestions) {
                    handleGameClear();
                } else {
                    showToast(`⭕ 正解！ ${item.stageName}`);
                    state.selectedItemId = null;
                    renderCards();
                }
            }
        } else {
            state.selectedItemId = null;
            renderCards();
            if (state.difficulty === 'oni') {
                showToast(`❌ ミス！ -${ONI_PENALTY_SECONDS}秒`);
                applyOniTimePenalty();
            } else {
                showToast('❌ うーん、そこじゃないみたい...');
            }
        }
    }

    // ======== 正解時のボード演出 ========
    function handleCorrectVisual(item, targetNode) {
        const isOni = state.difficulty === 'oni';

        if (item.kind === 'cycle') {
            // 置いたカードの名称（M期／分裂期を逆に入れた場合もそのまま）を枠に表示
            const labelEl = targetNode.querySelector('.stage-label');
            if (labelEl) {
                labelEl.textContent = item.name;
            }
            targetNode.classList.remove('masked', 'interactive-target', 'active-target');
            targetNode.classList.add('solved');
            return;
        }

        // 細胞スケッチモード：該当ステージにミニ細胞ピンを配置
        const isAdvanced = state.difficulty === 'normal' || isOni;
        const wrapperRect = els.graphWrapper.getBoundingClientRect();
        const boxEl = targetNode.querySelector('.stage-box') || targetNode;
        const boxRect = boxEl.getBoundingClientRect();

        const centerX = ((boxRect.left + boxRect.width / 2 - wrapperRect.left) / wrapperRect.width) * 100;
        const centerY = ((boxRect.top + boxRect.height / 2 - wrapperRect.top) / wrapperRect.height) * 100;

        const pinDir = targetNode.dataset.pinDir || '';
        const count = isOni ? 0 : (state.stagePlacedCount[item.stageId] || 0);
        if (!isOni) {
            state.stagePlacedCount[item.stageId] = count + 1;
        }

        let pinX = centerX;
        let pinY = centerY;

        if (pinDir === 'up') {
            pinX = centerX + (count === 0 ? -3.4 : 3.4);
            pinY = centerY - 10.5;
        } else if (pinDir === 'down') {
            pinX = centerX + (count === 0 ? -3.1 : 3.1);
            pinY = centerY + 10.5;
        } else {
            pinX = isOni ? centerX + 6.6 : centerX + (count === 0 ? -6.6 : 6.6);
            pinY = centerY;
        }

        const pin = document.createElement('div');
        pin.id = `placed-${item.id}`;
        pin.className = 'placed-pin';
        pin.style.left = `${pinX}%`;
        pin.style.top = `${pinY}%`;

        const borderColor = isAdvanced ? '#475569' : item.color;
        const miniSvg = renderCellSvg(item.stageId, item.cellType, {
            monochrome: isAdvanced,
            rotated: item.rotated
        });
        pin.innerHTML = `
            <div class="pin-mini-cell" style="border-color: ${borderColor};">${miniSvg}</div>
        `;

        els.dropZone.appendChild(pin);

        if (isOni) {
            setTimeout(() => pin.classList.add('fade-out'), 800);
            setTimeout(() => pin.remove(), 1200);
        }
    }

    // ======== トースト通知 ========
    function showToast(msg) {
        els.toast.innerHTML = msg;

        if (msg.includes('⭕')) {
            els.toast.style.backgroundColor = 'rgba(13, 148, 136, 0.95)';
        } else if (msg.includes('❌')) {
            els.toast.style.backgroundColor = 'rgba(239, 68, 68, 0.95)';
        } else {
            els.toast.style.backgroundColor = 'rgba(51, 65, 85, 0.95)';
        }

        els.toast.classList.add('show');
        clearTimeout(state.toastTimeout);
        state.toastTimeout = setTimeout(() => {
            els.toast.classList.remove('show');
        }, state.difficulty === 'oni' ? 900 : 1800);
    }

    // ======== クリア＆タイムアップ演出 ========
    function handleGameClear() {
        state.isPlaying = false;
        let displayTime = 3500;
        let unlockHtml = '';

        // 細胞スケッチタブの「ふつう」初回クリア時のみ「おに」解放
        if (state.category === 'sketch' && state.difficulty === 'normal' && !isOniUnlocked('sketch')) {
            localStorage.setItem(getOniUnlockKey(), 'true');
            state.justUnlockedOni = true;
            unlockHtml = '<div class="unlock-message">どこかでとびらがひらいたようだ…！</div>';
            displayTime = 4800;
        }

        els.clearTitle.innerHTML = '🎊 素晴らしい！ 🎊';
        els.clearTitle.style.color = 'var(--primary)';
        els.clearTitle.style.textShadow = '0 4px 10px rgba(13, 148, 136, 0.2)';
        els.clearSubtitle.innerHTML = `すべてマスターしました！${unlockHtml}`;
        els.clearActions.hidden = true;
        els.autoReturnText.hidden = false;

        createConfetti();
        els.clearOverlay.classList.add('active');

        clearTimeout(state.returnTimeout);
        state.returnTimeout = setTimeout(resetToHome, displayTime);
    }

    function handleOniTimeUp() {
        state.isPlaying = false;
        state.selectedItemId = null;

        const storageKey = getOniBestKey();
        const savedRaw = localStorage.getItem(storageKey);
        const prevBest = savedRaw === null ? -1 : Number(savedRaw);
        const isNewRecord = state.score > prevBest;
        const bestScore = isNewRecord ? state.score : prevBest;

        if (isNewRecord) {
            localStorage.setItem(storageKey, String(bestScore));
        }
        updateTabScores();

        const recordBadge = isNewRecord
            ? '<br><span class="record-badge">🎉 NEW RECORD!</span>'
            : '';

        els.clearTitle.innerHTML = '⏱️ タイムアップ！';
        els.clearTitle.style.color = '#0F172A';
        els.clearTitle.style.textShadow = 'none';
        els.clearSubtitle.innerHTML = `
            <div style="font-size: 46px; font-weight: 900; color: var(--primary); line-height: 1.15; margin-bottom: 8px;">${state.score}<span style="font-size: 24px; margin-left: 4px;">問正解！</span></div>
            <div style="font-size: 18px;">ベスト記録：<b>${bestScore} 問</b></div>${recordBadge}
        `;
        els.clearActions.hidden = false;
        els.autoReturnText.hidden = true;

        if (state.score > 0) {
            createConfetti();
        }
        els.clearOverlay.classList.add('active');
    }

    function createConfetti() {
        const colors = ['#0D9488', '#2DD4BF', '#0EA5E9', '#F59E0B', '#8B5CF6'];
        const shapes = ['50%', '0%'];

        document.querySelectorAll('.confetti-piece').forEach((el) => el.remove());

        for (let i = 0; i < 80; i++) {
            const confetti = document.createElement('div');
            confetti.classList.add('confetti-piece');

            confetti.style.left = `${Math.random() * 100}vw`;
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.borderRadius = shapes[Math.floor(Math.random() * shapes.length)];

            const size = Math.random() * 8 + 6;
            confetti.style.width = `${size}px`;
            confetti.style.height = `${size}px`;

            const duration = Math.random() * 3 + 2;
            const delay = Math.random() * 1.5;
            confetti.style.animation = `confettiFall ${duration}s linear ${delay}s forwards`;

            els.clearOverlay.appendChild(confetti);
        }
    }

    function stopTimers() {
        clearInterval(state.timerInterval);
        clearTimeout(state.returnTimeout);
        state.timerInterval = null;
        state.returnTimeout = null;
    }

    function resetToHome() {
        stopTimers();
        state.isPlaying = false;
        els.clearOverlay.classList.remove('active');
        els.dropZone.innerHTML = '';
        els.cardList.innerHTML = '';
        state.score = 0;
        state.selectedItemId = null;

        els.gameScreen.classList.remove('active');
        els.homeScreen.classList.add('active');
        updateDifficultyVisibility(state.justUnlockedOni);
        updateTabScores();
        state.justUnlockedOni = false;
    }

    init();
})();
