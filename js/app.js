import { renderCellSvg } from './cells.js';
import { CATEGORY_CONFIG, DIFFICULTY_LABELS, getOniRankInfo } from './data.js';
import { byId, bySelector } from './dom.js';
import {
    ONI_BONUS_SECONDS,
    ONI_PENALTY_SECONDS,
    ONI_TIME_LIMIT,
    buildOniQuestion,
    buildStandardItems,
    computeRemainingSeconds,
    isBonusCombo,
    isStageMatch
} from './game-logic.js';
import { shuffleInPlace } from './random.js';
import { createSoundFx } from './sound.js';
import { createProgressStore, safeLocalStorage } from './storage.js';
                                                                           

                     
                       
                           
                  
                  
                     
                           
                                  
                                                 
                  
                                                            
                        
                     
                           
                       
                       
                             
                                                         
                                                       
                                                        
 

const storage = safeLocalStorage();
const progress = createProgressStore(storage);
const SOUND_FX = createSoundFx(storage);

const state            = {
    category: 'cycle',
    difficulty: 'easy',
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

const els = {
    homeScreen: byId('home-screen'),
    gameScreen: byId('game-screen'),
    mainArea: bySelector('.main'),
    homeDesc: byId('home-desc'),
    earnedTitleBanner: byId('earned-title-banner'),
    ruleNormalText: byId('rule-normal-text'),
    ruleOniItem: byId('rule-oni-item'),
    ruleOniText: byId('rule-oni-text'),
    btnOni: byId                   ('btn-oni'),
    homeMuteBtn: byId                   ('home-mute-btn'),
    gameMuteBtn: byId                   ('game-mute-btn'),
    tabScoreCycle: byId('tab-score-cycle'),
    tabScoreSketch: byId('tab-score-sketch'),
    categoryTabs: document.querySelectorAll                   ('.category-tab'),
    modeButtons: document.querySelectorAll                   ('.mode-btn'),
    homeBtn: byId                   ('home-btn'),
    modeDisplay: byId('mode-display'),
    trayTitleText: byId('tray-title-text'),
    trayHint: byId('tray-hint'),
    progressContainer: byId('progress-container'),
    timerBadge: byId('timer-badge'),
    timerText: byId('timer-text'),
    comboBadge: byId('combo-badge'),
    scoreText: byId('score-text'),
    progressFill: byId('progress-fill'),
    graphWrapper: byId('graph-wrapper'),
    linearSvg: byId               ('linear-svg'),
    circleSvg: byId               ('circle-svg'),
    oniCycleSvg: byId               ('oni-cycle-svg'),
    dropZone: byId('drop-zone'),
    cardList: byId('card-list'),
    toast: byId('toast'),
    clearOverlay: byId('clear-overlay'),
    clearTitle: byId('clear-title'),
    clearSubtitle: byId('clear-subtitle'),
    clearActions: byId('clear-actions'),
    autoReturnText: byId('auto-return-text'),
    retryBtn: byId                   ('retry-btn'),
    overlayHomeBtn: byId                   ('overlay-home-btn')
};

function isOniSingleBlankMode()          {
    return state.difficulty === 'oni';
}

function getActiveSvg()                {
    if (state.difficulty === 'oni') return els.oniCycleSvg;
    return state.difficulty === 'easy' ? els.linearSvg : els.circleSvg;
}

function getActiveStageNodes()                          {
    return getActiveSvg().querySelectorAll             ('.stage-node');
}

function init()       {
    els.categoryTabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            SOUND_FX.playTap();
            const cat = tab.dataset['category'];
            if (cat === 'cycle' || cat === 'sketch') {
                setCategory(cat);
            }
        });
    });

    els.modeButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            SOUND_FX.playTap();
            const diff = btn.dataset['difficulty'];
            if (diff === 'easy' || diff === 'normal' || diff === 'oni') {
                startGame(diff);
            }
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

    const handleMuteClick = ()       => {
        SOUND_FX.toggleMute();
        syncMuteButtons();
    };
    els.homeMuteBtn.addEventListener('click', handleMuteClick);
    els.gameMuteBtn.addEventListener('click', handleMuteClick);
    syncMuteButtons();

    els.graphWrapper.addEventListener('mousemove', (e) => {
        const node = findStageNodeAtPoint(e.clientX, e.clientY);
        setActiveStageHighlight(node);
    });

    els.graphWrapper.addEventListener('mouseleave', () => {
        setActiveStageHighlight(null);
    });

    els.graphWrapper.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'move';
        }
        const node = findStageNodeAtPoint(e.clientX, e.clientY);
        setActiveStageHighlight(node);
    });

    els.graphWrapper.addEventListener('dragleave', (e) => {
        if (!els.graphWrapper.contains(e.relatedTarget               )) {
            setActiveStageHighlight(null);
        }
    });

    els.graphWrapper.addEventListener('drop', (e) => {
        e.preventDefault();
        setActiveStageHighlight(null);
        handlePlacementAttempt(e.clientX, e.clientY);
    });

    els.graphWrapper.addEventListener('click', (e) => {
        if (e.detail === 0) return;
        handlePlacementAttempt(e.clientX, e.clientY);
    });

    els.graphWrapper.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const target = e.target                  ;
        const node = target?.closest             ('.stage-node') ?? null;
        if (!node || !node.classList.contains('interactive-target')) return;
        e.preventDefault();
        placeOnFocusedStage(node);
    });

    document.addEventListener('keydown', handleGlobalKeydown);

    setCategory('cycle');
    updateTabScores();
}

