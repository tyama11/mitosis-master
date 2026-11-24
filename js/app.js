(() => {
    'use strict';

    const TOTAL_QUESTIONS = STAGE_DATA.length * 2; // 5時期 × 2問 = 10問
    const ONI_TIME_LIMIT = 60;       // 秒
    const ONI_PENALTY_SECONDS = 5;   // ミス時のマイナス秒数
    const ONI_TRAY_SIZE = 3;         // おにモードでトレイに常時並べるカード枚数

    // ======== ゲーム状態 ========
    const state = {
        category: 'sketch',     // 'sketch' | 'feature'
        difficulty: 'easy',     // 'easy' | 'normal' | 'oni'
        score: 0,
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
        ruleOniText: document.getElementById('rule-oni-text'),
        btnOni: document.getElementById('btn-oni'),
        tabScoreSketch: document.getElementById('tab-score-sketch'),
        tabScoreFeature: document.getElementById('tab-score-feature'),
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
        stageNodes: document.querySelectorAll('.stage-node'),
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

        setCategory('sketch');
        updateTabScores();
    }

    // ======== 学習カテゴリ切替＆記録管理 ========
    function getOniBestKey(category) {
        return `mitosis-master-oni-best-${category}`;
    }

    function getOniUnlockKey(category) {
        return `mitosis-master-oni-unlocked-${category}`;
    }

    function isOniUnlocked(category) {
        return localStorage.getItem(getOniUnlockKey(category)) === 'true';
    }

    function updateTabScores() {
        const entries = [
            { category: 'sketch', el: els.tabScoreSketch },
            { category: 'feature', el: els.tabScoreFeature }
        ];
        entries.forEach(({ category, el }) => {
            const saved = localStorage.getItem(getOniBestKey(category));
            if (saved !== null) {
                el.textContent = `👹 ${saved}問`;
                el.hidden = false;
            } else {
                el.hidden = true;
            }
        });
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
        els.ruleOniText.innerHTML = config.oniRule;
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

        const isOni = difficulty === 'oni';
        const isAdvanced = difficulty === 'normal' || isOni;

        els.graphWrapper.classList.toggle('no-subhints', isAdvanced);
        els.graphWrapper.classList.toggle('hide-stage-names', isOni);
        els.progressContainer.classList.toggle('oni-active', isOni);
        els.timerBadge.hidden = !isOni;
        els.timerBadge.classList.remove('urgent', 'penalty-flash');
        els.progressFill.classList.toggle('timer-fill', isOni);
        els.progressFill.classList.remove('urgent');

        if (isOni) {
            state.items = buildInitialOniItems();
            updateOniHud();
            startOniTimer();
        } else {
            state.items = buildStandardItems(state.category);
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

    // ======== 問題アイテム生成 ========
    function buildStandardItems(category) {
        const result = [];
        STAGE_DATA.forEach((stage) => {
            if (category === 'sketch') {
                stage.sketches.forEach((sketch) => {
                    result.push({
                        id: `item-${state.nextItemUid++}`,
                        stageId: stage.id,
                        stageName: stage.stageName,
                        kind: 'sketch',
                        cellType: sketch.cellType,
                        rotated: false,
                        badge: sketch.badge,
                        name: sketch.cellType === 'plant' ? 'タマネギ根端の細胞' : '動物の体細胞',
                        hint: sketch.hint,
                        color: stage.color,
                        bg: stage.bg,
                        targets: stage.targets
                    });
                });
            } else {
                stage.features.forEach((feat) => {
                    result.push({
                        id: `item-${state.nextItemUid++}`,
                        stageId: stage.id,
                        stageName: stage.stageName,
                        kind: 'feature',
                        emoji: feat.emoji,
                        name: feat.text,
                        hint: feat.hint,
                        color: stage.color,
                        bg: stage.bg,
                        targets: stage.targets
                    });
                });
            }
        });
        return result;
    }

    function createRandomOniItem(stage) {
        const uid = `item-${state.nextItemUid++}`;

        if (state.category === 'sketch') {
            const def = stage.oniSketches[Math.floor(Math.random() * stage.oniSketches.length)];
            return {
                id: uid,
                stageId: stage.id,
                stageName: stage.stageName,
                kind: 'sketch',
                cellType: def.cellType,
                rotated: Boolean(def.rotated),
                badge: def.badge,
                name: def.cellType === 'plant' ? '植物細胞スケッチ' : '動物細胞スケッチ',
                hint: '',
                color: stage.color,
                bg: stage.bg,
                targets: stage.targets
            };
        }

        const feat = stage.oniFeatures[Math.floor(Math.random() * stage.oniFeatures.length)];
        return {
            id: uid,
            stageId: stage.id,
            stageName: stage.stageName,
            kind: 'feature',
            emoji: '',
            name: feat.text,
            hint: '',
            color: stage.color,
            bg: stage.bg,
            targets: stage.targets
        };
    }

    function buildInitialOniItems() {
        const pool = [...STAGE_DATA];
        shuffleArray(pool);
        return pool.slice(0, ONI_TRAY_SIZE).map((stage) => createRandomOniItem(stage));
    }

    function pickNextOniItem() {
        const activeStageIds = new Set(state.items.map((item) => item.stageId));
        const candidates = STAGE_DATA.filter((stage) => !activeStageIds.has(stage.id));
        const source = candidates.length > 0 ? candidates : STAGE_DATA;
        const chosen = source[Math.floor(Math.random() * source.length)];
        return createRandomOniItem(chosen);
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
        els.scoreText.innerHTML = `<span id="score">${state.score}</span>/<span id="total-questions">${TOTAL_QUESTIONS}</span>`;
        const percent = (state.score / TOTAL_QUESTIONS) * 100;
        els.progressFill.style.width = `${percent}%`;
    }

    // ======== カード一覧の描画 ========
    function renderCards() {
        els.cardList.innerHTML = '';

        const isOni = state.difficulty === 'oni';
        const isAdvanced = state.difficulty === 'normal' || isOni;
        const visibleItems = isOni
            ? state.items
            : state.items.filter((item) => !document.getElementById(`placed-${item.id}`));

        visibleItems.forEach((item) => {
            const card = document.createElement('div');
            const isSelected = state.selectedItemId === item.id;
            card.className = `bio-card${isSelected ? ' selected' : ''}`;
            card.draggable = true;

            if (item.kind === 'sketch') {
                const svgMarkup = renderCellSvg(item.stageId, item.cellType, {
                    monochrome: isAdvanced,
                    rotated: item.rotated
                });
                const hintHtml = (state.difficulty === 'easy')
                    ? `<div class="hint">${item.hint}</div>`
                    : '';
                const badgeText = isAdvanced
                    ? (item.cellType === 'plant' ? '植物細胞' : '動物細胞')
                    : item.badge;

                card.innerHTML = `
                    <div class="cell-thumb">${svgMarkup}</div>
                    <div class="info">
                        <span class="cell-type-badge">${badgeText}</span>
                        <div class="name">${item.name}</div>
                        ${hintHtml}
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
                        <div class="hint">${item.hint}</div>
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
        const directEl = document.elementFromPoint(clientX, clientY);
        const directNode = directEl ? directEl.closest('.stage-node') : null;
        if (directNode) return directNode;

        // 指タップ等でボックス境界のすぐ近くを押した場合も吸着させる
        const pad = 16;
        let closest = null;
        let bestDist = Infinity;

        els.stageNodes.forEach((node) => {
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
        els.stageNodes.forEach((node) => {
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

        const isCorrect = targetNode.dataset.stage === item.stageId;

        if (isCorrect) {
            state.score++;
            placePinOnBoard(item, targetNode);

            if (state.difficulty === 'oni') {
                const replacement = pickNextOniItem();
                state.items.splice(itemIndex, 1, replacement);
                updateOniHud();
                showToast(`⭕ 正解！ ${item.stageName}`);
                state.selectedItemId = null;
                renderCards();
            } else {
                updateStandardProgress();
                if (state.score === TOTAL_QUESTIONS) {
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
                showToast('❌ うーん、違う時期みたい...');
            }
        }
    }

    // ======== ボード上に正解ピンを配置 ========
    function placePinOnBoard(item, targetNode) {
        const isOni = state.difficulty === 'oni';
        const isAdvanced = state.difficulty === 'normal' || isOni;

        // 対象ステージボックスの実際の画面座標から正確な%位置を算出
        const wrapperRect = els.graphWrapper.getBoundingClientRect();
        const boxEl = targetNode.querySelector('.stage-box') || targetNode;
        const boxRect = boxEl.getBoundingClientRect();

        const centerX = ((boxRect.left + boxRect.width / 2 - wrapperRect.left) / wrapperRect.width) * 100;
        const centerY = ((boxRect.top + boxRect.height / 2 - wrapperRect.top) / wrapperRect.height) * 100;

        let pinX = centerX;
        let pinY = centerY + 6.5;

        if (!isOni) {
            const count = state.stagePlacedCount[item.stageId] || 0;
            state.stagePlacedCount[item.stageId] = count + 1;
            // 各時期2問ずつなのでボックス下辺の左右に並べて配置
            pinX = centerX + (count === 0 ? -6.5 : 6.5);
        }

        const pin = document.createElement('div');
        pin.id = `placed-${item.id}`;
        pin.className = 'placed-pin';
        pin.style.left = `${pinX}%`;
        pin.style.top = `${pinY}%`;

        const borderColor = isAdvanced ? '#475569' : item.color;

        if (item.kind === 'sketch') {
            const miniSvg = renderCellSvg(item.stageId, item.cellType, {
                monochrome: isAdvanced,
                rotated: item.rotated
            });
            pin.innerHTML = `
                <div class="pin-mini-cell" style="border-color: ${borderColor};">${miniSvg}</div>
                <div class="pin-label" style="border-color: ${borderColor};">${item.stageName}</div>
            `;
        } else {
            const shortLabel = item.name.length > 10 ? `${item.name.slice(0, 10)}…` : item.name;
            pin.innerHTML = `
                <div class="pin-label" style="border-color: ${borderColor};">${shortLabel}</div>
            `;
        }

        els.dropZone.appendChild(pin);

        if (isOni) {
            setTimeout(() => pin.classList.add('fade-out'), 850);
            setTimeout(() => pin.remove(), 1250);
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

        if (state.difficulty === 'normal' && !isOniUnlocked(state.category)) {
            localStorage.setItem(getOniUnlockKey(state.category), 'true');
            state.justUnlockedOni = true;
            unlockHtml = '<div class="unlock-message">どこかでとびらがひらいたようだ…！</div>';
            displayTime = 4800;
        }

        els.clearTitle.innerHTML = '🎊 素晴らしい！ 🎊';
        els.clearTitle.style.color = 'var(--primary)';
        els.clearTitle.style.textShadow = '0 4px 10px rgba(13, 148, 136, 0.2)';
        els.clearSubtitle.innerHTML = `体細胞分裂のすべての時期をマスターしました！${unlockHtml}`;
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

        const storageKey = getOniBestKey(state.category);
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
