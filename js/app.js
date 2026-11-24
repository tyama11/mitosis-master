(() => {
    'use strict';

    const ONI_TIME_LIMIT = 60;          // 秒
    const ONI_PENALTY_SECONDS = 5;      // ミス時のマイナス秒数
    const ONI_COMBO_STEP = 5;           // 何連続正解ごとに時間回復するか
    const ONI_BONUS_SECONDS = 3;        // コンボボーナス秒数
    const ONI_TRAY_SIZE = 3;            // おにモードでトレイに常時並べるカード枚数
    const TRICK_SKETCH_CHANCE = 0.28;   // スケッチ「おに」でひっかけ図が混ざる確率

    // ======== ゲーム状態 ========
    const state = {
        category: 'cycle',      // 'cycle' | 'sketch'
        difficulty: 'easy',     // 'easy' | 'normal' | 'oni'
        score: 0,
        combo: 0,
        maxCombo: 0,
        totalQuestions: 10,
        selectedItemId: null,
        currentOniTargetStageId: null,
        items: [],
        stagePlacedCount: {},
        nextItemUid: 0,
        timeLeft: ONI_TIME_LIMIT,
        lastTickSecond: -1,
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
        mainArea: document.querySelector('.main'),
        homeDesc: document.getElementById('home-desc'),
        ruleOniItem: document.getElementById('rule-oni-item'),
        btnOni: document.getElementById('btn-oni'),
        homeMuteBtn: document.getElementById('home-mute-btn'),
        gameMuteBtn: document.getElementById('game-mute-btn'),
        tabScoreCycle: document.getElementById('tab-score-cycle'),
        tabScoreSketch: document.getElementById('tab-score-sketch'),
        categoryTabs: document.querySelectorAll('.category-tab'),
        modeButtons: document.querySelectorAll('.mode-btn'),
        homeBtn: document.getElementById('home-btn'),
        modeDisplay: document.getElementById('mode-display'),
        trayTitleText: document.getElementById('tray-title-text'),
        trayHint: document.getElementById('tray-hint'),
        progressContainer: document.getElementById('progress-container'),
        timerBadge: document.getElementById('timer-badge'),
        timerText: document.getElementById('timer-text'),
        comboBadge: document.getElementById('combo-badge'),
        scoreText: document.getElementById('score-text'),
        progressFill: document.getElementById('progress-fill'),
        graphWrapper: document.getElementById('graph-wrapper'),
        linearSvg: document.getElementById('linear-svg'),
        circleSvg: document.getElementById('circle-svg'),
        oniCycleSvg: document.getElementById('oni-cycle-svg'),
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

    function isOniSingleBlankMode() {
        return state.difficulty === 'oni';
    }

    function getActiveSvg() {
        if (state.difficulty === 'oni') return els.oniCycleSvg;
        return state.difficulty === 'easy' ? els.linearSvg : els.circleSvg;
    }

    function getActiveStageNodes() {
        return getActiveSvg().querySelectorAll('.stage-node');
    }

    // ======== 初期化 ========
    function init() {
        els.categoryTabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                SOUND_FX.playTap();
                setCategory(tab.dataset.category);
            });
        });

        els.modeButtons.forEach((btn) => {
            btn.addEventListener('click', () => {
                SOUND_FX.playTap();
                startGame(btn.dataset.difficulty);
            });
        });

        els.homeBtn.addEventListener('click', () => {
            SOUND_FX.playTap();
            resetToHome();
        });

        els.overlayHomeBtn.addEventListener('click', () => {
            SOUND_FX.playTap();
            resetToHome();
        });

        els.retryBtn.addEventListener('click', () => {
            SOUND_FX.playTap();
            els.clearOverlay.classList.remove('active');
            startGame(state.difficulty);
        });

        // 効果音ミュート切替
        const handleMuteClick = () => {
            SOUND_FX.toggleMute();
            syncMuteButtons();
        };
        els.homeMuteBtn.addEventListener('click', handleMuteClick);
        els.gameMuteBtn.addEventListener('click', handleMuteClick);
        syncMuteButtons();

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

    function syncMuteButtons() {
        const muted = SOUND_FX.isMuted();
        els.homeMuteBtn.textContent = muted ? '🔇 音OFF' : '🔊 音ON';
        els.gameMuteBtn.textContent = muted ? '🔇' : '🔊';
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
            { category: 'cycle', el: els.tabScoreCycle },
            { category: 'sketch', el: els.tabScoreSketch }
        ];
        entries.forEach(({ category, el }) => {
            const saved = localStorage.getItem(getOniBestKey(category));
            if (saved !== null) {
                const bestNum = Number(saved);
                const rankInfo = getOniRankInfo(category, bestNum);
                el.textContent = `${rankInfo.icon} ${rankInfo.rank}・${bestNum}問`;
                el.classList.toggle('rank-s', rankInfo.rank === 'S');
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
        updateDifficultyVisibility();
    }

    // ======== ゲーム開始 ========
    function startGame(difficulty) {
        stopTimers();
        state.difficulty = difficulty;
        state.score = 0;
        state.combo = 0;
        state.maxCombo = 0;
        state.selectedItemId = null;
        state.currentOniTargetStageId = null;
        state.stagePlacedCount = {};
        state.nextItemUid = 0;
        state.timeLeft = ONI_TIME_LIMIT;
        state.lastTickSecond = -1;
        state.isPlaying = true;

        els.dropZone.innerHTML = '';
        updateComboBadge();

        const isEasy = difficulty === 'easy';
        const isOni = difficulty === 'oni';
        const isSketch = state.category === 'sketch';

        els.linearSvg.classList.toggle('active-board', !isOni && isEasy);
        els.circleSvg.classList.toggle('active-board', !isOni && !isEasy);
        els.oniCycleSvg.classList.toggle('active-board', isOni);

        els.graphWrapper.classList.toggle('sketch-mode', !isOni && isSketch);
        els.progressContainer.classList.toggle('oni-active', isOni);
        els.timerBadge.hidden = !isOni;
        els.timerBadge.classList.remove('urgent', 'penalty-flash', 'bonus-flash');
        els.scoreText.hidden = !isOni; // かんたん・ふつうではスコアを表示せず、おにのみ表示
        els.progressFill.classList.toggle('timer-fill', isOni);
        els.progressFill.classList.remove('urgent');

        const categoryConfig = CATEGORY_CONFIG[state.category];
        els.modeDisplay.textContent = `${categoryConfig.label} / ${DIFFICULTY_LABELS[difficulty]}`;

        if (isOni) {
            // 両タブとも「おに」は1箇所だけの空欄「？」に入るカードを3択から選ぶ形式
            els.trayTitleText.textContent = isSketch ? '❓ ？の時期の細胞は？' : '❓ ？に入るのは？';
            els.trayHint.textContent = '👆タップで回答';
            setupNextOniQuestion();
            updateOniHud();
            startOniTimer();
        } else {
            els.trayTitleText.textContent = categoryConfig.trayTitle;
            els.trayHint.textContent = '👆タップで選択';
            setupStaticBoardNodes(state.category, difficulty);
            state.items = buildStandardItems(state.category);
            state.totalQuestions = state.items.length;
            shuffleArray(state.items);
            updateStandardProgress();
            renderCards();
        }

        els.homeScreen.classList.remove('active');
        els.gameScreen.classList.add('active');

        showToast(isOni ? categoryConfig.oniToast : categoryConfig.startToast);
    }

    function setupStaticBoardNodes(category, difficulty) {
        const isOni = difficulty === 'oni';

        [els.linearSvg, els.circleSvg].forEach((svg) => {
            svg.querySelectorAll('.stage-node').forEach((node) => {
                node.classList.remove('solved', 'active-target', 'interactive-target', 'masked');
                const labelEl = node.querySelector('.stage-label');
                if (labelEl && node.dataset.defaultLabel) {
                    labelEl.textContent = node.dataset.defaultLabel;
                }
            });
        });

        getActiveStageNodes().forEach((node) => {
            if (category === 'cycle') {
                node.classList.add('interactive-target', 'masked');
            } else {
                const isSketchTarget = node.classList.contains('sketch-target');
                node.classList.toggle('interactive-target', isSketchTarget);
                node.classList.toggle('masked', isOni);
            }
        });
    }

    // ======== コンボ＆画面シェイク演出 ========
    function updateComboBadge() {
        // コンボ表示もおにモードのみ
        if (state.difficulty === 'oni' && state.combo >= 2) {
            els.comboBadge.textContent = `🔥 ${state.combo} COMBO`;
            els.comboBadge.hidden = false;
            els.comboBadge.style.animation = 'none';
            void els.comboBadge.offsetWidth;
            els.comboBadge.style.animation = '';
        } else {
            els.comboBadge.hidden = true;
        }
    }

    function triggerErrorShake() {
        els.mainArea.classList.remove('shake-error');
        void els.mainArea.offsetWidth;
        els.mainArea.classList.add('shake-error');
    }

    function registerCorrectAnswer(displayLabel) {
        state.score++;
        const isOni = state.difficulty === 'oni';

        if (isOni) {
            state.combo++;
            state.maxCombo = Math.max(state.maxCombo, state.combo);
            updateComboBadge();

            if (state.combo > 0 && state.combo % ONI_COMBO_STEP === 0) {
                applyOniTimeBonus(ONI_BONUS_SECONDS);
                SOUND_FX.playBonus();
                showToast(`🔥 ${state.combo}連続正解！ ⏱️ +${ONI_BONUS_SECONDS}秒！`);
            } else {
                SOUND_FX.playCorrect(state.combo);
                const comboSuffix = state.combo >= 3 ? ` (🔥${state.combo}連続)` : '';
                showToast(`⭕ 正解！ ${displayLabel}${comboSuffix}`);
            }
        } else {
            SOUND_FX.playCorrect(1);
            showToast(`⭕ 正解！ ${displayLabel}`);
        }
    }

    function registerWrongAnswer() {
        state.combo = 0;
        updateComboBadge();
        SOUND_FX.playWrong();
        triggerErrorShake();
    }

    // ======== 「おに」共通（細胞周期・細胞スケッチ）：1箇所だけ空欄「？」＆3択問題生成 ========
    function setupNextOniQuestion() {
        state.selectedItemId = null;

        if (state.category === 'sketch') {
            // スケッチ「おに」：5時期（間期・前期〜終期）のうち1箇所だけを「？」にし、3枚の細胞スケッチから選ばせる
            const stageCandidates = SKETCH_STAGES.filter((s) => s.id !== state.currentOniTargetStageId);
            const correctStage = stageCandidates[Math.floor(Math.random() * stageCandidates.length)];
            state.currentOniTargetStageId = correctStage.id;

            els.oniCycleSvg.innerHTML = ONI_BOARD_GENERATOR.generateRandomCycleBoardSvg(correctStage.id);

            const otherStages = SKETCH_STAGES.filter((s) => s.id !== correctStage.id);
            shuffleArray(otherStages);
            const chosenStages = [correctStage, ...otherStages.slice(0, ONI_TRAY_SIZE - 1)];
            const choices = chosenStages.map((st) => createOniItemForSketch(st));
            shuffleArray(choices);
            state.items = choices;

            renderCards();
            return;
        }

        // 細胞周期「おに」：全10項目のうち1箇所だけを「？」にし、3枚の名称カードから選ばせる
        const candidates = CYCLE_ITEMS.filter((c) => c.stageId !== state.currentOniTargetStageId);
        const correctEntry = candidates[Math.floor(Math.random() * candidates.length)];
        state.currentOniTargetStageId = correctEntry.stageId;

        const svgMarkup = ONI_BOARD_GENERATOR.generateRandomCycleBoardSvg(correctEntry.stageId);
        els.oniCycleSvg.innerHTML = svgMarkup;

        const hasBothMitosisSynonyms = svgMarkup.includes('data-stage="m"') && svgMarkup.includes('data-stage="mitosis"');
        const distractorPool = CYCLE_ITEMS.filter((c) => {
            if (c.stageId === correctEntry.stageId) return false;
            if (!hasBothMitosisSynonyms) {
                if (correctEntry.stageId === 'm' && c.stageId === 'mitosis') return false;
                if (correctEntry.stageId === 'mitosis' && c.stageId === 'm') return false;
            }
            return true;
        });
        shuffleArray(distractorPool);
        const choices = [correctEntry, ...distractorPool.slice(0, ONI_TRAY_SIZE - 1)].map((entry) => ({
            id: `item-${state.nextItemUid++}`,
            stageId: entry.stageId,
            stageName: entry.name,
            kind: 'cycle',
            name: entry.name
        }));
        shuffleArray(choices);
        state.items = choices;

        renderCards();
    }

    function submitOniSingleBlankAnswer(item) {
        if (!state.isPlaying) return;

        if (item.stageId === state.currentOniTargetStageId) {
            registerCorrectAnswer(item.stageName || item.name);
            updateOniHud();
            setupNextOniQuestion();
        } else {
            registerWrongAnswer();
            showToast(`❌ ミス！ -${ONI_PENALTY_SECONDS}秒`);
            const ended = applyOniTimePenalty();
            if (!ended) {
                setupNextOniQuestion();
            }
        }
    }

    // ======== 通常・スケッチおに問題生成（ひっかけスケッチ対応） ========
    function buildStandardItems(category) {
        if (category === 'cycle') {
            return CYCLE_ITEMS.map((entry) => ({
                id: `item-${state.nextItemUid++}`,
                stageId: entry.stageId,
                stageName: entry.name,
                kind: 'cycle',
                emoji: entry.emoji,
                name: entry.name,
                hint: entry.hint || '',
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
                    variant: 'standard',
                    label: sketch.cellType === 'plant' ? '植物細胞' : '動物細胞',
                    hint: sketch.hint || '',
                    color: stage.color
                });
            });
        });
        return result;
    }

    function createOniItemForSketch(stage) {
        const useTrick = stage.trickOni && stage.trickOni.length > 0 && Math.random() < TRICK_SKETCH_CHANCE;
        const pool = useTrick ? stage.trickOni : stage.normalOni;
        const def = pool[Math.floor(Math.random() * pool.length)];

        return {
            id: `item-${state.nextItemUid++}`,
            stageId: stage.id,
            stageName: stage.stageName,
            kind: 'sketch',
            cellType: def.cellType,
            rotated: Boolean(def.rotated),
            variant: def.variant || 'standard',
            label: def.label || (def.cellType === 'plant' ? '植物細胞' : '動物細胞'),
            color: stage.color
        };
    }

    function buildInitialSketchOniItems() {
        const pool = [...SKETCH_STAGES];
        shuffleArray(pool);
        return pool.slice(0, ONI_TRAY_SIZE).map(createOniItemForSketch);
    }

    function pickNextSketchOniItem() {
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

    // ======== おにモード タイマー＆時間増減 ========
    function startOniTimer() {
        state.oniEndTime = Date.now() + ONI_TIME_LIMIT * 1000;

        state.timerInterval = setInterval(() => {
            const remainingMs = Math.max(0, state.oniEndTime - Date.now());
            state.timeLeft = Math.ceil(remainingMs / 1000);

            if (state.timeLeft <= 10 && state.timeLeft > 0 && state.timeLeft !== state.lastTickSecond) {
                state.lastTickSecond = state.timeLeft;
                SOUND_FX.playTick();
            }

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

        els.timerBadge.classList.remove('bonus-flash');
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

    function applyOniTimeBonus(seconds) {
        state.oniEndTime += seconds * 1000;
        const remainingMs = Math.max(0, state.oniEndTime - Date.now());
        state.timeLeft = Math.ceil(remainingMs / 1000);
        updateOniHud(remainingMs);

        els.timerBadge.classList.remove('penalty-flash');
        els.timerBadge.classList.add('bonus-flash');
        setTimeout(() => {
            els.timerBadge.classList.remove('bonus-flash');
        }, 420);
    }

    function updateOniHud(remainingMs = state.timeLeft * 1000) {
        els.timerText.textContent = state.timeLeft;
        els.scoreText.textContent = `🏆 ${state.score}問`;

        const percent = Math.min(100, (remainingMs / (ONI_TIME_LIMIT * 1000)) * 100);
        els.progressFill.style.width = `${percent}%`;

        const isUrgent = state.timeLeft <= 10;
        els.timerBadge.classList.toggle('urgent', isUrgent);
        els.progressFill.classList.toggle('urgent', isUrgent);
    }

    function updateStandardProgress() {
        const percent = (state.score / state.totalQuestions) * 100;
        els.progressFill.style.width = `${percent}%`;
    }

    // ======== カード一覧の描画 ========
    function renderCards() {
        els.cardList.innerHTML = '';

        const isOni = state.difficulty === 'oni';
        const isAdvanced = state.difficulty === 'normal' || isOni;
        const singleBlankOni = isOniSingleBlankMode();

        state.items.forEach((item) => {
            const card = document.createElement('div');
            const isSelected = state.selectedItemId === item.id;
            const isTextOnlyCard = item.kind === 'cycle' && isAdvanced;

            card.className = `bio-card${isSelected ? ' selected' : ''}${isTextOnlyCard ? ' advanced-card' : ''}`;
            card.draggable = true;

            if (item.kind === 'sketch') {
                const svgMarkup = renderCellSvg(item.stageId, item.cellType, {
                    monochrome: isAdvanced,
                    rotated: item.rotated,
                    variant: item.variant || 'standard'
                });
                const labelText = isAdvanced
                    ? item.label
                    : (item.cellType === 'plant' ? '🌱 植物細胞' : '🐾 動物細胞');
                const hintHtml = (!isAdvanced && item.hint)
                    ? `<div class="hint">${item.hint}</div>`
                    : '';

                card.innerHTML = `
                    <div class="cell-thumb">${svgMarkup}</div>
                    <div class="info">
                        <div class="name">${labelText}</div>
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
                const hintHtml = item.hint ? `<div class="hint">${item.hint}</div>` : '';
                card.innerHTML = `
                    <div class="feature-icon" style="background-color: ${item.bg}; border: 2px solid ${item.color};">${item.emoji}</div>
                    <div class="info">
                        <div class="name">${item.name}</div>
                        ${hintHtml}
                    </div>
                `;
            }

            card.addEventListener('click', () => {
                if (!state.isPlaying) return;
                if (singleBlankOni) {
                    submitOniSingleBlankAnswer(item);
                    return;
                }
                SOUND_FX.playTap();
                state.selectedItemId = isSelected ? null : item.id;
                renderCards();
            });

            card.addEventListener('dragstart', (e) => {
                if (!state.isPlaying) return;
                state.selectedItemId = item.id;
                e.dataTransfer.effectAllowed = 'move';
                if (!singleBlankOni) {
                    setTimeout(renderCards, 0);
                }
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

        if (isOniSingleBlankMode()) {
            submitOniSingleBlankAnswer(item);
            return;
        }

        const acceptedIds = (targetNode.dataset.accept || targetNode.dataset.stage || '').split(',');
        const isCorrect = acceptedIds.includes(item.stageId);

        if (isCorrect) {
            registerCorrectAnswer(item.stageName);

            if (state.difficulty === 'oni') {
                els.dropZone.innerHTML = '';
                els.oniCycleSvg.innerHTML = ONI_BOARD_GENERATOR.generateRandomSketchBoardSvg();
                const replacement = pickNextSketchOniItem();
                state.items.splice(itemIndex, 1, replacement);
                updateOniHud();
                state.selectedItemId = null;
                renderCards();
            } else {
                handleCorrectVisual(item, targetNode);
                state.items.splice(itemIndex, 1);
                updateStandardProgress();
                if (state.score === state.totalQuestions) {
                    handleGameClear();
                } else {
                    state.selectedItemId = null;
                    renderCards();
                }
            }
        } else {
            registerWrongAnswer();
            state.selectedItemId = null;
            renderCards();
            if (state.difficulty === 'oni') {
                showToast(`❌ ミス！ -${ONI_PENALTY_SECONDS}秒`);
                const ended = applyOniTimePenalty();
                if (!ended) {
                    els.dropZone.innerHTML = '';
                    els.oniCycleSvg.innerHTML = ONI_BOARD_GENERATOR.generateRandomSketchBoardSvg();
                }
            } else {
                showToast('❌ うーん、そこじゃないみたい...');
            }
        }
    }

    // ======== 正解時のボード演出 ========
    function handleCorrectVisual(item, targetNode) {
        const isOni = state.difficulty === 'oni';

        if (item.kind === 'cycle') {
            const labelEl = targetNode.querySelector('.stage-label');
            if (labelEl) {
                labelEl.textContent = item.name;
            }
            targetNode.classList.remove('masked', 'interactive-target', 'active-target');
            targetNode.classList.add('solved');
            return;
        }

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
            rotated: item.rotated,
            variant: item.variant || 'standard'
        });
        pin.innerHTML = `
            <div class="pin-mini-cell" style="border-color: ${borderColor};">${miniSvg}</div>
        `;

        els.dropZone.appendChild(pin);
    }

    // ======== トースト通知 ========
    function showToast(msg) {
        els.toast.innerHTML = msg;

        if (msg.includes('🔥') || msg.includes('⭕')) {
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
        }, state.difficulty === 'oni' ? 950 : 1800);
    }

    // ======== クリア＆タイムアップ演出 ========
    function handleGameClear() {
        state.isPlaying = false;
        let displayTime = 3500;
        let unlockHtml = '';
        let unlockedNow = false;

        if (state.difficulty === 'normal' && !isOniUnlocked(state.category)) {
            localStorage.setItem(getOniUnlockKey(state.category), 'true');
            state.justUnlockedOni = true;
            unlockedNow = true;
            unlockHtml = '<div class="unlock-message">どこかでとびらがひらいたようだ…！</div>';
            displayTime = 4800;
        }

        SOUND_FX.playClear(unlockedNow);

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

        const storageKey = getOniBestKey(state.category);
        const savedRaw = localStorage.getItem(storageKey);
        const prevBest = savedRaw === null ? -1 : Number(savedRaw);
        const isNewRecord = state.score > prevBest;
        const bestScore = isNewRecord ? state.score : prevBest;

        if (isNewRecord) {
            localStorage.setItem(storageKey, String(bestScore));
        }
        updateTabScores();

        const rankInfo = getOniRankInfo(state.category, state.score);
        SOUND_FX.playTimeUp(rankInfo.rank === 'S' || rankInfo.rank === 'A');

        const recordBadge = isNewRecord
            ? '<br><span class="record-badge">🎉 NEW RECORD!</span>'
            : '';

        els.clearTitle.innerHTML = '⏱️ タイムアップ！';
        els.clearTitle.style.color = '#0F172A';
        els.clearTitle.style.textShadow = 'none';
        els.clearSubtitle.innerHTML = `
            <div class="rank-showcase ${rankInfo.className}">
                <span class="rank-letter">${rankInfo.rank}</span>
                <span class="rank-title-text">${rankInfo.icon} ${rankInfo.title}</span>
            </div>
            <div style="font-size: 46px; font-weight: 900; color: var(--primary); line-height: 1.12; margin-bottom: 6px;">${state.score}<span style="font-size: 24px; margin-left: 4px;">問正解！</span></div>
            <div style="font-size: 15px; color: #64748B; margin-bottom: 4px;">最大コンボ：🔥 ${state.maxCombo} 連続</div>
            <div style="font-size: 17px;">ベスト記録：<b>${bestScore} 問</b></div>${recordBadge}
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
        state.combo = 0;
        state.selectedItemId = null;
        updateComboBadge();

        els.gameScreen.classList.remove('active');
        els.homeScreen.classList.add('active');
        updateDifficultyVisibility(state.justUnlockedOni);
        updateTabScores();
        state.justUnlockedOni = false;
    }

    init();
})();
