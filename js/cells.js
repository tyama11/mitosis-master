/**
 * 体細胞分裂の顕微鏡スケッチ SVG 生成モジュール
 *
 * - stage: 'interphase' | 'prophase' | 'metaphase' | 'anaphase' | 'telophase'
 * - cellType: 'plant' | 'animal'
 * - options: {
 *     monochrome?: boolean,
 *     rotated?: boolean,
 *     variant?: 'standard' | 'polar' | 'tilted' | 'field'
 *   }
 */
function renderCellSvg(stage, cellType, options = {}) {
    const { monochrome = false, rotated = false, variant = 'standard' } = options;

    const palette = monochrome
        ? {
            wall: '#334155',
            wallFill: '#FFFFFF',
            membrane: '#334155',
            cytoFill: '#F8FAFC',
            chrom: '#0F172A',
            chromSoft: '#475569',
            spindle: '#94A3B8',
            centrosome: '#334155',
            plate: '#1E293B',
            arrow: '#DC2626'
        }
        : {
            wall: '#15803D',
            wallFill: '#F0FDF4',
            membrane: '#0284C7',
            cytoFill: '#F0F9FF',
            chrom: '#BE123C',
            chromSoft: '#E11D48',
            spindle: '#94A3B8',
            centrosome: '#D97706',
            plate: '#15803D',
            arrow: '#DC2626'
        };

    // ひっかけ1：プレパラート視野（周囲の間期細胞に混ざる矢印指定細胞）
    if (variant === 'field') {
        return renderTissueFieldSvg(stage, palette);
    }

    // ひっかけ2：極方向から見た中期（染色体が輪状に並ぶ）
    if (variant === 'polar' && stage === 'metaphase') {
        const outlineSvg = renderCellOutline('interphase', cellType, palette);
        const polarInterior = renderPolarMetaphaseInterior(palette);
        return `
            <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                ${outlineSvg}
                ${polarInterior}
            </svg>
        `;
    }

    const outlineSvg = renderCellOutline(stage, cellType, palette);
    const interiorSvg = renderStageInterior(stage, cellType, palette);

    let angle = 0;
    if (variant === 'tilted') {
        angle = 45;
    } else if (rotated) {
        angle = 90;
    }
    const rotationAttr = angle !== 0 ? ` transform="rotate(${angle} 40 40)"` : '';

    return `
        <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <g${rotationAttr}>
                ${outlineSvg}
                ${interiorSvg}
            </g>
        </svg>
    `;
}

/** 極方向から見た中期：核膜はなく、凝縮した染色体が中央付近に輪状（菊花状）に並ぶ */
function renderPolarMetaphaseInterior(p) {
    const arms = [0, 60, 120, 180, 240, 300].map((deg) => `
        <g transform="rotate(${deg} 40 40)">
            <path d="M 36 24 L 40 31 L 44 24" fill="none" stroke="${p.chrom}" stroke-width="2.9" stroke-linecap="round" stroke-linejoin="round" />
        </g>
    `).join('');
    return `<g>${arms}</g>`;
}