function syncMuteButtons()       {
    const muted = SOUND_FX.isMuted();
    els.homeMuteBtn.textContent = muted ? '🔇 音OFF' : '🔊 音ON';
    els.gameMuteBtn.textContent = muted ? '🔇' : '🔊';
}

function updateTabScores()       {
    const entries                                                         = [
        { category: 'cycle', el: els.tabScoreCycle },
        { category: 'sketch', el: els.tabScoreSketch }
    ];
    entries.forEach(({ category, el }) => {
        const saved = progress.getOniBest(category);
        if (saved !== null) {
            el.textContent = `👹 ${saved}問`;
            el.classList.remove('rank-s');
            el.hidden = false;
        } else {
            el.hidden = true;
        }
    });
    updateCurrentCategoryTitle();
}

function updateCurrentCategoryTitle()       {
    const saved = progress.getOniBest(state.category);
    if (saved === null) {
        els.earnedTitleBanner.hidden = true;
        return;
    }
    const rankInfo = getOniRankInfo(state.category, saved);
    els.earnedTitleBanner.className = `earned-title-banner ${rankInfo.className}`;
    els.earnedTitleBanner.textContent = `称号：${rankInfo.icon} ${rankInfo.title}`;
    els.earnedTitleBanner.hidden = false;
}

function updateDifficultyVisibility(animateReveal = false)       {
    const oniVisible = progress.isOniUnlocked(state.category);
    els.ruleOniItem.hidden = !oniVisible;
    els.btnOni.hidden = !oniVisible;
    els.btnOni.classList.toggle('just-unlocked', oniVisible && animateReveal);
}

function setCategory(category          )       {
    state.category = category;
    const config = CATEGORY_CONFIG[category];

    els.categoryTabs.forEach((tab) => {
        const isActive = tab.dataset['category'] === category;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-selected', String(isActive));
    });

    els.homeDesc.textContent = config.description;
    els.ruleNormalText.innerHTML = config.normalRuleHtml;
    els.ruleOniText.innerHTML = config.oniRuleHtml;
    updateDifficultyVisibility();
    updateCurrentCategoryTitle();
}

function startGame(difficulty            )       {
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
    els.scoreText.hidden = !isOni;
    els.progressFill.classList.toggle('timer-fill', isOni);
    els.progressFill.classList.remove('urgent');

    const categoryConfig = CATEGORY_CONFIG[state.category];
    els.modeDisplay.textContent = `${categoryConfig.label} / ${DIFFICULTY_LABELS[difficulty]}`;

    if (isOni) {
        els.trayTitleText.textContent = isSketch ? '❓ ？の時期の細胞は？' : '❓ ？に入るのは？';
        els.trayHint.textContent = '👆クリック または 1・2・3キーで回答';
        setupNextOniQuestion();
        updateOniHud();
        startOniTimer();
    } else {
        els.trayTitleText.textContent = categoryConfig.trayTitle;
        els.trayHint.textContent = '👆カードを選んで図の枠をクリック';
        setupStaticBoardNodes(state.category, difficulty);
        const built = buildStandardItems(state.category, state.nextItemUid);
        state.nextItemUid = built.nextUid;
        state.items = shuffleInPlace(built.items);
        state.totalQuestions = state.items.length;
        updateStandardProgress();
        renderCards();
    }

    els.homeScreen.classList.remove('active');
    els.gameScreen.classList.add('active');

    showToast(isOni ? categoryConfig.oniToast : categoryConfig.startToast);
}

