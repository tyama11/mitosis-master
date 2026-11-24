/**
 * 左タブ「細胞周期で覚える」用の10項目データ
 */
const CYCLE_ITEMS = [
    {
        stageId: 'interphase',
        name: '間期',
        emoji: '🔵',
        color: '#0284C7',
        bg: '#E0F2FE',
        hint: 'G₁・S・G₂期をまとめた、分裂の準備をする期間'
    },
    {
        stageId: 'g1',
        name: 'G₁期',
        emoji: '🌱',
        color: '#0EA5E9',
        bg: '#F0F9FF',
        hint: '分裂直後から始まり、細胞が成長してDNA複製の準備をする時期'
    },
    {
        stageId: 's',
        name: 'S期',
        emoji: '🧬',
        color: '#0EA5E9',
        bg: '#F0F9FF',
        hint: 'DNAの複製（合成）が行われ、DNA量が2倍になる時期'
    },
    {
        stageId: 'g2',
        name: 'G₂期',
        emoji: '⚡',
        color: '#0EA5E9',
        bg: '#F0F9FF',
        hint: 'DNA複製が終わり、細胞分裂に向けた準備をする時期'
    },
    {
        stageId: 'm',
        name: 'M期',
        emoji: '🔄',
        color: '#0D9488',
        bg: '#CCFBF1',
        hint: '分裂期を表すアルファベット記号（分裂期と同義）'
    },
    {
        stageId: 'mitosis',
        name: '分裂期',
        emoji: '✨',
        color: '#0D9488',
        bg: '#CCFBF1',
        hint: '前期〜終期の4段階からなる期間（M期と同義）'
    },
    {
        stageId: 'prophase',
        name: '前期',
        emoji: '1️⃣',
        color: '#14B8A6',
        bg: '#F0FDFA',
        hint: '分裂期の最初：核膜が消え、染色体がひも状に見え始める'
    },
    {
        stageId: 'metaphase',
        name: '中期',
        emoji: '2️⃣',
        color: '#CA8A04',
        bg: '#FEF9C3',
        hint: '分裂期の2番目：染色体が赤道面に一列に並ぶ'
    },
    {
        stageId: 'anaphase',
        name: '後期',
        emoji: '3️⃣',
        color: '#EA580C',
        bg: '#FFEDD5',
        hint: '分裂期の3番目：染色体が分かれて両極へ移動する'
    },
    {
        stageId: 'telophase',
        name: '終期',
        emoji: '4️⃣',
        color: '#9333EA',
        bg: '#F3E8FF',
        hint: '分裂期の最後：細胞板やくびれができ、2つに分かれる'
    }
];

/**
 * 右タブ「細胞スケッチで覚える」用の5時期データ
 * - normalOni: 通常出題プール
 * - trickOni: たまに混ざるひっかけ出題プール
 */