/** プレパラート視野（2×2の根端細胞群のうち、赤い矢印が指す右下細胞の時期を判定） */
function renderTissueFieldSvg(targetStage, p) {
    const miniInterphase = `
        <circle cx="0" cy="0" r="7.5" fill="${p.chrom}" fill-opacity="0.14" stroke="${p.chromSoft}" stroke-width="1.4" />
        <circle cx="2" cy="-1.5" r="2" fill="${p.chrom}" />
    `;

    let targetInterior = miniInterphase;
    if (targetStage === 'prophase') {
        targetInterior = `
            <circle cx="0" cy="0" r="8" fill="none" stroke="${p.chromSoft}" stroke-width="1" stroke-dasharray="2 2" />
            <path d="M -4 -3 Q 0 -6, 4 -2 M -5 2 Q 0 0, 4 5 M -2 6 Q 2 4, 5 0" fill="none" stroke="${p.chrom}" stroke-width="2" stroke-linecap="round" />
        `;
    } else if (targetStage === 'metaphase') {
        targetInterior = `
            <line x1="0" y1="-10" x2="-6" y2="0" stroke="${p.spindle}" stroke-width="0.9" />
            <line x1="0" y1="-10" x2="6" y2="0" stroke="${p.spindle}" stroke-width="0.9" />
            <line x1="0" y1="10" x2="-6" y2="0" stroke="${p.spindle}" stroke-width="0.9" />
            <line x1="0" y1="10" x2="6" y2="0" stroke="${p.spindle}" stroke-width="0.9" />
            <line x1="-9" y1="0" x2="9" y2="0" stroke="${p.chrom}" stroke-width="3" stroke-linecap="round" stroke-dasharray="3.2 2" />
        `;
    } else if (targetStage === 'anaphase') {
        targetInterior = `
            <path d="M -6 -3 L -4 -7 L -2 -3 M 2 -3 L 4 -7 L 6 -3" fill="none" stroke="${p.chrom}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M -6 3 L -4 7 L -2 3 M 2 3 L 4 7 L 6 3" fill="none" stroke="${p.chrom}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        `;
    } else if (targetStage === 'telophase') {
        targetInterior = `
            <line x1="-10" y1="0" x2="10" y2="0" stroke="${p.plate}" stroke-width="1.8" stroke-dasharray="2.5 1.5" />
            <ellipse cx="0" cy="-6.5" rx="5.5" ry="4" fill="${p.chrom}" fill-opacity="0.16" stroke="${p.chrom}" stroke-width="1.3" stroke-dasharray="2 1.5" />
            <ellipse cx="0" cy="6.5" rx="5.5" ry="4" fill="${p.chrom}" fill-opacity="0.16" stroke="${p.chrom}" stroke-width="1.3" stroke-dasharray="2 1.5" />
        `;
    }

    return `
        <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <!-- 周囲3つの間期細胞 -->
            <g opacity="0.62">
                <rect x="7" y="7" width="30" height="30" rx="3" fill="${p.wallFill}" stroke="${p.wall}" stroke-width="1.8" />
                <g transform="translate(22, 22)">${miniInterphase}</g>

                <rect x="41" y="7" width="30" height="30" rx="3" fill="${p.wallFill}" stroke="${p.wall}" stroke-width="1.8" />
                <g transform="translate(56, 22)">${miniInterphase}</g>

                <rect x="7" y="41" width="30" height="30" rx="3" fill="${p.wallFill}" stroke="${p.wall}" stroke-width="1.8" />
                <g transform="translate(22, 56)">${miniInterphase}</g>
            </g>

            <!-- 判定対象の細胞（右下・強調枠＋赤矢印） -->
            <rect x="41" y="41" width="31" height="31" rx="3.5" fill="#FFFFFF" stroke="${p.arrow}" stroke-width="2.4" />
            <g transform="translate(56.5, 56.5)">${targetInterior}</g>

            <!-- 注目矢印 -->
            <path d="M 27 29 L 40 42" stroke="${p.arrow}" stroke-width="2.8" stroke-linecap="round" />
            <polygon points="42,44 34,42 40,36" fill="${p.arrow}" />
        </svg>
    `;
}

function renderCellOutline(stage, cellType, p) {
    if (cellType === 'plant') {
        return `
            <rect x="11" y="9" width="58" height="62" rx="7" fill="${p.wallFill}" stroke="${p.wall}" stroke-width="3" />
            <rect x="14.5" y="12.5" width="51" height="55" rx="4.5" fill="none" stroke="${p.wall}" stroke-width="1" opacity="0.55" />
        `;
    }

    if (stage === 'telophase') {
        return `
            <path
                d="M 40 8 C 63 8, 65 31, 48 40 C 65 49, 63 72, 40 72 C 17 72, 15 49, 32 40 C 15 31, 17 8, 40 8 Z"
                fill="${p.cytoFill}"
                stroke="${p.membrane}"
                stroke-width="2.6"
            />
        `;
    }

    if (stage === 'anaphase') {
        return `<ellipse cx="40" cy="40" rx="26" ry="31" fill="${p.cytoFill}" stroke="${p.membrane}" stroke-width="2.6" />`;
    }

    return `<circle cx="40" cy="40" r="29" fill="${p.cytoFill}" stroke="${p.membrane}" stroke-width="2.6" />`;
}

function renderAsters(poles, p) {
    return poles.map(({ x, y }) => `
        <g stroke="${p.centrosome}" stroke-width="1.2" opacity="0.85">
            <line x1="${x - 5}" y1="${y}" x2="${x + 5}" y2="${y}" />
            <line x1="${x}" y1="${y - 5}" x2="${x}" y2="${y + 5}" />
            <line x1="${x - 3.5}" y1="${y - 3.5}" x2="${x + 3.5}" y2="${y + 3.5}" />
            <line x1="${x + 3.5}" y1="${y - 3.5}" x2="${x - 3.5}" y2="${y + 3.5}" />
        </g>
        <circle cx="${x}" cy="${y}" r="2" fill="${p.centrosome}" />
    `).join('');
}

