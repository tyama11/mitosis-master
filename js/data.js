/**
 * 細胞周期（間期＋分裂期4つ）と出題データの定義
 */
const STAGE_DATA = [
    {
        id: 'interphase',
        stageName: '間期',
        color: '#0284C7',
        bg: '#E0F2FE',
        targets: [{ x: 50.0, y: 19.4, rx: 16, ry: 11 }],
        sketches: [
            {
                title: '植物細胞（丸い核が見える）',
                cellType: 'plant',
                badge: '🌱 植物細胞',
                hint: '核膜に包まれた丸い核と核小体（仁）がはっきり見える'
            },
            {
                title: '動物細胞（分裂準備中）',
                cellType: 'animal',
                badge: '🐾 動物細胞',
                hint: 'まだ染色体はひも状にならず、丸い核が見える'
            }
        ],
        oniSketches: [
            { title: '植物細胞', cellType: 'plant', badge: '植物細胞', rotated: false },
            { title: '動物細胞', cellType: 'animal', badge: '動物細胞', rotated: false },
            { title: '植物細胞（横向き）', cellType: 'plant', badge: '植物細胞', rotated: true }
        ],
        features: [
            {
                text: 'DNAの複製が行われ、1細胞あたりのDNA量が2倍になる（S期）',
                emoji: '🧬',
                hint: '分裂に入る前の準備期間'
            },
            {
                text: '核膜に包まれた丸い核と核小体（仁）が観察できる',
                emoji: '🔵',
                hint: '細胞周期の大部分（約90%）を占める時期'
            }
        ],
        oniFeatures: [
            { text: 'DNAの複製が行われ、DNA量が2倍になる（S期）' },
            { text: '核膜と核小体（仁）がはっきりと観察できる' },
            { text: '細胞が大きく成長し、分裂の準備を整える（G₁期・G₂期）' },
            { text: '観察すると最も多くの細胞がこの時期にある（時間が最長）' }
        ]
    },
    {
        id: 'prophase',
        stageName: '前期',
        color: '#0D9488',
        bg: '#CCFBF1',
        targets: [{ x: 79.3, y: 41.9, rx: 14, ry: 11 }],
        sketches: [
            {
                title: '植物細胞（ひも状の染色体）',
                cellType: 'plant',
                badge: '🌱 植物細胞',
                hint: '核膜が消えかかり、太いひも状の染色体が現れ始める'
            },
            {
                title: '動物細胞（星状体と染色体出現）',
                cellType: 'animal',
                badge: '🐾 動物細胞',
                hint: '中心体が両極へ移動し始め、核の中に染色体が見える'
            }
        ],
        oniSketches: [
            { title: '植物細胞', cellType: 'plant', badge: '植物細胞', rotated: false },
            { title: '動物細胞', cellType: 'animal', badge: '動物細胞', rotated: false },
            { title: '動物細胞（横向き）', cellType: 'animal', badge: '動物細胞', rotated: true }
        ],
        features: [
            {
                text: '染色体が太く短く凝縮し、光学顕微鏡で見え始める',
                emoji: '🧶',
                hint: '分裂期の最初に起こる変化'
            },
            {
                text: '核膜と核小体（仁）が消失し、紡錘糸が形成され始める',
                emoji: '💨',
                hint: '核の輪郭が消えていく時期'
            }
        ],
        oniFeatures: [
            { text: '染色体が凝縮して太いひも状になり、見え始める' },
            { text: '核膜と核小体（仁）が消失し、紡錘糸が現れる' },
            { text: '動物細胞では中心体が2つに分かれて両極へ移動し始める' }
        ]
    },
    {
        id: 'metaphase',
        stageName: '中期',
        color: '#CA8A04',
        bg: '#FEF9C3',
        targets: [{ x: 68.2, y: 78.1, rx: 14, ry: 11 }],
        sketches: [
            {
                title: '植物細胞（中央に一列整列）',
                cellType: 'plant',
                badge: '🌱 植物細胞',
                hint: '染色体が細胞の中央（赤道面）に一列に並んでいる'
            },
            {
                title: '動物細胞（紡錘体と赤道面整列）',
                cellType: 'animal',
                badge: '🐾 動物細胞',
                hint: '両極から紡錘糸が伸び、赤道面に染色体が並ぶ'
            }
        ],
        oniSketches: [
            { title: '植物細胞', cellType: 'plant', badge: '植物細胞', rotated: false },
            { title: '動物細胞', cellType: 'animal', badge: '動物細胞', rotated: false },
            { title: '植物細胞（横向き極）', cellType: 'plant', badge: '植物細胞', rotated: true },
            { title: '動物細胞（横向き極）', cellType: 'animal', badge: '動物細胞', rotated: true }
        ],
        features: [
            {
                text: 'すべての染色体が細胞の赤道面に一列に並ぶ',
                emoji: '📏',
                hint: '真ん中にピシッと整列！'
            },
            {
                text: '紡錘体が完成し、染色体の数や形の観察に最も適している',
                emoji: '🔬',
                hint: '染色体が最も太く短く凝縮している時期'
            }
        ],
        oniFeatures: [
            { text: '染色体が細胞の赤道面に一列に並ぶ' },
            { text: '紡錘体が完成し、染色体の動原体に紡錘糸が結合する' },
            { text: '染色体の数や形を観察するのに最も適した時期' }
        ]
    },
    {
        id: 'anaphase',
        stageName: '後期',
        color: '#EA580C',
        bg: '#FFEDD5',
        targets: [{ x: 31.8, y: 78.1, rx: 14, ry: 11 }],
        sketches: [
            {
                title: '植物細胞（上下に分かれて移動）',
                cellType: 'plant',
                badge: '🌱 植物細胞',
                hint: '染色体が2組に分かれ、V字形で上下の両極へ引かれている'
            },
            {
                title: '動物細胞（両極への移動）',
                cellType: 'animal',
                badge: '🐾 動物細胞',
                hint: '紡錘糸が縮み、染色体が両端の中心体へ向かって移動中'
            }
        ],
        oniSketches: [
            { title: '植物細胞', cellType: 'plant', badge: '植物細胞', rotated: false },
            { title: '動物細胞', cellType: 'animal', badge: '動物細胞', rotated: false },
            { title: '植物細胞（左右極へ移動）', cellType: 'plant', badge: '植物細胞', rotated: true },
            { title: '動物細胞（左右極へ移動）', cellType: 'animal', badge: '動物細胞', rotated: true }
        ],
        features: [
            {
                text: '染色体が縦裂して2つに分かれ、両極へ移動する',
                emoji: '↔️',
                hint: '赤道面から両端へ引き離される時期'
            },
            {
                text: '紡錘糸が短縮し、染色体がV字形になって両端へ引かれる',
                emoji: '🧲',
                hint: '動原体側から先に引っ張られる'
            }
        ],
        oniFeatures: [
            { text: '縦裂した染色体が紡錘糸に引かれて両極へ移動する' },
            { text: '移動中の染色体がV字形になって両端へ引き寄せられる' },
            { text: '姉妹染色分体が分離し、それぞれの極へ分配される' }
        ]
    },
    {
        id: 'telophase',
        stageName: '終期',
        color: '#9333EA',
        bg: '#F3E8FF',
        targets: [{ x: 20.7, y: 41.9, rx: 14, ry: 11 }],
        sketches: [
            {
                title: '植物細胞（中央に仕切り線）',
                cellType: 'plant',
                badge: '🌱 植物細胞',
                hint: '2つの娘核ができ、中央に「細胞板」が作られている'
            },
            {
                title: '動物細胞（中央がくびれる）',
                cellType: 'animal',
                badge: '🐾 動物細胞',
                hint: '2つの娘核ができ、細胞膜が外側から「くびれ」て仕切られる'
            }
        ],
        oniSketches: [
            { title: '植物細胞（細胞板形成）', cellType: 'plant', badge: '植物細胞', rotated: false },
            { title: '動物細胞（くびれ形成）', cellType: 'animal', badge: '動物細胞', rotated: false },
            { title: '植物細胞（縦の細胞板）', cellType: 'plant', badge: '植物細胞', rotated: true },
            { title: '動物細胞（上下のくびれ）', cellType: 'animal', badge: '動物細胞', rotated: true }
        ],
        features: [
            {
                text: '植物細胞では赤道面に「細胞板」ができ、細胞質が仕切られる',
                emoji: '🧱',
                hint: '内側（中央）から外側へ仕切りが伸びる'
            },
            {
                text: '動物細胞では赤道面が外側から「くびれ」て2つの娘細胞になる',
                emoji: '🫧',
                hint: '再び核膜が現れ、染色体がほどけて2つの核になる'
            }
        ],
        oniFeatures: [
            { text: '植物細胞で赤道面に「細胞板」が形成され、2つに仕切られる' },
            { text: '動物細胞で細胞質が外側から「くびれ」て2つにちぎれる' },
            { text: '染色体がほどけて核膜と核小体が再び現れ、2つの娘核ができる' },
            { text: '細胞質分裂が起こり、1細胞あたりのDNA量が元の量に戻る' }
        ]
    }
];