const SKETCH_STAGES = [
    {
        id: 'interphase',
        stageName: '間期',
        color: '#0284C7',
        sketches: [
            { cellType: 'plant', hint: '核膜に包まれた丸い核と核小体がはっきり見える' },
            { cellType: 'animal', hint: 'まだ染色体はひも状にならず、丸い核が見える' }
        ],
        normalOni: [
            { cellType: 'plant', rotated: false, variant: 'standard', label: '植物細胞' },
            { cellType: 'animal', rotated: false, variant: 'standard', label: '動物細胞' },
            { cellType: 'plant', rotated: true, variant: 'standard', label: '植物細胞' }
        ],
        trickOni: []
    },
    {
        id: 'prophase',
        stageName: '前期',
        color: '#14B8A6',
        sketches: [
            { cellType: 'plant', hint: '核膜が消えかかり、太いひも状の染色体が現れ始める' },
            { cellType: 'animal', hint: '中心体が両極へ移動し始め、核の中に染色体が見える' }
        ],
        normalOni: [
            { cellType: 'plant', rotated: false, variant: 'standard', label: '植物細胞' },
            { cellType: 'animal', rotated: false, variant: 'standard', label: '動物細胞' },
            { cellType: 'animal', rotated: true, variant: 'standard', label: '動物細胞' }
        ],
        trickOni: [
            { cellType: 'animal', rotated: false, variant: 'tilted', label: '動物細胞' }
        ]
    },
    {
        id: 'metaphase',
        stageName: '中期',
        color: '#CA8A04',
        sketches: [
            { cellType: 'plant', hint: '染色体が細胞の中央（赤道面）に一列に並んでいる' },
            { cellType: 'animal', hint: '両極から紡錘糸が伸び、赤道面に染色体が並ぶ' }
        ],
        normalOni: [
            { cellType: 'plant', rotated: false, variant: 'standard', label: '植物細胞' },
            { cellType: 'animal', rotated: false, variant: 'standard', label: '動物細胞' },
            { cellType: 'plant', rotated: true, variant: 'standard', label: '植物細胞' },
            { cellType: 'animal', rotated: true, variant: 'standard', label: '動物細胞' }
        ],
        trickOni: [
            { cellType: 'plant', rotated: false, variant: 'polar', label: '植物細胞（極方向）' },
            { cellType: 'animal', rotated: false, variant: 'polar', label: '動物細胞（極方向）' },
            { cellType: 'animal', rotated: false, variant: 'tilted', label: '動物細胞' }
        ]
    },
    {
        id: 'anaphase',
        stageName: '後期',
        color: '#EA580C',
        sketches: [
            { cellType: 'plant', hint: '染色体が2組に分かれ、V字形で両極へ引かれている' },
            { cellType: 'animal', hint: '紡錘糸が縮み、染色体が両端へ向かって移動中' }
        ],
        normalOni: [
            { cellType: 'plant', rotated: false, variant: 'standard', label: '植物細胞' },
            { cellType: 'animal', rotated: false, variant: 'standard', label: '動物細胞' },
            { cellType: 'plant', rotated: true, variant: 'standard', label: '植物細胞' },
            { cellType: 'animal', rotated: true, variant: 'standard', label: '動物細胞' }
        ],
        trickOni: [
            { cellType: 'animal', rotated: false, variant: 'tilted', label: '動物細胞' }
        ]
    },
    {
        id: 'telophase',
        stageName: '終期',
        color: '#9333EA',
        sketches: [
            { cellType: 'plant', hint: '2つの娘核ができ、中央に「細胞板」が作られている' },
            { cellType: 'animal', hint: '2つの娘核ができ、外側から「くびれ」て仕切られる' }
        ],
        normalOni: [
            { cellType: 'plant', rotated: false, variant: 'standard', label: '植物細胞' },
            { cellType: 'animal', rotated: false, variant: 'standard', label: '動物細胞' },
            { cellType: 'plant', rotated: true, variant: 'standard', label: '植物細胞' },
            { cellType: 'animal', rotated: true, variant: 'standard', label: '動物細胞' }
        ],
        trickOni: [
            { cellType: 'animal', rotated: false, variant: 'tilted', label: '動物細胞' }
        ]
    }
];

/** 学習カテゴリごとの表示設定 */
const CATEGORY_CONFIG = {
    cycle: {
        label: '🔄 細胞周期',
        trayTitle: '🔄 周期カード',
        description: 'カードを選んで、細胞周期の正しい位置に当てはめよう！',
        startToast: '🔄 カードを選んで、正しい枠をタップしてね',
        oniToast: '👹 60秒タイムアタック！5連続正解で+3秒！'
    },
    sketch: {
        label: '🔬 細胞スケッチ',
        trayTitle: '🔬 観察カード',
        description: '細胞の観察スケッチを選んで、正しい時期に配置しよう！',
        startToast: '🔬 細胞スケッチを選んで、正しい時期をタップしてね',
        oniToast: '👹 60秒タイムアタック！5連続正解で+3秒！'
    }
};

/** 難易度ごとの表示名 */
const DIFFICULTY_LABELS = {
    easy: '🔰 かんたん',
    normal: '🧪 ふつう',
    oni: '👹 おに (60秒TA)'
};

/**
 * おにモードのスコアに応じたランク・称号判定
 */
function getOniRankInfo(category, score) {
    const thresholds = category === 'cycle'
        ? { s: 25, a: 18, b: 10 }
        : { s: 18, a: 12, b: 7 };

    if (score >= thresholds.s) {
        return {
            rank: 'S',
            icon: '👑',
            title: category === 'cycle' ? '細胞周期の神' : '細胞分裂の神',
            className: 'rank-s'
        };
    }
    if (score >= thresholds.a) {
        return {
            rank: 'A',
            icon: '🔬',
            title: '熟練研究者',
            className: 'rank-a'
        };
    }
    if (score >= thresholds.b) {
        return {
            rank: 'B',
            icon: '🧪',
            title: '一人前ラボ員',
            className: 'rank-b'
        };
    }
    return {
        rank: 'C',
        icon: '🌱',
        title: '見習い観察者',
        className: 'rank-c'
    };
}
