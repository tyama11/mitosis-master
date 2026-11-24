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
        hint: '細胞周期の大部分を占め、G₁・S・G₂期をまとめた期間'
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
        hint: 'DNA複製が完了し、細胞分裂に向けた準備をする時期'
    },
    {
        stageId: 'm',
        name: 'M期',
        emoji: '🔄',
        color: '#0D9488',
        bg: '#CCFBF1',
        hint: '円周上でG₂期の次にくる、分裂期を表すアルファベット記号'
    },
    {
        stageId: 'mitosis',
        name: '分裂期',
        emoji: '✨',
        color: '#0D9488',
        bg: '#CCFBF1',
        hint: 'M期と同じ意味の日本語名（前期〜終期の4段階に分かれる）'
    },
    {
        stageId: 'prophase',
        name: '前期',
        emoji: '1️⃣',
        color: '#14B8A6',
        bg: '#F0FDFA',
        hint: '分裂期の最初：核膜が消え、染色体が太く見え始める時期'
    },
    {
        stageId: 'metaphase',
        name: '中期',
        emoji: '2️⃣',
        color: '#CA8A04',
        bg: '#FEF9C3',
        hint: '分裂期の2番目：染色体が赤道面に一列に並ぶ時期'
    },
    {
        stageId: 'anaphase',
        name: '後期',
        emoji: '3️⃣',
        color: '#EA580C',
        bg: '#FFEDD5',
        hint: '分裂期の3番目：染色体が分かれて両極へ移動する時期'
    },
    {
        stageId: 'telophase',
        name: '終期',
        emoji: '4️⃣',
        color: '#9333EA',
        bg: '#F3E8FF',
        hint: '分裂期の最後：細胞板やくびれができ、2つに分かれる時期'
    }
];

/**
 * 右タブ「細胞スケッチで覚える」用の5時期データ（植物・動物 各2問＝計10問）
 */
const SKETCH_STAGES = [
    {
        id: 'interphase',
        stageName: '間期',
        color: '#0284C7',
        bg: '#E0F2FE',
        sketches: [
            {
                cellType: 'plant',
                badge: '🌱 植物細胞',
                hint: '核膜に包まれた丸い核と核小体（仁）がはっきり見える'
            },
            {
                cellType: 'animal',
                badge: '🐾 動物細胞',
                hint: 'まだ染色体はひも状にならず、丸い核が見える'
            }
        ],
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
        bg: '#F0FDFA',
        sketches: [
            {
                cellType: 'plant',
                badge: '🌱 植物細胞',
                hint: '核膜が消えかかり、太いひも状の染色体が現れ始める'
            },
            {
                cellType: 'animal',
                badge: '🐾 動物細胞',
                hint: '中心体が両極へ移動し始め、核の中に染色体が見える'
            }
        ],
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
        bg: '#FEF9C3',
        sketches: [
            {
                cellType: 'plant',
                badge: '🌱 植物細胞',
                hint: '染色体が細胞の中央（赤道面）に一列に並んでいる'
            },
            {
                cellType: 'animal',
                badge: '🐾 動物細胞',
                hint: '両極から紡錘糸が伸び、赤道面に染色体が並ぶ'
            }
        ],
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
        bg: '#FFEDD5',
        sketches: [
            {
                cellType: 'plant',
                badge: '🌱 植物細胞',
                hint: '染色体が2組に分かれ、V字形で上下の両極へ引かれている'
            },
            {
                cellType: 'animal',
                badge: '🐾 動物細胞',
                hint: '紡錘糸が縮み、染色体が両端の中心体へ向かって移動中'
            }
        ],
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
        bg: '#F3E8FF',
        sketches: [
            {
                cellType: 'plant',
                badge: '🌱 植物細胞',
                hint: '2つの娘核ができ、中央に「細胞板」が作られている'
            },
            {
                cellType: 'animal',
                badge: '🐾 動物細胞',
                hint: '2つの娘核ができ、細胞膜が外側から「くびれ」て仕切られる'
            }
        ],
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
        description: 'カードを選んで、細胞周期の図（G₁・S・G₂・M・間期・分裂期・前期〜終期）の正しい位置に当てはめよう！',
        oniRule: '<b>おに</b>：60秒タイムアタック（ミスで-5秒）！全10箇所が無限に出題されます',
        startToast: '🔄 時期カードを選んで、図の正しい枠をタップしてね',
        oniToast: '👹 60秒タイムアタック開始！ミスは-5秒！'
    },
    sketch: {
        label: '🔬 細胞スケッチ',
        trayTitle: '🔬 観察カード',
        description: '細胞の観察スケッチを選んで、正しい時期（間期・前期・中期・後期・終期）に配置しよう！',
        oniRule: '<b>おに</b>：60秒タイムアタック（ミスで-5秒）！回転した細胞も登場し、図の時期名も隠れます',
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
