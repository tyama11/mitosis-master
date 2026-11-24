/**
 * 左タブ「細胞周期で覚える」用の10項目データ（説明文なし）
 */
const CYCLE_ITEMS = [
    { stageId: 'interphase', name: '間期', emoji: '🔵', color: '#0284C7', bg: '#E0F2FE' },
    { stageId: 'g1', name: 'G₁期', emoji: '🌱', color: '#0EA5E9', bg: '#F0F9FF' },
    { stageId: 's', name: 'S期', emoji: '🧬', color: '#0EA5E9', bg: '#F0F9FF' },
    { stageId: 'g2', name: 'G₂期', emoji: '⚡', color: '#0EA5E9', bg: '#F0F9FF' },
    { stageId: 'm', name: 'M期', emoji: '🔄', color: '#0D9488', bg: '#CCFBF1' },
    { stageId: 'mitosis', name: '分裂期', emoji: '✨', color: '#0D9488', bg: '#CCFBF1' },
    { stageId: 'prophase', name: '前期', emoji: '1️⃣', color: '#14B8A6', bg: '#F0FDFA' },
    { stageId: 'metaphase', name: '中期', emoji: '2️⃣', color: '#CA8A04', bg: '#FEF9C3' },
    { stageId: 'anaphase', name: '後期', emoji: '3️⃣', color: '#EA580C', bg: '#FFEDD5' },
    { stageId: 'telophase', name: '終期', emoji: '4️⃣', color: '#9333EA', bg: '#F3E8FF' }
];

/**
 * 右タブ「細胞スケッチで覚える」用の5時期データ（説明文なし・計10問）
 */
const SKETCH_STAGES = [
    {
        id: 'interphase',
        stageName: '間期',
        color: '#0284C7',
        sketches: [{ cellType: 'plant' }, { cellType: 'animal' }],
        oniSketches: [
            { cellType: 'plant', rotated: false },
            { cellType: 'animal', rotated: false },
            { cellType: 'plant', rotated: true }
        ]
    },
    {
        id: 'prophase',
        stageName: '前期',
        color: '#14B8A6',
        sketches: [{ cellType: 'plant' }, { cellType: 'animal' }],
        oniSketches: [
            { cellType: 'plant', rotated: false },
            { cellType: 'animal', rotated: false },
            { cellType: 'animal', rotated: true }
        ]
    },
    {
        id: 'metaphase',
        stageName: '中期',
        color: '#CA8A04',
        sketches: [{ cellType: 'plant' }, { cellType: 'animal' }],
        oniSketches: [
            { cellType: 'plant', rotated: false },
            { cellType: 'animal', rotated: false },
            { cellType: 'plant', rotated: true },
            { cellType: 'animal', rotated: true }
        ]
    },
    {
        id: 'anaphase',
        stageName: '後期',
        color: '#EA580C',
        sketches: [{ cellType: 'plant' }, { cellType: 'animal' }],
        oniSketches: [
            { cellType: 'plant', rotated: false },
            { cellType: 'animal', rotated: false },
            { cellType: 'plant', rotated: true },
            { cellType: 'animal', rotated: true }
        ]
    },
    {
        id: 'telophase',
        stageName: '終期',
        color: '#9333EA',
        sketches: [{ cellType: 'plant' }, { cellType: 'animal' }],
        oniSketches: [
            { cellType: 'plant', rotated: false },
            { cellType: 'animal', rotated: false },
            { cellType: 'plant', rotated: true },
            { cellType: 'animal', rotated: true }
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
        oniToast: ''
    },
    sketch: {
        label: '🔬 細胞スケッチ',
        trayTitle: '🔬 観察カード',
        description: '細胞の観察スケッチを選んで、正しい時期に配置しよう！',
        startToast: '🔬 細胞スケッチを選んで、正しい時期をタップしてね',
        oniToast: '👹 60秒タイムアタック開始！ミスは-5秒！'
    }
};

/** 難易度ごとの表示名 */
const DIFFICULTY_LABELS = {
    easy: '🔰 かんたん',
    normal: '🧪 ふつう',
    oni: '👹 おに (60秒TA)'
};
