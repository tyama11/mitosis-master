/**
 * 細胞周期「おに」モード用：
 * ランダムに「回転した円」または「開始位置をずらした一直線」のSVG（9箇所埋め＋1箇所だけ？）を生成するモジュール
 */
const ONI_BOARD_GENERATOR = (() => {
    'use strict';

    const STAGE_LABELS = {
        interphase: '間期',
        g1: 'G₁期',
        s: 'S期',
        g2: 'G₂期',
        m: 'M期',
        mitosis: '分裂期',
        prophase: '前期',
        metaphase: '中期',
        anaphase: '後期',
        telophase: '終期'
    };

    const LINEAR_SEQ = ['g1', 's', 'g2', 'prophase', 'metaphase', 'anaphase', 'telophase'];
    const INTERPHASE_SET = new Set(['g1', 's', 'g2']);
    const SKETCH_TARGET_SET = new Set(['interphase', 'prophase', 'metaphase', 'anaphase', 'telophase']);

    /**
     * 細胞周期「おに」用：9箇所埋め＋1箇所だけ「？」のランダムボードSVGを生成
     * @param {string} targetStageId - 空欄「？」にするステージID
     */
    function generateRandomCycleBoardSvg(targetStageId) {
        return generateRandomBoardInternal({ mode: 'cycle', targetStageId });
    }

    /**
     * 細胞スケッチ「おに」用：全箇所「？」＆回転円／シフト一直線をランダムに出すボードSVGを生成
     */
    function generateRandomSketchBoardSvg() {
        return generateRandomBoardInternal({ mode: 'sketch', targetStageId: null });
    }

    function generateRandomBoardInternal(opts) {
        const useLinear = Math.random() < 0.5;
        const swapMitosisPair = Math.random() < 0.5;

        if (useLinear) {
            const offset = Math.floor(Math.random() * LINEAR_SEQ.length);
            return buildShiftedLinearSvg(opts, offset, swapMitosisPair);
        }

        const orientations = ['right', 'bottom', 'left', 'top'];
        const orientation = orientations[Math.floor(Math.random() * orientations.length)];
        const jitterChoices = [-24, -12, 0, 12, 24];
        const jitterDeg = jitterChoices[Math.floor(Math.random() * jitterChoices.length)];
        return buildRotatedCircleSvg(opts, orientation, jitterDeg, swapMitosisPair);
    }

    function renderBoxNode(stageId, opts, x, y, w, h, fontSize = 19) {
        const rx = Math.min(14, Math.round(h * 0.25));

        if (opts.mode === 'sketch') {
            // スケッチ「おに」：全枠を「？」にし、間期・前期〜終期の5枠をドロップ／タップ対象にする
            const isSketchTarget = SKETCH_TARGET_SET.has(stageId);
            const roleClasses = isSketchTarget
                ? 'sketch-target interactive-target masked'
                : 'cycle-only masked';
            return `
                <g class="stage-node ${roleClasses}" data-stage="${stageId}" data-accept="${stageId}" transform="translate(${x.toFixed(1)}, ${y.toFixed(1)})">
                    <g class="stage-visual">
                        <rect class="stage-box" x="${(-w / 2).toFixed(1)}" y="${(-h / 2).toFixed(1)}" width="${w}" height="${h}" rx="${rx}" />
                        <text class="stage-mystery" x="0" y="${(fontSize * 0.36).toFixed(1)}" text-anchor="middle" font-size="${fontSize}" font-weight="800" fill="#475569">？</text>
                    </g>
                </g>
            `;
        }

        const isTarget = stageId === opts.targetStageId;
        const label = STAGE_LABELS[stageId];

        if (isTarget) {
            return `
                <g class="stage-node oni-target-blank interactive-target" data-stage="${stageId}" data-accept="${stageId}" transform="translate(${x.toFixed(1)}, ${y.toFixed(1)})">
                    <g class="stage-visual">
                        <rect class="stage-box oni-focus-box" x="${(-w / 2).toFixed(1)}" y="${(-h / 2).toFixed(1)}" width="${w}" height="${h}" rx="${rx}" />
                        <text class="stage-mystery" x="0" y="${(fontSize * 0.36).toFixed(1)}" text-anchor="middle" font-size="${fontSize + 3}" font-weight="900">？</text>
                        <text class="stage-label" x="0" y="${(fontSize * 0.36).toFixed(1)}" text-anchor="middle" font-size="${fontSize}" font-weight="800" style="display:none;">${label}</text>
                    </g>
                </g>
            `;
        }

        return `
            <g class="stage-node" data-stage="${stageId}" transform="translate(${x.toFixed(1)}, ${y.toFixed(1)})">
                <rect x="${(-w / 2).toFixed(1)}" y="${(-h / 2).toFixed(1)}" width="${w}" height="${h}" rx="${rx}" fill="#F8FAFC" stroke="#94A3B8" stroke-width="2.2" />
                <text x="0" y="${(fontSize * 0.36).toFixed(1)}" text-anchor="middle" font-size="${fontSize}" font-weight="800" fill="#1E293B">${label}</text>
            </g>
        `;
    }

    // ======== 1. 開始位置をランダムにずらした一直線の図 ========
    function buildShiftedLinearSvg(opts, offset, swapMitosisPair) {
        const seq = LINEAR_SEQ.map((_, i) => LINEAR_SEQ[(offset + i) % LINEAR_SEQ.length]);
        const xs = seq.map((_, i) => 62 + i * 96);
        const rowY = 356;

        // 連続区間（ラン）に分割
        const runs = [];
        seq.forEach((id, idx) => {
            const group = INTERPHASE_SET.has(id) ? 'inter' : 'mito';
            const prev = runs[runs.length - 1];
            if (prev && prev.group === group) {
                prev.end = idx;
                prev.len++;
            } else {
                runs.push({ group, start: idx, end: idx, len: 1 });
            }
        });

        const interRuns = runs.filter((r) => r.group === 'inter');
        const mitoRuns = runs.filter((r) => r.group === 'mito');
        const mainInter = interRuns.reduce((a, b) => (a.len >= b.len ? a : b));
        const mainMito = mitoRuns.reduce((a, b) => (a.len >= b.len ? a : b));

        // 上段ボックスのX位置を決定（重ならないよう配置）
        let interX = (xs[mainInter.start] + xs[mainInter.end]) / 2;
        let mitoX = (xs[mainMito.start] + xs[mainMito.end]) / 2;

        if (Math.abs(interX - mitoX) < 220) {
            if (interX <= mitoX) {
                interX = Math.max(115, Math.min(interX, 240));
                mitoX = Math.max(interX + 235, Math.min(mitoX, 545));
            } else {
                mitoX = Math.max(155, Math.min(mitoX, 320));
                interX = Math.min(600, Math.max(mitoX + 235, interX));
            }
        }
        mitoX = Math.max(155, Math.min(545, mitoX));
        interX = Math.max(95, Math.min(610, interX));

        const topY = 186;
        const bracketY = 278;

        // 括弧パスの描画（端で途切れて反対側に続く場合もオープン括弧＋破線ブリッジで表現）
        const bracketPaths = [];
        runs.forEach((run) => {
            const isWrappedLeft = runs.length === 3 && run.start === 0;
            const isWrappedRight = runs.length === 3 && run.end === 6;
            const leftX = isWrappedLeft ? 8 : xs[run.start] - 34;
            const rightX = isWrappedRight ? 692 : xs[run.end] + 34;
            const stroke = run.group === 'inter' ? '#64748B' : '#475569';

            if (isWrappedLeft) {
                bracketPaths.push(`<path d="M ${leftX} ${bracketY} L ${rightX} ${bracketY} L ${rightX} 314" fill="none" stroke="${stroke}" stroke-width="2.3" stroke-linejoin="round" />`);
            } else if (isWrappedRight) {
                bracketPaths.push(`<path d="M ${leftX} 314 L ${leftX} ${bracketY} L ${rightX} ${bracketY}" fill="none" stroke="${stroke}" stroke-width="2.3" stroke-linejoin="round" />`);
            } else {
                bracketPaths.push(`<path d="M ${leftX} 314 L ${leftX} ${bracketY} L ${rightX} ${bracketY} L ${rightX} 314" fill="none" stroke="${stroke}" stroke-width="2.3" stroke-linejoin="round" />`);
            }
        });

        // 上段ボックスからメイン括弧・分割括弧への接続線
        const connectors = [];
        interRuns.forEach((run) => {
            const midX = (xs[run.start] + xs[run.end]) / 2;
            if (run === mainInter) {
                connectors.push(`<path d="M ${interX} ${topY + 29} L ${interX} 245 L ${midX} 245 L ${midX} ${bracketY}" fill="none" stroke="#64748B" stroke-width="2.2" />`);
            } else {
                connectors.push(`<path d="M ${interX} ${topY - 29} L ${interX} 112 L ${midX} 112 L ${midX} ${bracketY}" fill="none" stroke="#94A3B8" stroke-width="2" stroke-dasharray="5 4" />`);
            }
        });

        mitoRuns.forEach((run) => {
            const midX = (xs[run.start] + xs[run.end]) / 2;
            if (run === mainMito) {
                connectors.push(`<path d="M ${mitoX} ${topY + 29} L ${mitoX} 245 L ${midX} 245 L ${midX} ${bracketY}" fill="none" stroke="#475569" stroke-width="2.2" />`);
            } else {
                connectors.push(`<path d="M ${mitoX} ${topY - 29} L ${mitoX} 112 L ${midX} 112 L ${midX} ${bracketY}" fill="none" stroke="#94A3B8" stroke-width="2" stroke-dasharray="5 4" />`);
            }
        });

        // 矢印（周期がループしていることを示す両端矢印つき）
        const arrows = [];
        if (offset > 0) {
            arrows.push(`<line x1="4" y1="${rowY}" x2="18" y2="${rowY}" stroke="#64748B" stroke-width="2.5" marker-end="url(#oni-arrow)" />`);
        }
        for (let i = 0; i < 6; i++) {
            arrows.push(`<line x1="${xs[i] + 41}" y1="${rowY}" x2="${xs[i + 1] - 43}" y2="${rowY}" stroke="#64748B" stroke-width="2.5" marker-end="url(#oni-arrow)" />`);
        }
        if (offset > 0) {
            arrows.push(`<line x1="680" y1="${rowY}" x2="695" y2="${rowY}" stroke="#64748B" stroke-width="2.5" marker-end="url(#oni-arrow)" />`);
        }

        const leftPairId = swapMitosisPair ? 'mitosis' : 'm';
        const rightPairId = swapMitosisPair ? 'm' : 'mitosis';

        const rowBoxes = seq.map((stageId, i) =>
            renderBoxNode(stageId, opts, xs[i], rowY, 80, 56, 18)
        ).join('');

        return `
            <defs>
                <marker id="oni-arrow" viewBox="0 0 10 10" refX="7.5" refY="5" markerWidth="5.5" markerHeight="5.5" orient="auto">
                    <path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill="#64748B" />
                </marker>
            </defs>
            ${bracketPaths.join('')}
            ${connectors.join('')}
            ${arrows.join('')}
            <text x="${mitoX}" y="${topY + 8}" text-anchor="middle" font-size="23" font-weight="900" fill="#475569">＝</text>
            ${renderBoxNode('interphase', opts, interX, topY, 108, 56, 19)}
            ${renderBoxNode(leftPairId, opts, mitoX - 70, topY, 104, 56, 19)}
            ${renderBoxNode(rightPairId, opts, mitoX + 70, topY, 104, 56, 19)}
            ${rowBoxes}
        `;
    }

    // ======== 2. ランダムな角度・向きに回転した円の周期図 ========
    function buildRotatedCircleSvg(opts, orientation, jitterDeg, swapMitosisPair) {
        const baseAngles = {
            right: 0,
            bottom: 90,
            left: 180,
            top: 270
        };
        const mAngleDeg = baseAngles[orientation] + jitterDeg;

        // 円の中心と半径を向きに応じて配置
        const layout = {
            right: { cx: 198, cy: 270, r: 125 },
            left: { cx: 502, cy: 270, r: 125 },
            bottom: { cx: 350, cy: 175, r: 112 },
            top: { cx: 350, cy: 365, r: 112 }
        }[orientation];

        const { cx, cy, r } = layout;
        const pt = (deg, radius = r) => {
            const rad = (deg * Math.PI) / 180;
            return {
                x: cx + radius * Math.cos(rad),
                y: cy + radius * Math.sin(rad)
            };
        };

        // 時計回り: M(mAngle) → G1(+90°) → S(+180°) → G2(+270°)
        const posM = pt(mAngleDeg);
        const posG1 = pt(mAngleDeg + 90);
        const posS = pt(mAngleDeg + 180);
        const posG2 = pt(mAngleDeg + 270);
        // 間期は S 寄りの円内中央に配置
        const posInter = pt(mAngleDeg + 180, 14);

        // M期と＝で結ばれる片割れ（分裂期 or M期）と、4段階（前期〜終期）の配置
        const ringMId = swapMitosisPair ? 'mitosis' : 'm';
        const pairedMId = swapMitosisPair ? 'm' : 'mitosis';

        let eqPos;
        let posPaired;
        let subBoxRect;
        let subPositions;
        let subArrows = '';
        let zoomLines = '';

        if (orientation === 'right') {
            posPaired = { x: 458, y: posM.y };
            eqPos = { x: (posM.x + 48 + posPaired.x - 48) / 2, y: posM.y + 8 };
            subBoxRect = { x: 540, y: 48, w: 146, h: 444 };
            subPositions = [106, 215, 325, 434].map((y) => ({ x: 613, y, w: 122, h: 56 }));
            subArrows = [138, 247, 357].map((y1) =>
                `<line x1="613" y1="${y1}" x2="613" y2="${y1 + 42}" stroke="#64748B" stroke-width="2.8" marker-end="url(#oni-cir-arrow)" />`
            ).join('');
            zoomLines = `
                <line x1="${posPaired.x + 50}" y1="${posPaired.y - 20}" x2="540" y2="64" stroke="#94A3B8" stroke-width="2" stroke-dasharray="5 4" />
                <line x1="${posPaired.x + 50}" y1="${posPaired.y + 20}" x2="540" y2="476" stroke="#94A3B8" stroke-width="2" stroke-dasharray="5 4" />
            `;
        } else if (orientation === 'left') {
            posPaired = { x: 242, y: posM.y };
            eqPos = { x: (posM.x - 48 + posPaired.x + 48) / 2, y: posM.y + 8 };
            subBoxRect = { x: 14, y: 48, w: 146, h: 444 };
            subPositions = [106, 215, 325, 434].map((y) => ({ x: 87, y, w: 122, h: 56 }));
            subArrows = [138, 247, 357].map((y1) =>
                `<line x1="87" y1="${y1}" x2="87" y2="${y1 + 42}" stroke="#64748B" stroke-width="2.8" marker-end="url(#oni-cir-arrow)" />`
            ).join('');
            zoomLines = `
                <line x1="${posPaired.x - 50}" y1="${posPaired.y - 20}" x2="160" y2="64" stroke="#94A3B8" stroke-width="2" stroke-dasharray="5 4" />
                <line x1="${posPaired.x - 50}" y1="${posPaired.y + 20}" x2="160" y2="476" stroke="#94A3B8" stroke-width="2" stroke-dasharray="5 4" />
            `;
        } else if (orientation === 'bottom') {
            posPaired = { x: posM.x, y: 382 };
            eqPos = { x: posM.x, y: (posM.y + 25 + posPaired.y - 25) / 2 + 7 };
            subBoxRect = { x: 42, y: 442, w: 616, h: 84 };
            subPositions = [118, 273, 427, 582].map((x) => ({ x, y: 484, w: 112, h: 54 }));
            subArrows = [178, 333, 487].map((x1) =>
                `<line x1="${x1}" y1="484" x2="${x1 + 32}" y2="484" stroke="#64748B" stroke-width="2.8" marker-end="url(#oni-cir-arrow)" />`
            ).join('');
            zoomLines = `
                <line x1="${posPaired.x - 48}" y1="${posPaired.y + 24}" x2="60" y2="442" stroke="#94A3B8" stroke-width="2" stroke-dasharray="5 4" />
                <line x1="${posPaired.x + 48}" y1="${posPaired.y + 24}" x2="640" y2="442" stroke="#94A3B8" stroke-width="2" stroke-dasharray="5 4" />
            `;
        } else {
            // top
            posPaired = { x: posM.x, y: 158 };
            eqPos = { x: posM.x, y: (posM.y - 25 + posPaired.y + 25) / 2 + 7 };
            subBoxRect = { x: 42, y: 14, w: 616, h: 84 };
            subPositions = [118, 273, 427, 582].map((x) => ({ x, y: 56, w: 112, h: 54 }));
            subArrows = [178, 333, 487].map((x1) =>
                `<line x1="${x1}" y1="56" x2="${x1 + 32}" y2="56" stroke="#64748B" stroke-width="2.8" marker-end="url(#oni-cir-arrow)" />`
            ).join('');
            zoomLines = `
                <line x1="${posPaired.x - 48}" y1="${posPaired.y - 24}" x2="60" y2="98" stroke="#94A3B8" stroke-width="2" stroke-dasharray="5 4" />
                <line x1="${posPaired.x + 48}" y1="${posPaired.y - 24}" x2="640" y2="98" stroke="#94A3B8" stroke-width="2" stroke-dasharray="5 4" />
            `;
        }

        // 回転させた扇形と時計回りアーク矢印（基準: M=0° を mAngleDeg 回転）
        const sCut = r * Math.SQRT1_2;
        const arcArrow = (startDeg, endDeg) => {
            const p1 = {
                x: cx + r * Math.cos((startDeg * Math.PI) / 180),
                y: cy + r * Math.sin((startDeg * Math.PI) / 180)
            };
            const p2 = {
                x: cx + r * Math.cos((endDeg * Math.PI) / 180),
                y: cy + r * Math.sin((endDeg * Math.PI) / 180)
            };
            return `<path d="M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} A ${r} ${r} 0 0 1 ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}" fill="none" stroke="#64748B" stroke-width="3.3" marker-end="url(#oni-cir-arrow)" />`;
        };

        const subStageIds = ['prophase', 'metaphase', 'anaphase', 'telophase'];
        const subBoxesHtml = subStageIds.map((id, idx) => {
            const sp = subPositions[idx];
            return renderBoxNode(id, opts, sp.x, sp.y, sp.w, sp.h, 18);
        }).join('');

        return `
            <defs>
                <marker id="oni-cir-arrow" viewBox="0 0 10 10" refX="7.5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill="#64748B" />
                </marker>
            </defs>

            <!-- 回転する円扇形と時計回り矢印 -->
            <g transform="rotate(${mAngleDeg} ${cx} ${cy})">
                <path d="M ${cx} ${cy} L ${(cx + sCut).toFixed(1)} ${(cy + sCut).toFixed(1)} A ${r} ${r} 0 1 1 ${(cx + sCut).toFixed(1)} ${(cy - sCut).toFixed(1)} Z" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="2" stroke-dasharray="5 4" />
                <path d="M ${cx} ${cy} L ${(cx + sCut).toFixed(1)} ${(cy - sCut).toFixed(1)} A ${r} ${r} 0 0 1 ${(cx + sCut).toFixed(1)} ${(cy + sCut).toFixed(1)} Z" fill="#F1F5F9" stroke="#94A3B8" stroke-width="2" />
                <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#CBD5E1" stroke-width="9" opacity="0.55" />
            </g>

            ${arcArrow(mAngleDeg + 26, mAngleDeg + 64)}
            ${arcArrow(mAngleDeg + 116, mAngleDeg + 154)}
            ${arcArrow(mAngleDeg + 206, mAngleDeg + 244)}
            ${arcArrow(mAngleDeg + 296, mAngleDeg + 334)}

            ${zoomLines}
            <rect x="${subBoxRect.x}" y="${subBoxRect.y}" width="${subBoxRect.w}" height="${subBoxRect.h}" rx="18" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="2.3" />
            ${subArrows}

            <text x="${eqPos.x.toFixed(1)}" y="${eqPos.y.toFixed(1)}" text-anchor="middle" font-size="22" font-weight="900" fill="#475569">＝</text>

            ${renderBoxNode('interphase', opts, posInter.x, posInter.y, 98, 52, 18)}
            ${renderBoxNode('g1', opts, posG1.x, posG1.y, 88, 48, 18)}
            ${renderBoxNode('s', opts, posS.x, posS.y, 86, 48, 18)}
            ${renderBoxNode('g2', opts, posG2.x, posG2.y, 88, 48, 18)}
            ${renderBoxNode(ringMId, opts, posM.x, posM.y, 88, 48, 18)}
            ${renderBoxNode(pairedMId, opts, posPaired.x, posPaired.y, 98, 52, 18)}
            ${subBoxesHtml}
        `;
    }

    return {
        generateRandomCycleBoardSvg,
        generateRandomSketchBoardSvg
    };
})();