function renderStageInterior(stage, cellType, p) {
    const isAnimal = cellType === 'animal';

    switch (stage) {
        case 'interphase': {
            const centrosome = isAnimal
                ? `<circle cx="57" cy="24" r="1.8" fill="${p.centrosome}" /><circle cx="60" cy="27" r="1.8" fill="${p.centrosome}" />`
                : '';
            return `
                ${centrosome}
                <circle cx="40" cy="40" r="16" fill="${p.chrom}" fill-opacity="0.12" stroke="${p.chrom}" stroke-width="2" />
                <circle cx="45" cy="36" r="4.2" fill="${p.chrom}" />
                <circle cx="33" cy="35" r="1.3" fill="${p.chromSoft}" />
                <circle cx="36" cy="45" r="1.4" fill="${p.chromSoft}" />
                <circle cx="44" cy="46" r="1.2" fill="${p.chromSoft}" />
                <circle cx="31" cy="41" r="1.1" fill="${p.chromSoft}" />
                <circle cx="40" cy="31" r="1.2" fill="${p.chromSoft}" />
            `;
        }

        case 'prophase': {
            const asters = isAnimal ? renderAsters([{ x: 26, y: 19 }, { x: 54, y: 61 }], p) : '';
            return `
                ${asters}
                <circle cx="40" cy="40" r="17" fill="none" stroke="${p.chromSoft}" stroke-width="1.4" stroke-dasharray="3 3" opacity="0.75" />
                <g fill="none" stroke="${p.chrom}" stroke-width="3" stroke-linecap="round">
                    <path d="M 31 33 Q 37 28, 42 35" />
                    <path d="M 44 31 Q 50 37, 45 43" />
                    <path d="M 29 42 Q 36 40, 38 48" />
                    <path d="M 41 45 Q 47 50, 50 43" />
                    <path d="M 34 50 Q 40 53, 44 48" />
                </g>
            `;
        }

        case 'metaphase': {
            const asters = isAnimal ? renderAsters([{ x: 40, y: 15 }, { x: 40, y: 65 }], p) : '';
            return `
                <g stroke="${p.spindle}" stroke-width="1.2">
                    <line x1="40" y1="15" x2="25" y2="40" />
                    <line x1="40" y1="15" x2="35" y2="40" />
                    <line x1="40" y1="15" x2="45" y2="40" />
                    <line x1="40" y1="15" x2="55" y2="40" />
                    <line x1="40" y1="65" x2="25" y2="40" />
                    <line x1="40" y1="65" x2="35" y2="40" />
                    <line x1="40" y1="65" x2="45" y2="40" />
                    <line x1="40" y1="65" x2="55" y2="40" />
                </g>
                ${asters}
                <g fill="none" stroke="${p.chrom}" stroke-width="3.2" stroke-linecap="round">
                    <path d="M 22 37 L 28 43 M 28 37 L 22 43" />
                    <path d="M 32 37 L 38 43 M 38 37 L 32 43" />
                    <path d="M 42 37 L 48 43 M 48 37 L 42 43" />
                    <path d="M 52 37 L 58 43 M 58 37 L 52 43" />
                </g>
            `;
        }

        case 'anaphase': {
            const asters = isAnimal ? renderAsters([{ x: 40, y: 14 }, { x: 40, y: 66 }], p) : '';
            return `
                <g stroke="${p.spindle}" stroke-width="1.1">
                    <line x1="40" y1="14" x2="27" y2="26" />
                    <line x1="40" y1="14" x2="36" y2="25" />
                    <line x1="40" y1="14" x2="44" y2="25" />
                    <line x1="40" y1="14" x2="53" y2="26" />
                    <line x1="40" y1="66" x2="27" y2="54" />
                    <line x1="40" y1="66" x2="36" y2="55" />
                    <line x1="40" y1="66" x2="44" y2="55" />
                    <line x1="40" y1="66" x2="53" y2="54" />
                </g>
                ${asters}
                <g fill="none" stroke="${p.chrom}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M 24 32 L 27 25 L 30 32" />
                    <path d="M 33 31 L 36 24 L 39 31" />
                    <path d="M 41 31 L 44 24 L 47 31" />
                    <path d="M 50 32 L 53 25 L 56 32" />
                    <path d="M 24 48 L 27 55 L 30 48" />
                    <path d="M 33 49 L 36 56 L 39 49" />
                    <path d="M 41 49 L 44 56 L 47 49" />
                    <path d="M 50 48 L 53 55 L 56 48" />
                </g>
            `;
        }

        case 'telophase': {
            const cellPlate = !isAnimal
                ? `<line x1="18" y1="40" x2="62" y2="40" stroke="${p.plate}" stroke-width="2.6" stroke-dasharray="4 2.5" />`
                : '';
            return `
                ${cellPlate}
                <ellipse cx="40" cy="24" rx="11" ry="8.5" fill="${p.chrom}" fill-opacity="0.14" stroke="${p.chrom}" stroke-width="1.8" stroke-dasharray="3 2" />
                <circle cx="43" cy="23" r="2.2" fill="${p.chrom}" />
                <circle cx="36" cy="25" r="1.2" fill="${p.chromSoft}" />
                <ellipse cx="40" cy="56" rx="11" ry="8.5" fill="${p.chrom}" fill-opacity="0.14" stroke="${p.chrom}" stroke-width="1.8" stroke-dasharray="3 2" />
                <circle cx="37" cy="57" r="2.2" fill="${p.chrom}" />
                <circle cx="44" cy="55" r="1.2" fill="${p.chromSoft}" />
            `;
        }

        default:
            return '';
    }
}