/** 学習カテゴリごとの表示設定 */
const CATEGORY_CONFIG = {
    sketch: {
        label: '🔬 細胞スケッチ',
        trayTitle: '🔬 観察カード',
        description: '細胞の観察スケッチを選んで、細胞周期の正しい時期（間期・前期・中期・後期・終期）に配置しよう！',
        oniRule: '<b>おに</b>：60秒タイムアタック（ミスで-5秒）！回転した細胞も登場し、図の時期名も隠れます',
        startToast: '🔬 細胞スケッチを選んで、正しい時期をタップしてね',
        oniToast: '👹 60秒タイムアタック開始！ミスは-5秒！'
    },
    feature: {
        label: '🧬 特徴・現象',
        trayTitle: '🧬 現象リスト',
        description: '細胞内で起こる現象カードを選んで、細胞周期の正しい時期（間期・前期・中期・後期・終期）を判定しよう！',
        oniRule: '<b>おに</b>：60秒タイムアタック（ミスで-5秒）！図の時期名が隠れた状態で無限に出題されます',
        startToast: '🧬 現象カードを選んで、正しい時期をタップしてね',
        oniToast: '👹 60秒タイムアタック開始！ミスは-5秒！'
    }
};

/** 難易度ごとの表示名 */
const DIFFICULTY_LABELS = {
    easy: '🔰 かんたん',
    normal: '🧪 ふつう',
    oni: '👹 おに (60秒TA)'
};