function setupStaticBoardNodes(category          , difficulty            )       {
    const isOni = difficulty === 'oni';

    [els.linearSvg, els.circleSvg].forEach((svg) => {
        svg.querySelectorAll             ('.stage-node').forEach((node) => {
            node.classList.remove('solved', 'active-target', 'interactive-target', 'masked');
            const labelEl = node.querySelector('.stage-label');
            const defaultLabel = node.dataset['defaultLabel'];
            if (labelEl && defaultLabel) {
                labelEl.textContent = defaultLabel;
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

function updateComboBadge()       {
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

function triggerErrorShake()       {
    els.mainArea.classList.remove('shake-error');
    void els.mainArea.offsetWidth;
    els.mainArea.classList.add('shake-error');
}

function registerCorrectAnswer(displayLabel        )       {
    state.score++;
    const isOni = state.difficulty === 'oni';

    if (isOni) {
        state.combo++;
        state.maxCombo = Math.max(state.maxCombo, state.combo);
        updateComboBadge();

        if (isBonusCombo(state.combo)) {
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

function registerWrongAnswer()       {
    state.combo = 0;
    updateComboBadge();
    SOUND_FX.playWrong();
    triggerErrorShake();
}

function setupNextOniQuestion()       {
    state.selectedItemId = null;
    const q = buildOniQuestion(state.category, state.currentOniTargetStageId, state.nextItemUid);
    state.currentOniTargetStageId = q.targetStageId;
    state.nextItemUid = q.nextUid;
    els.oniCycleSvg.innerHTML = q.svgMarkup;
    els.trayTitleText.textContent = q.trayTitle;
    state.items = q.choices;
    renderCards();
}

function submitOniSingleBlankAnswer(item      )       {
    if (!state.isPlaying) return;

    if (item.stageId === state.currentOniTargetStageId) {
        registerCorrectAnswer(item.stageName);
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

function startOniTimer()       {
    state.oniEndTime = Date.now() + ONI_TIME_LIMIT * 1000;

    state.timerInterval = setInterval(() => {
        const remainingMs = Math.max(0, state.oniEndTime - Date.now());
        state.timeLeft = computeRemainingSeconds(state.oniEndTime, Date.now());

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

function applyOniTimePenalty()          {
    state.oniEndTime -= ONI_PENALTY_SECONDS * 1000;
    const now = Date.now();
    const remainingMs = Math.max(0, state.oniEndTime - now);
    state.timeLeft = computeRemainingSeconds(state.oniEndTime, now);
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

function applyOniTimeBonus(seconds        )       {
    state.oniEndTime += seconds * 1000;
    const now = Date.now();
    const remainingMs = Math.max(0, state.oniEndTime - now);
    state.timeLeft = computeRemainingSeconds(state.oniEndTime, now);
    updateOniHud(remainingMs);

    els.timerBadge.classList.remove('penalty-flash');
    els.timerBadge.classList.add('bonus-flash');
    setTimeout(() => {
        els.timerBadge.classList.remove('bonus-flash');
    }, 420);
}

function updateOniHud(remainingMs = state.timeLeft * 1000)       {
    els.timerText.textContent = String(state.timeLeft);
    els.scoreText.textContent = `🏆 ${state.score}問`;

    const percent = Math.min(100, (remainingMs / (ONI_TIME_LIMIT * 1000)) * 100);
    els.progressFill.style.width = `${percent}%`;

    const isUrgent = state.timeLeft <= 10;
    els.timerBadge.classList.toggle('urgent', isUrgent);
    els.progressFill.classList.toggle('urgent', isUrgent);
}

function updateStandardProgress()       {
    const percent = (state.score / state.totalQuestions) * 100;
    els.progressFill.style.width = `${percent}%`;
}

function renderCardContent(item      , isAdvanced         )         {
    switch (item.kind) {
        case 'sketch-only': {
            const svgMarkup = renderCellSvg(item.stageId, item.cellType, {
                monochrome: true,
                rotated: item.rotated,
                variant: item.variant
            });
            const angleTag = item.angleNote ? `<span class="polar-mini-tag">${item.angleNote}</span>` : '';
            return `<div class="cell-thumb">${svgMarkup}</div>${angleTag}`;
        }
        case 'word-only':
        case 'sentence-only':
            return `<div class="info"><div class="name">${item.name}</div></div>`;
        case 'sketch': {
            const svgMarkup = renderCellSvg(item.stageId, item.cellType, {
                monochrome: isAdvanced,
                rotated: item.rotated,
                variant: item.variant
            });
            const labelText = isAdvanced
                ? item.label
                : item.cellType === 'plant' ? '🌱 植物細胞' : '🐾 動物細胞';
            const hintHtml = item.hint ? `<div class="hint">${item.hint}</div>` : '';
            return `
                <div class="cell-thumb">${svgMarkup}</div>
                <div class="info">
                    <div class="name">${labelText}</div>
                    ${hintHtml}
                </div>
            `;
        }
        case 'cycle': {
            const hintHtml = item.hint ? `<div class="hint">${item.hint}</div>` : '';
            if (isAdvanced) {
                return `<div class="info"><div class="name">${item.name}</div>${hintHtml}</div>`;
            }
            return `
                <div class="feature-icon" style="background-color: ${item.bg}; border: 2px solid ${item.color};">${item.emoji}</div>
                <div class="info">
                    <div class="name">${item.name}</div>
                    ${hintHtml}
                </div>
            `;
        }
    }
}

function renderCards()       {
    const focusedEl = document.activeElement;
    const hadFocusInList = Boolean(focusedEl && els.cardList.contains(focusedEl));
    const focusedItemId = hadFocusInList && focusedEl instanceof HTMLElement ? focusedEl.dataset['itemId'] : null;

    els.cardList.innerHTML = '';

    const isOni = state.difficulty === 'oni';
    const isAdvanced = state.difficulty === 'normal' || isOni;
    const singleBlankOni = isOniSingleBlankMode();
    els.cardList.classList.toggle('oni-choices', singleBlankOni);

    state.items.forEach((item, index) => {
        const card = document.createElement('div');
        const isSelected = state.selectedItemId === item.id;

        let extraClass = '';
        if (item.kind === 'word-only') extraClass = ' advanced-card';
        else if (item.kind === 'sketch-only') extraClass = ' sketch-only-card';
        else if (item.kind === 'sentence-only') extraClass = ' sentence-only-card';

        card.className = `bio-card${isSelected ? ' selected' : ''}${extraClass}`;
        card.draggable = true;
        card.tabIndex = 0;
        card.dataset['itemId'] = item.id;
        card.setAttribute('role', singleBlankOni ? 'button' : 'listitem');
        if (!singleBlankOni) {
            card.setAttribute('aria-pressed', String(isSelected));
        }

        card.innerHTML = renderCardContent(item, isAdvanced);

        if (singleBlankOni && index < 9) {
            card.insertAdjacentHTML('afterbegin', `<span class="key-badge" aria-hidden="true">${index + 1}</span>`);
            card.setAttribute('aria-keyshortcuts', String(index + 1));
        }

        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                card.click();
            }
        });

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
            if (e.dataTransfer) {
                e.dataTransfer.effectAllowed = 'move';
            }
            if (!singleBlankOni) {
                setTimeout(renderCards, 0);
            }
        });

        els.cardList.appendChild(card);
    });

    if (hadFocusInList) {
        const sameCard = focusedItemId
            ? els.cardList.querySelector             (`[data-item-id="${focusedItemId}"]`)
            : null;
        const fallback = sameCard ?? els.cardList.querySelector             ('.bio-card');
        fallback?.focus({ preventScroll: true });
    }

    syncStageFocusability();
}

function syncStageFocusability()       {
    const canPlace = state.isPlaying && !isOniSingleBlankMode();
    let blankNo = 0;
    [els.linearSvg, els.circleSvg].forEach((svg) => {
        const isActive = svg === getActiveSvg();
        svg.querySelectorAll             ('.stage-node').forEach((node) => {
            const focusable = canPlace && isActive && node.classList.contains('interactive-target');
            if (focusable) {
                blankNo += 1;
                node.setAttribute('tabindex', '0');
                node.setAttribute('role', 'button');
                const label = node.classList.contains('masked')
                    ? `空欄の枠 ${blankNo}`
                    : `${node.dataset['defaultLabel'] ?? ''}の枠`;
                node.setAttribute('aria-label', label);
            } else {
                node.removeAttribute('tabindex');
                node.removeAttribute('role');
                node.removeAttribute('aria-label');
            }
        });
    });
}

function placeOnFocusedStage(node             )       {
    if (!state.selectedItemId) {
        showToast('👆 先に右のカードを選んでね');
        return;
    }
    const box = node.querySelector('.stage-box') ?? node;
    const r = box.getBoundingClientRect();
    handlePlacementAttempt(r.left + r.width / 2, r.top + r.height / 2);
    if (state.isPlaying) {
        els.cardList.querySelector             ('.bio-card')?.focus({ preventScroll: true });
    }
}

function handleGlobalKeydown(e               )       {
    if (!els.gameScreen.classList.contains('active') || !state.isPlaying) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    if (isOniSingleBlankMode() && /^[1-9]$/.test(e.key)) {
        const cards = els.cardList.querySelectorAll             ('.bio-card');
        const target = cards[Number(e.key) - 1];
        if (target) {
            e.preventDefault();
            target.click();
        }
        return;
    }

    if (e.key === 'Escape' && state.selectedItemId) {
        e.preventDefault();
        state.selectedItemId = null;
        renderCards();
    }
}

function findStageNodeAtPoint(clientX        , clientY        )                     {
    const activeSvg = getActiveSvg();
    const directEl = document.elementFromPoint(clientX, clientY);
    const directNode = directEl?.closest             ('.stage-node.interactive-target') ?? null;
    if (directNode && activeSvg.contains(directNode)) return directNode;

    const pad = 12;
    let closest                     = null;
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

function setActiveStageHighlight(activeNode                    )       {
    getActiveStageNodes().forEach((node) => {
        node.classList.toggle('active-target', node === activeNode);
    });
}

function handlePlacementAttempt(clientX        , clientY        )       {
    if (!state.isPlaying || !state.selectedItemId) return;

    const targetNode = findStageNodeAtPoint(clientX, clientY);
    if (!targetNode) return;

    const itemIndex = state.items.findIndex((entry) => entry.id === state.selectedItemId);
    if (itemIndex === -1) return;
    const item = state.items[itemIndex];
    if (!item) return;

    if (isOniSingleBlankMode()) {
        submitOniSingleBlankAnswer(item);
        return;
    }

    const acceptedCsv = targetNode.dataset['accept'] ?? targetNode.dataset['stage'] ?? '';
    if (isStageMatch(acceptedCsv, item.stageId)) {
        registerCorrectAnswer(item.stageName);
        handleCorrectVisual(item, targetNode);
        state.items.splice(itemIndex, 1);
        updateStandardProgress();
        if (state.score === state.totalQuestions) {
            handleGameClear();
        } else {
            state.selectedItemId = null;
            renderCards();
        }
    } else {
        registerWrongAnswer();
        state.selectedItemId = null;
        renderCards();
        showToast('❌ うーん、そこじゃないみたい...');
    }
}

function handleCorrectVisual(item      , targetNode             )       {
    if (item.kind === 'cycle') {
        const labelEl = targetNode.querySelector('.stage-label');
        if (labelEl) {
            labelEl.textContent = item.name;
        }
        targetNode.classList.remove('masked', 'interactive-target', 'active-target');
        targetNode.classList.add('solved');
        return;
    }

    if (item.kind !== 'sketch' && item.kind !== 'sketch-only') return;

    const isAdvanced = state.difficulty === 'normal' || state.difficulty === 'oni';
    const wrapperRect = els.graphWrapper.getBoundingClientRect();
    const boxEl = targetNode.querySelector('.stage-box') ?? targetNode;
    const boxRect = boxEl.getBoundingClientRect();

    const centerX = ((boxRect.left + boxRect.width / 2 - wrapperRect.left) / wrapperRect.width) * 100;
    const centerY = ((boxRect.top + boxRect.height / 2 - wrapperRect.top) / wrapperRect.height) * 100;

    const pinDir = targetNode.dataset['pinDir'] ?? '';
    const count = state.stagePlacedCount[item.stageId] ?? 0;
    state.stagePlacedCount[item.stageId] = count + 1;

    let pinX = centerX;
    let pinY = centerY;

    if (pinDir === 'up') {
        pinX = centerX + (count === 0 ? -3.4 : 3.4);
        pinY = centerY - 10.5;
    } else if (pinDir === 'down') {
        pinX = centerX + (count === 0 ? -3.1 : 3.1);
        pinY = centerY + 10.5;
    } else {
        pinX = centerX + (count === 0 ? -6.6 : 6.6);
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
        variant: item.variant
    });
    pin.innerHTML = `<div class="pin-mini-cell" style="border-color: ${borderColor};">${miniSvg}</div>`;
    els.dropZone.appendChild(pin);
}

function showToast(msg        )       {
    els.toast.innerHTML = msg;

    if (msg.includes('🔥') || msg.includes('⭕')) {
        els.toast.style.backgroundColor = 'rgba(13, 148, 136, 0.95)';
    } else if (msg.includes('❌')) {
        els.toast.style.backgroundColor = 'rgba(239, 68, 68, 0.95)';
    } else {
        els.toast.style.backgroundColor = 'rgba(51, 65, 85, 0.95)';
    }

    els.toast.classList.add('show');
    if (state.toastTimeout !== null) {
        clearTimeout(state.toastTimeout);
    }
    state.toastTimeout = setTimeout(() => {
        els.toast.classList.remove('show');
    }, state.difficulty === 'oni' ? 950 : 1800);
}

function handleGameClear()       {
    state.isPlaying = false;
    let displayTime = 3500;
    let unlockHtml = '';
    let unlockedNow = false;

    if (state.difficulty === 'normal' && !progress.isOniUnlocked(state.category)) {
        progress.unlockOni(state.category);
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

    if (state.returnTimeout !== null) {
        clearTimeout(state.returnTimeout);
    }
    state.returnTimeout = setTimeout(resetToHome, displayTime);
}

function handleOniTimeUp()       {
    state.isPlaying = false;
    state.selectedItemId = null;

    const prevBest = progress.getOniBest(state.category) ?? -1;
    const isNewRecord = state.score > prevBest;
    const bestScore = isNewRecord ? state.score : prevBest;

    if (isNewRecord) {
        progress.setOniBest(state.category, bestScore);
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

function createConfetti()       {
    const colors = ['#0D9488', '#2DD4BF', '#0EA5E9', '#F59E0B', '#8B5CF6'];
    const shapes = ['50%', '0%'];

    document.querySelectorAll('.confetti-piece').forEach((el) => el.remove());

    for (let i = 0; i < 80; i++) {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti-piece');

        confetti.style.left = `${Math.random() * 100}vw`;
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)] ?? '#0D9488';
        confetti.style.borderRadius = shapes[Math.floor(Math.random() * shapes.length)] ?? '0%';

        const size = Math.random() * 8 + 6;
        confetti.style.width = `${size}px`;
        confetti.style.height = `${size}px`;

        const duration = Math.random() * 3 + 2;
        const delay = Math.random() * 1.5;
        confetti.style.animation = `confettiFall ${duration}s linear ${delay}s forwards`;

        els.clearOverlay.appendChild(confetti);
    }
}

function stopTimers()       {
    if (state.timerInterval !== null) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
    }
    if (state.returnTimeout !== null) {
        clearTimeout(state.returnTimeout);
        state.returnTimeout = null;
    }
}

function resetToHome()       {
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


//# sourceURL=app.ts