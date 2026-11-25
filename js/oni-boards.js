import { pickRandom, randomInt,          } from './random.js';
                                               

                     
            
                               
                         
                         
                          

                                                          

                        
                                      
                                                
                                       
 

                 
                       
                       
 

                     
                       
                       
                       
                       
 

const STAGE_LABELS                                         = {
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

const SEQ_7                          = ['g1', 's', 'g2', 'prophase', 'metaphase', 'anaphase', 'telophase'];
const SEQ_5_CONTINUOUS                          = ['interphase', 'prophase', 'metaphase', 'anaphase', 'telophase'];
const SEQ_4_ALPHA                          = ['g1', 's', 'g2', 'm'];

const INTERPHASE_SET = new Set              (['g1', 's', 'g2']);
const MITOSIS_SUB_SET = new Set              (['prophase', 'metaphase', 'anaphase', 'telophase']);
const SKETCH_TARGET_SET = new Set              (['interphase', 'prophase', 'metaphase', 'anaphase', 'telophase']);

/** 細胞周期「おに」用：他を埋めて1箇所だけ「？」にしたランダムボードSVGを生成 */
export function generateRandomCycleBoardSvg(targetStageId              , rng      = Math.random)         {
    const eligibleStructures                   = ['full'];

    if (!INTERPHASE_SET.has(targetStageId)) {
        eligibleStructures.push('continuous_mito_bracket');
    }
    if (SKETCH_TARGET_SET.has(targetStageId)) {
        eligibleStructures.push('continuous_5_flat');
    }
    if (SEQ_7.includes(targetStageId)) {
        eligibleStructures.push('flat_7_no_bracket');
    }
    if (SEQ_4_ALPHA.includes(targetStageId)) {
        eligibleStructures.push('flat_4_no_bracket');
    }

    const structure = pickRandom(eligibleStructures, rng);
    return renderByStructure({ mode: 'cycle', targetStageId, structure }, rng);
}

/** 細胞スケッチ「おに」用：全枠「？」で構造・向き・開始位置をランダム化したボードSVGを生成 */
export function generateRandomSketchBoardSvg(rng      = Math.random)         {
    const structures                            = [
        'full',
        'continuous_mito_bracket',
        'continuous_5_flat'
    ];
    const structure = pickRandom(structures, rng);
    return renderByStructure({ mode: 'sketch', targetStageId: null, structure }, rng);
}

function renderByStructure(opts              , rng     )         {
    const geometry = pickRandom               (['horizontal', 'vertical', 'circle'], rng);
    const swapMitosisPair = rng() < 0.5;

    switch (opts.structure) {
        case 'continuous_5_flat':
            return buildFlatSequenceSvg(opts, SEQ_5_CONTINUOUS, geometry, 'interphase', rng);

        case 'flat_7_no_bracket':
            return buildFlatSequenceSvg(opts, SEQ_7, geometry, null, rng);

        case 'flat_4_no_bracket':
            return buildFlatSequenceSvg(opts, SEQ_4_ALPHA, geometry, null, rng);

        case 'continuous_mito_bracket':
            return buildContinuousWithMitoBracketSvg(opts, geometry, swapMitosisPair, rng);

        case 'full':
            if (geometry === 'horizontal') {
                return buildFullShiftedHorizontalSvg(opts, randomInt(7, rng), swapMitosisPair);
            }
            if (geometry === 'vertical') {
                return buildFullShiftedVerticalSvg(opts, randomInt(7, rng), swapMitosisPair);
            }
            return buildFullRotatedCircleSvg(opts, swapMitosisPair, rng);
    }
}

function renderBoxNode(
    stageId              ,
    opts              ,
    x        ,
    y        ,
    w        ,
    h        ,
    fontSize = 19,
    extraLongStyle = false
)         {
    const rx = Math.min(15, Math.round(h * 0.26));
    const doubleRect = extraLongStyle
        ? `<rect x="${(-w / 2 + 4).toFixed(1)}" y="${(-h / 2 + 4).toFixed(1)}" width="${w - 8}" height="${h - 8}" rx="${Math.max(8, rx - 3)}" fill="none" stroke="#CBD5E1" stroke-width="1.3" stroke-dasharray="4 3" />`
        : '';

    if (opts.mode === 'sketch') {
        const isSketchTarget = SKETCH_TARGET_SET.has(stageId);
        const roleClasses = isSketchTarget ? 'sketch-target interactive-target masked' : 'cycle-only masked';
        return `
            <g class="stage-node ${roleClasses}" data-stage="${stageId}" data-accept="${stageId}" transform="translate(${x.toFixed(1)}, ${y.toFixed(1)})">
                <g class="stage-visual">
                    <rect class="stage-box" x="${(-w / 2).toFixed(1)}" y="${(-h / 2).toFixed(1)}" width="${w}" height="${h}" rx="${rx}" />
                    ${doubleRect}
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
            ${doubleRect}
            <text x="0" y="${(fontSize * 0.36).toFixed(1)}" text-anchor="middle" font-size="${fontSize}" font-weight="800" fill="#1E293B">${label}</text>
        </g>
    `;
}

function arrowDefs(id = 'oni-arr')         {
    return `
        <defs>
            <marker id="${id}" viewBox="0 0 10 10" refX="7.5" refY="5" markerWidth="5.6" markerHeight="5.6" orient="auto">
                <path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill="#64748B" />
            </marker>
        </defs>
    `;
}

function buildFlatSequenceSvg(
    opts              ,
    baseSeq                         ,
    geometry               ,
    longStageId                     ,
    rng     
)         {
    const n = baseSeq.length;
    const offset = randomInt(n, rng);
    const seq = baseSeq.map((_, i) => baseSeq[(offset + i) % n]                );

    if (geometry === 'horizontal') {
        return buildFlatHorizontal(opts, seq, offset, longStageId);
    }
    if (geometry === 'vertical') {
        return buildFlatVertical(opts, seq, offset, longStageId);
    }
    return buildFlatCircle(opts, baseSeq, longStageId, rng);
}

function buildFlatHorizontal(
    opts              ,
    seq                         ,
    offset        ,
    longStageId                     
)         {
    const n = seq.length;
    const cy = 270;
    const gap = n >= 7 ? 16 : n === 5 ? 24 : 34;
    const baseW = n >= 7 ? 80 : n === 5 ? 92 : 116;
    const longW = 166;
    const h = n >= 7 ? 56 : 62;
    const font = n >= 7 ? 18 : 19;

    const widths = seq.map((id) => (id === longStageId ? longW : baseW));
    const totalW = widths.reduce((s, w) => s + w, 0) + gap * (n - 1);
    let curLeft = (700 - totalW) / 2;

    const centers = widths.map((w) => {
        const cx = curLeft + w / 2;
        curLeft += w + gap;
        return cx;
    });

    const arrows           = [];
    if (offset > 0) {
        const firstLeft = (centers[0] ?? 0) - (widths[0] ?? 0) / 2;
        const lastRight = (centers[n - 1] ?? 0) + (widths[n - 1] ?? 0) / 2;
        arrows.push(`<line x1="4" y1="${cy}" x2="${(firstLeft - 4).toFixed(1)}" y2="${cy}" stroke="#64748B" stroke-width="2.6" marker-end="url(#oni-arr)" />`);
        arrows.push(`<line x1="${(lastRight + 3).toFixed(1)}" y1="${cy}" x2="695" y2="${cy}" stroke="#64748B" stroke-width="2.6" marker-end="url(#oni-arr)" />`);
    }
    for (let i = 0; i < n - 1; i++) {
        const x1 = (centers[i] ?? 0) + (widths[i] ?? 0) / 2 + 2;
        const x2 = (centers[i + 1] ?? 0) - (widths[i + 1] ?? 0) / 2 - 4;
        arrows.push(`<line x1="${x1.toFixed(1)}" y1="${cy}" x2="${x2.toFixed(1)}" y2="${cy}" stroke="#64748B" stroke-width="2.6" marker-end="url(#oni-arr)" />`);
    }

    const boxes = seq.map((id, i) =>
        renderBoxNode(id, opts, centers[i] ?? 0, cy, widths[i] ?? baseW, h, font, id === longStageId)
    ).join('');

    return `${arrowDefs()}${arrows.join('')}${boxes}`;
}

function buildFlatVertical(
    opts              ,
    seq                         ,
    offset        ,
    longStageId                     
)         {
    const n = seq.length;
    const cx = 350;
    const gap = n >= 7 ? 25 : n === 5 ? 26 : 38;
    const baseH = n >= 7 ? 44 : n === 5 ? 52 : 58;
    const longH = 96;
    const w = n >= 7 ? 136 : 152;
    const font = n >= 7 ? 17 : 19;

    const heights = seq.map((id) => (id === longStageId ? longH : baseH));
    const totalH = heights.reduce((s, hh) => s + hh, 0) + gap * (n - 1);
    let curTop = (540 - totalH) / 2;

    const centers = heights.map((hh) => {
        const cy = curTop + hh / 2;
        curTop += hh + gap;
        return cy;
    });

    const arrows           = [];
    if (offset > 0) {
        const firstTop = (centers[0] ?? 0) - (heights[0] ?? 0) / 2;
        const lastBottom = (centers[n - 1] ?? 0) + (heights[n - 1] ?? 0) / 2;
        arrows.push(`<line x1="${cx}" y1="5" x2="${cx}" y2="${(firstTop - 4).toFixed(1)}" stroke="#64748B" stroke-width="2.6" marker-end="url(#oni-arr)" />`);
        arrows.push(`<line x1="${cx}" y1="${(lastBottom + 3).toFixed(1)}" x2="${cx}" y2="534" stroke="#64748B" stroke-width="2.6" marker-end="url(#oni-arr)" />`);
    }
    for (let i = 0; i < n - 1; i++) {
        const y1 = (centers[i] ?? 0) + (heights[i] ?? 0) / 2 + 2;
        const y2 = (centers[i + 1] ?? 0) - (heights[i + 1] ?? 0) / 2 - 4;
        arrows.push(`<line x1="${cx}" y1="${y1.toFixed(1)}" x2="${cx}" y2="${y2.toFixed(1)}" stroke="#64748B" stroke-width="2.6" marker-end="url(#oni-arr)" />`);
    }

    const boxes = seq.map((id, i) =>
        renderBoxNode(id, opts, cx, centers[i] ?? 0, w, heights[i] ?? baseH, font, id === longStageId)
    ).join('');

    return `${arrowDefs()}${arrows.join('')}${boxes}`;
}

function buildFlatCircle(
    opts              ,
    baseSeq                         ,
    longStageId                     ,
    rng     
)         {
    const cx = 350;
    const cy = 270;
    const r = baseSeq.length >= 7 ? 190 : 176;
    const rotDeg = randomInt(12, rng) * 30;

    let spans          ;
    if (longStageId === 'interphase' && baseSeq.length === 5) {
        spans = [180, 45, 45, 45, 45];
    } else if (baseSeq.length === 7) {
        spans = [66, 66, 66, 40.5, 40.5, 40.5, 40.5];
    } else {
        spans = baseSeq.map(() => 360 / baseSeq.length);
    }

    let acc = rotDeg;
    const sectors = baseSeq.map((id, i) => {
        const start = acc;
        const span = spans[i] ?? 0;
        const mid = start + span / 2;
        const end = start + span;
        acc = end;
        return { id, start, mid, end, span };
    });

    const pt = (deg        , rad = r)        => ({
        x: cx + rad * Math.cos((deg * Math.PI) / 180),
        y: cy + rad * Math.sin((deg * Math.PI) / 180)
    });

    let longArcBg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#E2E8F0" stroke-width="10" />`;
    if (longStageId === 'interphase' && sectors[0]) {
        const interSec = sectors[0];
        const pStart = pt(interSec.start + 8);
        const pEnd = pt(interSec.end - 8);
        longArcBg += `<path d="M ${pStart.x.toFixed(1)} ${pStart.y.toFixed(1)} A ${r} ${r} 0 0 1 ${pEnd.x.toFixed(1)} ${pEnd.y.toFixed(1)}" fill="none" stroke="#CBD5E1" stroke-width="16" stroke-linecap="round" opacity="0.7" />`;
    }

    const arcArrows = sectors.map((sec, idx) => {
        const next = sectors[(idx + 1) % sectors.length];
        if (!next) return '';
        const marginCurr = sec.id === longStageId ? 24 : 18;
        const marginNext = next.id === longStageId ? 24 : 18;
        const a1 = sec.mid + marginCurr;
        const a2 = (idx === sectors.length - 1 ? next.mid + 360 : next.mid) - marginNext;
        if (a2 - a1 < 6) return '';
        const p1 = pt(a1);
        const p2 = pt(a2);
        const largeArc = a2 - a1 > 180 ? 1 : 0;
        return `<path d="M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} A ${r} ${r} 0 ${largeArc} 1 ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}" fill="none" stroke="#64748B" stroke-width="3" marker-end="url(#oni-arr)" />`;
    }).join('');

    const boxes = sectors.map((sec) => {
        const pos = pt(sec.mid);
        const isLong = sec.id === longStageId;
        const bw = isLong ? 114 : baseSeq.length >= 7 ? 88 : 96;
        const bh = isLong ? 56 : baseSeq.length >= 7 ? 46 : 50;
        return renderBoxNode(sec.id, opts, pos.x, pos.y, bw, bh, 18, isLong);
    }).join('');

    return `${arrowDefs()}${longArcBg}${arcArrows}${boxes}`;
}

                    
                             
                  
                
                
 

function collectRuns(seq                         , predicate                               )             {
    const runs             = [];
    seq.forEach((id, idx) => {
        if (!predicate(id)) return;
        const prev = runs[runs.length - 1];
        if (prev && prev.end === idx - 1) {
            prev.end = idx;
            prev.len++;
        } else {
            runs.push({ start: idx, end: idx, len: 1 });
        }
    });
    return runs;
}

function buildContinuousWithMitoBracketSvg(
    opts              ,
    geometry               ,
    swapMitosisPair         ,
    rng     
)         {
    const leftPairId               = swapMitosisPair ? 'mitosis' : 'm';
    const rightPairId               = swapMitosisPair ? 'm' : 'mitosis';
    const offset = randomInt(SEQ_5_CONTINUOUS.length, rng);
    const seq = SEQ_5_CONTINUOUS.map((_, i) => SEQ_5_CONTINUOUS[(offset + i) % SEQ_5_CONTINUOUS.length]                );

    if (geometry === 'horizontal') {
        const xs = seq.map((_, i) => 78 + i * 136);
        const rowY = 355;
        const topY = 182;
        const bracketY = 276;

        const mitoRuns = collectRuns(seq, (id) => MITOSIS_SUB_SET.has(id));
        const mainMito = mitoRuns.reduce((a, b) => (a.len >= b.len ? a : b));
        const mitoX = Math.max(160, Math.min(540, ((xs[mainMito.start] ?? 0) + (xs[mainMito.end] ?? 0)) / 2));

        const brackets = mitoRuns.map((run) => {
            const wrapLeft = mitoRuns.length === 2 && run.start === 0;
            const wrapRight = mitoRuns.length === 2 && run.end === 4;
            const lx = wrapLeft ? 10 : (xs[run.start] ?? 0) - 44;
            const rx = wrapRight ? 690 : (xs[run.end] ?? 0) + 44;
            if (wrapLeft) return `<path d="M ${lx} ${bracketY} L ${rx} ${bracketY} L ${rx} 312" fill="none" stroke="#475569" stroke-width="2.3" />`;
            if (wrapRight) return `<path d="M ${lx} 312 L ${lx} ${bracketY} L ${rx} ${bracketY}" fill="none" stroke="#475569" stroke-width="2.3" />`;
            return `<path d="M ${lx} 312 L ${lx} ${bracketY} L ${rx} ${bracketY} L ${rx} 312" fill="none" stroke="#475569" stroke-width="2.3" />`;
        });

        const connectors = mitoRuns.map((run) => {
            const midX = ((xs[run.start] ?? 0) + (xs[run.end] ?? 0)) / 2;
            if (run === mainMito) {
                return `<path d="M ${mitoX} ${topY + 28} L ${mitoX} 242 L ${midX} 242 L ${midX} ${bracketY}" fill="none" stroke="#475569" stroke-width="2.2" />`;
            }
            return `<path d="M ${mitoX} ${topY - 28} L ${mitoX} 112 L ${midX} 112 L ${midX} ${bracketY}" fill="none" stroke="#94A3B8" stroke-width="2" stroke-dasharray="5 4" />`;
        });

        const arrows           = [];
        if (offset > 0) {
            arrows.push(`<line x1="6" y1="${rowY}" x2="22" y2="${rowY}" stroke="#64748B" stroke-width="2.6" marker-end="url(#oni-arr)" />`);
            arrows.push(`<line x1="674" y1="${rowY}" x2="694" y2="${rowY}" stroke="#64748B" stroke-width="2.6" marker-end="url(#oni-arr)" />`);
        }
        for (let i = 0; i < 4; i++) {
            arrows.push(`<line x1="${(xs[i] ?? 0) + 52}" y1="${rowY}" x2="${(xs[i + 1] ?? 0) - 54}" y2="${rowY}" stroke="#64748B" stroke-width="2.6" marker-end="url(#oni-arr)" />`);
        }

        const boxes = seq.map((id, i) =>
            renderBoxNode(id, opts, xs[i] ?? 0, rowY, 100, 58, 19, id === 'interphase')
        ).join('');

        return `
            ${arrowDefs()}
            ${brackets.join('')}
            ${connectors.join('')}
            ${arrows.join('')}
            <text x="${mitoX}" y="${topY + 8}" text-anchor="middle" font-size="23" font-weight="900" fill="#475569">＝</text>
            ${renderBoxNode(leftPairId, opts, mitoX - 70, topY, 104, 56, 19)}
            ${renderBoxNode(rightPairId, opts, mitoX + 70, topY, 104, 56, 19)}
            ${boxes}
        `;
    }

    if (geometry === 'vertical') {
        const ys = seq.map((_, i) => 70 + i * 100);
        const colX = 515;
        const bracketX = 408;
        const mitoCenterX = 205;

        const mitoRuns = collectRuns(seq, (id) => MITOSIS_SUB_SET.has(id));
        const mainMito = mitoRuns.reduce((a, b) => (a.len >= b.len ? a : b));
        const mitoY = Math.max(105, Math.min(435, ((ys[mainMito.start] ?? 0) + (ys[mainMito.end] ?? 0)) / 2));

        const brackets = mitoRuns.map((run) => {
            const wrapTop = mitoRuns.length === 2 && run.start === 0;
            const wrapBottom = mitoRuns.length === 2 && run.end === 4;
            const ty = wrapTop ? 14 : (ys[run.start] ?? 0) - 24;
            const by = wrapBottom ? 526 : (ys[run.end] ?? 0) + 24;
            if (wrapTop) return `<path d="M ${bracketX} ${ty} L ${bracketX} ${by} L 446 ${by}" fill="none" stroke="#475569" stroke-width="2.3" />`;
            if (wrapBottom) return `<path d="M 446 ${ty} L ${bracketX} ${ty} L ${bracketX} ${by}" fill="none" stroke="#475569" stroke-width="2.3" />`;
            return `<path d="M 446 ${ty} L ${bracketX} ${ty} L ${bracketX} ${by} L 446 ${by}" fill="none" stroke="#475569" stroke-width="2.3" />`;
        });

        const connectors = mitoRuns.map((run) => {
            const midY = ((ys[run.start] ?? 0) + (ys[run.end] ?? 0)) / 2;
            if (run === mainMito) {
                return `<path d="M ${mitoCenterX + 122} ${mitoY} L 368 ${mitoY} L 368 ${midY} L ${bracketX} ${midY}" fill="none" stroke="#475569" stroke-width="2.2" />`;
            }
            const edgeY = run.start === 0 ? 20 : 520;
            return `<path d="M ${mitoCenterX - 122} ${mitoY} L 42 ${mitoY} L 42 ${edgeY} L ${bracketX} ${edgeY}" fill="none" stroke="#94A3B8" stroke-width="2" stroke-dasharray="5 4" />`;
        });

        const arrows           = [];
        if (offset > 0) {
            arrows.push(`<line x1="${colX}" y1="8" x2="${colX}" y2="34" stroke="#64748B" stroke-width="2.6" marker-end="url(#oni-arr)" />`);
            arrows.push(`<line x1="${colX}" y1="502" x2="${colX}" y2="530" stroke="#64748B" stroke-width="2.6" marker-end="url(#oni-arr)" />`);
        }
        for (let i = 0; i < 4; i++) {
            arrows.push(`<line x1="${colX}" y1="${(ys[i] ?? 0) + 29}" x2="${colX}" y2="${(ys[i + 1] ?? 0) - 31}" stroke="#64748B" stroke-width="2.6" marker-end="url(#oni-arr)" />`);
        }

        const boxes = seq.map((id, i) =>
            renderBoxNode(id, opts, colX, ys[i] ?? 0, 124, 52, 18, id === 'interphase')
        ).join('');

        return `
            ${arrowDefs()}
            ${brackets.join('')}
            ${connectors.join('')}
            ${arrows.join('')}
            <text x="${mitoCenterX}" y="${mitoY + 8}" text-anchor="middle" font-size="22" font-weight="900" fill="#475569">＝</text>
            ${renderBoxNode(leftPairId, opts, mitoCenterX - 70, mitoY, 104, 52, 18)}
            ${renderBoxNode(rightPairId, opts, mitoCenterX + 70, mitoY, 104, 52, 18)}
            ${boxes}
        `;
    }

    const onRight = rng() < 0.5;
    const cx = onRight ? 235 : 465;
    const cy = 270;
    const r = 165;
    const interMid = onRight ? 180 : 0;
    const subMids = onRight ? [-67.5, -22.5, 22.5, 67.5] : [112.5, 157.5, 202.5, 247.5];
    const pt = (deg        , rad = r)        => ({
        x: cx + rad * Math.cos((deg * Math.PI) / 180),
        y: cy + rad * Math.sin((deg * Math.PI) / 180)
    });

    const allMids = [interMid, ...subMids];
    const allIds                          = ['interphase', 'prophase', 'metaphase', 'anaphase', 'telophase'];

    const arcArrows = allMids.map((deg, idx) => {
        const nextDegRaw = allMids[(idx + 1) % allMids.length] ?? 0;
        const a1 = deg + (idx === 0 ? 24 : 17);
        let a2 = nextDegRaw - (idx === 4 ? 24 : 17);
        while (a2 <= a1) a2 += 360;
        const p1 = pt(a1);
        const p2 = pt(a2);
        const large = a2 - a1 > 180 ? 1 : 0;
        return `<path d="M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}" fill="none" stroke="#64748B" stroke-width="3" marker-end="url(#oni-arr)" />`;
    }).join('');

    const mitoPanelX = onRight ? 580 : 120;
    const braceX = onRight ? 462 : 238;
    const tipX = onRight ? 425 : 275;

    const ringBoxes = allIds.map((id, i) => {
        const p = pt(allMids[i] ?? 0);
        return renderBoxNode(id, opts, p.x, p.y, id === 'interphase' ? 106 : 92, 50, 18, id === 'interphase');
    }).join('');

    return `
        ${arrowDefs()}
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#E2E8F0" stroke-width="10" />
        ${arcArrows}
        <path d="M ${tipX} 110 L ${braceX} 110 L ${braceX} 430 L ${tipX} 430" fill="none" stroke="#64748B" stroke-width="2.3" stroke-dasharray="5 4" />
        <line x1="${braceX}" y1="270" x2="${onRight ? mitoPanelX - 56 : mitoPanelX + 56}" y2="270" stroke="#64748B" stroke-width="2.2" />
        <text x="${mitoPanelX}" y="278" text-anchor="middle" font-size="22" font-weight="900" fill="#475569">＝</text>
        ${renderBoxNode(leftPairId, opts, mitoPanelX, 222, 108, 52, 18)}
        ${renderBoxNode(rightPairId, opts, mitoPanelX, 318, 108, 52, 18)}
        ${ringBoxes}
    `;
}

function buildFullShiftedHorizontalSvg(opts              , offset        , swapMitosisPair         )         {
    const seq = SEQ_7.map((_, i) => SEQ_7[(offset + i) % SEQ_7.length]                );
    const xs = seq.map((_, i) => 62 + i * 96);
    const rowY = 356;

    const runs             = [];
    seq.forEach((id, idx) => {
        const group                   = INTERPHASE_SET.has(id) ? 'inter' : 'mito';
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

    let interX = ((xs[mainInter.start] ?? 0) + (xs[mainInter.end] ?? 0)) / 2;
    let mitoX = ((xs[mainMito.start] ?? 0) + (xs[mainMito.end] ?? 0)) / 2;

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

    const bracketPaths = runs.map((run) => {
        const isWrappedLeft = runs.length === 3 && run.start === 0;
        const isWrappedRight = runs.length === 3 && run.end === 6;
        const leftX = isWrappedLeft ? 8 : (xs[run.start] ?? 0) - 34;
        const rightX = isWrappedRight ? 692 : (xs[run.end] ?? 0) + 34;
        const stroke = run.group === 'inter' ? '#64748B' : '#475569';

        if (isWrappedLeft) return `<path d="M ${leftX} ${bracketY} L ${rightX} ${bracketY} L ${rightX} 314" fill="none" stroke="${stroke}" stroke-width="2.3" />`;
        if (isWrappedRight) return `<path d="M ${leftX} 314 L ${leftX} ${bracketY} L ${rightX} ${bracketY}" fill="none" stroke="${stroke}" stroke-width="2.3" />`;
        return `<path d="M ${leftX} 314 L ${leftX} ${bracketY} L ${rightX} ${bracketY} L ${rightX} 314" fill="none" stroke="${stroke}" stroke-width="2.3" />`;
    });

    const connectors           = [];
    interRuns.forEach((run) => {
        const midX = ((xs[run.start] ?? 0) + (xs[run.end] ?? 0)) / 2;
        if (run === mainInter) {
            connectors.push(`<path d="M ${interX} ${topY + 29} L ${interX} 245 L ${midX} 245 L ${midX} ${bracketY}" fill="none" stroke="#64748B" stroke-width="2.2" />`);
        } else {
            connectors.push(`<path d="M ${interX} ${topY - 29} L ${interX} 112 L ${midX} 112 L ${midX} ${bracketY}" fill="none" stroke="#94A3B8" stroke-width="2" stroke-dasharray="5 4" />`);
        }
    });

    mitoRuns.forEach((run) => {
        const midX = ((xs[run.start] ?? 0) + (xs[run.end] ?? 0)) / 2;
        if (run === mainMito) {
            connectors.push(`<path d="M ${mitoX} ${topY + 29} L ${mitoX} 245 L ${midX} 245 L ${midX} ${bracketY}" fill="none" stroke="#475569" stroke-width="2.2" />`);
        } else {
            connectors.push(`<path d="M ${mitoX} ${topY - 29} L ${mitoX} 112 L ${midX} 112 L ${midX} ${bracketY}" fill="none" stroke="#94A3B8" stroke-width="2" stroke-dasharray="5 4" />`);
        }
    });

    const arrows           = [];
    if (offset > 0) {
        arrows.push(`<line x1="4" y1="${rowY}" x2="18" y2="${rowY}" stroke="#64748B" stroke-width="2.5" marker-end="url(#oni-arr)" />`);
        arrows.push(`<line x1="680" y1="${rowY}" x2="695" y2="${rowY}" stroke="#64748B" stroke-width="2.5" marker-end="url(#oni-arr)" />`);
    }
    for (let i = 0; i < 6; i++) {
        arrows.push(`<line x1="${(xs[i] ?? 0) + 41}" y1="${rowY}" x2="${(xs[i + 1] ?? 0) - 43}" y2="${rowY}" stroke="#64748B" stroke-width="2.5" marker-end="url(#oni-arr)" />`);
    }

    const leftPairId               = swapMitosisPair ? 'mitosis' : 'm';
    const rightPairId               = swapMitosisPair ? 'm' : 'mitosis';
    const rowBoxes = seq.map((stageId, i) => renderBoxNode(stageId, opts, xs[i] ?? 0, rowY, 80, 56, 18)).join('');

    return `
        ${arrowDefs()}
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

function buildFullShiftedVerticalSvg(opts              , offset        , swapMitosisPair         )         {
    const seq = SEQ_7.map((_, i) => SEQ_7[(offset + i) % SEQ_7.length]                );
    const ys = seq.map((_, i) => 54 + i * 72);
    const colX = 525;

    const runs             = [];
    seq.forEach((id, idx) => {
        const group                   = INTERPHASE_SET.has(id) ? 'inter' : 'mito';
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

    let interY = ((ys[mainInter.start] ?? 0) + (ys[mainInter.end] ?? 0)) / 2;
    let mitoY = ((ys[mainMito.start] ?? 0) + (ys[mainMito.end] ?? 0)) / 2;

    if (Math.abs(interY - mitoY) < 140) {
        if (interY <= mitoY) {
            interY = Math.max(110, Math.min(interY, 200));
            mitoY = Math.max(interY + 150, Math.min(mitoY, 430));
        } else {
            mitoY = Math.max(110, Math.min(mitoY, 200));
            interY = Math.min(430, Math.max(mitoY + 150, interY));
        }
    }
    interY = Math.max(95, Math.min(445, interY));
    mitoY = Math.max(95, Math.min(445, mitoY));

    const bracketX = 416;
    const interBoxX = 220;
    const mitoCenterX = 212;

    const bracketPaths = runs.map((run) => {
        const isWrappedTop = runs.length === 3 && run.start === 0;
        const isWrappedBottom = runs.length === 3 && run.end === 6;
        const topY = isWrappedTop ? 12 : (ys[run.start] ?? 0) - 18;
        const bottomY = isWrappedBottom ? 528 : (ys[run.end] ?? 0) + 18;
        const stroke = run.group === 'inter' ? '#64748B' : '#475569';

        if (isWrappedTop) return `<path d="M ${bracketX} ${topY} L ${bracketX} ${bottomY} L 452 ${bottomY}" fill="none" stroke="${stroke}" stroke-width="2.3" />`;
        if (isWrappedBottom) return `<path d="M 452 ${topY} L ${bracketX} ${topY} L ${bracketX} ${bottomY}" fill="none" stroke="${stroke}" stroke-width="2.3" />`;
        return `<path d="M 452 ${topY} L ${bracketX} ${topY} L ${bracketX} ${bottomY} L 452 ${bottomY}" fill="none" stroke="${stroke}" stroke-width="2.3" />`;
    });

    const connectors           = [];
    interRuns.forEach((run) => {
        const midY = ((ys[run.start] ?? 0) + (ys[run.end] ?? 0)) / 2;
        if (run === mainInter) {
            connectors.push(`<path d="M ${interBoxX + 54} ${interY} L 374 ${interY} L 374 ${midY} L ${bracketX} ${midY}" fill="none" stroke="#64748B" stroke-width="2.2" />`);
        } else {
            const edgeY = run.start === 0 ? 18 : 522;
            connectors.push(`<path d="M ${interBoxX - 54} ${interY} L 42 ${interY} L 42 ${edgeY} L ${bracketX} ${edgeY}" fill="none" stroke="#94A3B8" stroke-width="2" stroke-dasharray="5 4" />`);
        }
    });

    mitoRuns.forEach((run) => {
        const midY = ((ys[run.start] ?? 0) + (ys[run.end] ?? 0)) / 2;
        if (run === mainMito) {
            connectors.push(`<path d="M ${mitoCenterX + 122} ${mitoY} L 374 ${mitoY} L 374 ${midY} L ${bracketX} ${midY}" fill="none" stroke="#475569" stroke-width="2.2" />`);
        } else {
            const edgeY = run.start === 0 ? 18 : 522;
            connectors.push(`<path d="M ${mitoCenterX - 122} ${mitoY} L 42 ${mitoY} L 42 ${edgeY} L ${bracketX} ${edgeY}" fill="none" stroke="#94A3B8" stroke-width="2" stroke-dasharray="5 4" />`);
        }
    });

    const arrows           = [];
    if (offset > 0) {
        arrows.push(`<line x1="${colX}" y1="6" x2="${colX}" y2="25" stroke="#64748B" stroke-width="2.5" marker-end="url(#oni-arr)" />`);
        arrows.push(`<line x1="${colX}" y1="511" x2="${colX}" y2="531" stroke="#64748B" stroke-width="2.5" marker-end="url(#oni-arr)" />`);
    }
    for (let i = 0; i < 6; i++) {
        arrows.push(`<line x1="${colX}" y1="${(ys[i] ?? 0) + 24}" x2="${colX}" y2="${(ys[i + 1] ?? 0) - 26}" stroke="#64748B" stroke-width="2.5" marker-end="url(#oni-arr)" />`);
    }

    const leftPairId               = swapMitosisPair ? 'mitosis' : 'm';
    const rightPairId               = swapMitosisPair ? 'm' : 'mitosis';
    const colBoxes = seq.map((stageId, i) => renderBoxNode(stageId, opts, colX, ys[i] ?? 0, 116, 44, 17)).join('');

    return `
        ${arrowDefs()}
        ${bracketPaths.join('')}
        ${connectors.join('')}
        ${arrows.join('')}
        <text x="${mitoCenterX}" y="${mitoY + 8}" text-anchor="middle" font-size="22" font-weight="900" fill="#475569">＝</text>
        ${renderBoxNode('interphase', opts, interBoxX, interY, 108, 52, 18)}
        ${renderBoxNode(leftPairId, opts, mitoCenterX - 70, mitoY, 104, 52, 18)}
        ${renderBoxNode(rightPairId, opts, mitoCenterX + 70, mitoY, 104, 52, 18)}
        ${colBoxes}
    `;
}

function buildFullRotatedCircleSvg(opts              , swapMitosisPair         , rng     )         {
    const orientation = pickRandom(['right', 'bottom', 'left', 'top']         , rng);
    const jitterDeg = pickRandom([-24, -12, 0, 12, 24]         , rng);
    const baseAngles                                               = { right: 0, bottom: 90, left: 180, top: 270 };
    const mAngleDeg = baseAngles[orientation] + jitterDeg;

    const layoutMap                                                                              = {
        right: { cx: 198, cy: 270, r: 125 },
        left: { cx: 502, cy: 270, r: 125 },
        bottom: { cx: 350, cy: 175, r: 112 },
        top: { cx: 350, cy: 365, r: 112 }
    };

    const { cx, cy, r } = layoutMap[orientation];
    const pt = (deg        , radius = r)        => ({
        x: cx + radius * Math.cos((deg * Math.PI) / 180),
        y: cy + radius * Math.sin((deg * Math.PI) / 180)
    });

    const posM = pt(mAngleDeg);
    const posG1 = pt(mAngleDeg + 90);
    const posS = pt(mAngleDeg + 180);
    const posG2 = pt(mAngleDeg + 270);
    const posInter = pt(mAngleDeg + 180, 14);

    const ringMId               = swapMitosisPair ? 'mitosis' : 'm';
    const pairedMId               = swapMitosisPair ? 'm' : 'mitosis';

    let eqPos       ;
    let posPaired       ;
    let subBoxRect                                                ;
    let subPositions             ;
    let subArrows = '';
    let zoomLines = '';

    if (orientation === 'right') {
        posPaired = { x: 458, y: posM.y };
        eqPos = { x: (posM.x + 48 + posPaired.x - 48) / 2, y: posM.y + 8 };
        subBoxRect = { x: 540, y: 48, w: 146, h: 444 };
        subPositions = [106, 215, 325, 434].map((y) => ({ x: 613, y, w: 122, h: 56 }));
        subArrows = [138, 247, 357].map((y1) => `<line x1="613" y1="${y1}" x2="613" y2="${y1 + 42}" stroke="#64748B" stroke-width="2.8" marker-end="url(#oni-arr)" />`).join('');
        zoomLines = `
            <line x1="${posPaired.x + 50}" y1="${posPaired.y - 20}" x2="540" y2="64" stroke="#94A3B8" stroke-width="2" stroke-dasharray="5 4" />
            <line x1="${posPaired.x + 50}" y1="${posPaired.y + 20}" x2="540" y2="476" stroke="#94A3B8" stroke-width="2" stroke-dasharray="5 4" />
        `;
    } else if (orientation === 'left') {
        posPaired = { x: 242, y: posM.y };
        eqPos = { x: (posM.x - 48 + posPaired.x + 48) / 2, y: posM.y + 8 };
        subBoxRect = { x: 14, y: 48, w: 146, h: 444 };
        subPositions = [106, 215, 325, 434].map((y) => ({ x: 87, y, w: 122, h: 56 }));
        subArrows = [138, 247, 357].map((y1) => `<line x1="87" y1="${y1}" x2="87" y2="${y1 + 42}" stroke="#64748B" stroke-width="2.8" marker-end="url(#oni-arr)" />`).join('');
        zoomLines = `
            <line x1="${posPaired.x - 50}" y1="${posPaired.y - 20}" x2="160" y2="64" stroke="#94A3B8" stroke-width="2" stroke-dasharray="5 4" />
            <line x1="${posPaired.x - 50}" y1="${posPaired.y + 20}" x2="160" y2="476" stroke="#94A3B8" stroke-width="2" stroke-dasharray="5 4" />
        `;
    } else if (orientation === 'bottom') {
        posPaired = { x: posM.x, y: 382 };
        eqPos = { x: posM.x, y: (posM.y + 25 + posPaired.y - 25) / 2 + 7 };
        subBoxRect = { x: 42, y: 442, w: 616, h: 84 };
        subPositions = [118, 273, 427, 582].map((x) => ({ x, y: 484, w: 112, h: 54 }));
        subArrows = [178, 333, 487].map((x1) => `<line x1="${x1}" y1="484" x2="${x1 + 32}" y2="484" stroke="#64748B" stroke-width="2.8" marker-end="url(#oni-arr)" />`).join('');
        zoomLines = `
            <line x1="${posPaired.x - 48}" y1="${posPaired.y + 24}" x2="60" y2="442" stroke="#94A3B8" stroke-width="2" stroke-dasharray="5 4" />
            <line x1="${posPaired.x + 48}" y1="${posPaired.y + 24}" x2="640" y2="442" stroke="#94A3B8" stroke-width="2" stroke-dasharray="5 4" />
        `;
    } else {
        posPaired = { x: posM.x, y: 158 };
        eqPos = { x: posM.x, y: (posM.y - 25 + posPaired.y + 25) / 2 + 7 };
        subBoxRect = { x: 42, y: 14, w: 616, h: 84 };
        subPositions = [118, 273, 427, 582].map((x) => ({ x, y: 56, w: 112, h: 54 }));
        subArrows = [178, 333, 487].map((x1) => `<line x1="${x1}" y1="56" x2="${x1 + 32}" y2="56" stroke="#64748B" stroke-width="2.8" marker-end="url(#oni-arr)" />`).join('');
        zoomLines = `
            <line x1="${posPaired.x - 48}" y1="${posPaired.y - 24}" x2="60" y2="98" stroke="#94A3B8" stroke-width="2" stroke-dasharray="5 4" />
            <line x1="${posPaired.x + 48}" y1="${posPaired.y - 24}" x2="640" y2="98" stroke="#94A3B8" stroke-width="2" stroke-dasharray="5 4" />
        `;
    }

    const sCut = r * Math.SQRT1_2;
    const arcArrow = (startDeg        , endDeg        )         => {
        const p1 = pt(startDeg);
        const p2 = pt(endDeg);
        return `<path d="M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} A ${r} ${r} 0 0 1 ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}" fill="none" stroke="#64748B" stroke-width="3.3" marker-end="url(#oni-arr)" />`;
    };

    const subStageIds                          = ['prophase', 'metaphase', 'anaphase', 'telophase'];
    const subBoxesHtml = subStageIds.map((id, idx) => {
        const sp = subPositions[idx] ;
        return renderBoxNode(id, opts, sp.x, sp.y, sp.w, sp.h, 18);
    }).join('');

    return `
        ${arrowDefs()}
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


//# sourceURL=oni-boards.ts