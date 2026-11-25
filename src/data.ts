import type {
    Category,
    CategoryConfig,
    CycleItemDef,
    Difficulty,
    RankInfo,
    SketchStageDef
} from './types.ts';

/** 左タブ「細胞周期で覚える」用の10項目データ */
export const CYCLE_ITEMS: readonly CycleItemDef[] = [
    {
        stageId: 'interphase',
        name: '間期',
        emoji: '🔵',
        color: '#0284C7',
        bg: '#E0F2FE',
        hint: 'G₁・S・G₂期をまとめた、分裂の準備をする期間',
        oniSentences: [
            'G₁期・S期・G₂期をまとめた、分裂の準備をする期間',
            '細胞周期の大部分を占め、丸い核が見られる分裂前の期間'
        ]
    },
    {
        stageId: 'g1',
        name: 'G₁期',
        emoji: '🌱',
        color: '#0EA5E9',
        bg: '#F0F9FF',
        hint: '分裂直後から始まり、細胞が成長してDNA複製の準備をする時期',
        oniSentences: [
            '分裂直後から始まり、細胞が成長してDNA複製の準備をする時期',
            '前の分裂が終わってからDNA合成が始まるまでの準備期間'
        ]
    },
    {
        stageId: 's',
        name: 'S期',
        emoji: '🧬',
        color: '#0EA5E9',
        bg: '#F0F9FF',
        hint: 'DNAの複製（合成）が行われ、DNA量が2倍になる時期',
        oniSentences: [
            'DNAの複製（合成）が行われ、1細胞あたりのDNA量が2倍になる時期',
            '遺伝情報をもつDNAが新たに合成・複製される期間'
        ]
    },
    {
        stageId: 'g2',
        name: 'G₂期',
        emoji: '⚡',
        color: '#0EA5E9',
        bg: '#F0F9FF',
        hint: 'DNA複製が終わり、細胞分裂に向けた準備をする時期',
        oniSentences: [
            'DNA複製が完了してから、分裂に入るまでの準備をする時期',
            '2倍になったDNAをもち、細胞分裂に向けた最終準備を行う期間'
        ]
    },
    {
        stageId: 'm',
        name: 'M期',
        emoji: '🔄',
        color: '#0D9488',
        bg: '#CCFBF1',
        hint: '分裂期を表すアルファベット記号（分裂期と同義）',
        oniSentences: [
            'G₁・S・G₂に続く、分裂の期間を表すアルファベット記号'
        ]
    },
    {
        stageId: 'mitosis',
        name: '分裂期',
        emoji: '✨',
        color: '#0D9488',
        bg: '#CCFBF1',
        hint: '前期〜終期の4段階からなる期間（M期と同義）',
        oniSentences: [
            '前期・中期・後期・終期の4段階をまとめた日本語の総称'
        ]
    },
    {
        stageId: 'prophase',
        name: '前期',
        emoji: '1️⃣',
        color: '#14B8A6',
        bg: '#F0FDFA',
        hint: '分裂期の最初：核膜が消え、染色体がひも状に見え始める',
        oniSentences: [
            '核膜や核小体が消えかかり、太いひも状の染色体が現れ始める最初の段階',
            '染色体が凝縮して見え始め、紡錘糸が形成され始める段階'
        ]
    },
    {
        stageId: 'metaphase',
        name: '中期',
        emoji: '2️⃣',
        color: '#CA8A04',
        bg: '#FEF9C3',
        hint: '分裂期の2番目：染色体が赤道面に一列に並ぶ',
        oniSentences: [
            'すべての染色体が細胞の赤道面に一列に並ぶ段階',
            '紡錘体が完成し、赤道面に並んだ染色体を最も観察しやすい段階'
        ]
    },
    {
        stageId: 'anaphase',
        name: '後期',
        emoji: '3️⃣',
        color: '#EA580C',
        bg: '#FFEDD5',
        hint: '分裂期の3番目：染色体が分かれて両極へ移動する',
        oniSentences: [
            '染色体が縦裂して2組に分かれ、両極へ移動する段階',
            '紡錘糸が縮み、分かれた染色体がV字形になって両端へ引かれる段階'
        ]
    },
    {
        stageId: 'telophase',
        name: '終期',
        emoji: '4️⃣',
        color: '#9333EA',
        bg: '#F3E8FF',
        hint: '分裂期の最後：細胞板やくびれができ、2つに分かれる',
        oniSentences: [
            '細胞板やくびれができ、2つの娘細胞に仕切られる最後の段階',
            '染色体がほどけて再び核膜が現れ、細胞質が2つに分かれる段階'
        ]
    }
];

/** 右タブ「細胞スケッチで覚える」用の5時期データ */
export const SKETCH_STAGES: readonly SketchStageDef[] = [
    {
        id: 'interphase',
        stageName: '間期',
        color: '#0284C7',
        sketches: [
            { cellType: 'plant', hint: '核膜に包まれた丸い核と核小体がはっきり見える' },
            { cellType: 'animal', hint: 'まだ染色体はひも状にならず、丸い核が見える' }
        ],
        normalOni: [
            { cellType: 'plant', rotated: false, variant: 'standard' },
            { cellType: 'animal', rotated: false, variant: 'standard' },
            { cellType: 'plant', rotated: true, variant: 'standard' }
        ],
        trickOni: [],
        oniSentences: [
            '核膜に包まれた丸い核と核小体（仁）が観察できる',
            'DNAの複製が行われ、1細胞あたりのDNA量が2倍になる',
            '細胞が大きく成長し、分裂の準備を整えている状態'
        ]
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
            { cellType: 'plant', rotated: false, variant: 'standard' },
            { cellType: 'animal', rotated: false, variant: 'standard' },
            { cellType: 'animal', rotated: true, variant: 'standard' }
        ],
        trickOni: [
            { cellType: 'animal', rotated: false, variant: 'tilted' }
        ],
        oniSentences: [
            '核膜と核小体が消えかかり、太いひも状の染色体が現れ始める',
            '染色体が太く短く凝縮し始め、紡錘糸が形成され始める',
            '中心体が2つに分かれて両極へ移動し始め、染色体が見えてくる'
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
            { cellType: 'plant', rotated: false, variant: 'standard' },
            { cellType: 'animal', rotated: false, variant: 'standard' },
            { cellType: 'plant', rotated: true, variant: 'standard' },
            { cellType: 'animal', rotated: true, variant: 'standard' }
        ],
        trickOni: [
            { cellType: 'plant', rotated: false, variant: 'polar', angleNote: '極方向' },
            { cellType: 'animal', rotated: false, variant: 'polar', angleNote: '極方向' },
            { cellType: 'animal', rotated: false, variant: 'tilted' }
        ],
        oniSentences: [
            'すべての染色体が細胞の赤道面に一列に並ぶ',
            '紡錘体が完成し、染色体の数や形の観察に最も適している',
            '両極から伸びた紡錘糸が赤道面に並んだ染色体の動原体につながる'
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
            { cellType: 'plant', rotated: false, variant: 'standard' },
            { cellType: 'animal', rotated: false, variant: 'standard' },
            { cellType: 'plant', rotated: true, variant: 'standard' },
            { cellType: 'animal', rotated: true, variant: 'standard' }
        ],
        trickOni: [
            { cellType: 'animal', rotated: false, variant: 'tilted' }
        ],
        oniSentences: [
            '染色体が縦裂して2組に分かれ、両極へ移動する',
            '紡錘糸が短縮し、染色体がV字形になって両端へ引き寄せられる',
            '分かれた染色体が赤道面から離れて上下（左右）の両端へ集まっていく'
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
            { cellType: 'plant', rotated: false, variant: 'standard' },
            { cellType: 'animal', rotated: false, variant: 'standard' },
            { cellType: 'plant', rotated: true, variant: 'standard' },
            { cellType: 'animal', rotated: true, variant: 'standard' }
        ],
        trickOni: [
            { cellType: 'animal', rotated: false, variant: 'tilted' }
        ],
        oniSentences: [
            '植物細胞では中央に「細胞板」ができ、2つの娘細胞に仕切られる',
            '動物細胞では赤道面が外側から「くびれ」て2つに分かれる',
            '染色体がほどけて再び核膜と核小体が現れ、2つの娘核ができる'
        ]
    }
];

/** 学習カテゴリごとの表示設定 */
export const CATEGORY_CONFIG: Readonly<Record<Category, CategoryConfig>> = {
    cycle: {
        label: '🔄 細胞周期',
        trayTitle: '🔄 周期カード',
        description: 'カードを選んで、細胞周期の正しい位置に当てはめよう！',
        normalRuleHtml: '<b>ふつう</b>：円の周期図 ＋ 特徴の説明つき',
        oniRuleHtml: '<b>おに</b>：60秒TA（単語だけ／文章だけがランダム出題！）',
        startToast: '🔄 カードを選んで、正しい枠をクリックしてね',
        oniToast: '👹 単語だけ＆文章だけランダム出題！5連続で+3秒！'
    },
    sketch: {
        label: '🔬 細胞スケッチ',
        trayTitle: '🔬 観察カード',
        description: '細胞の観察スケッチを選んで、正しい時期に配置しよう！',
        normalRuleHtml: '<b>ふつう</b>：円の周期図 ＋ 特徴の説明つき',
        oniRuleHtml: '<b>おに</b>：60秒TA（図だけ／文章だけがランダム出題！）',
        startToast: '🔬 細胞スケッチを選んで、正しい時期をクリックしてね',
        oniToast: '👹 図だけ＆文章だけランダム出題！5連続で+3秒！'
    }
};

/** 難易度ごとの表示名 */
export const DIFFICULTY_LABELS: Readonly<Record<Difficulty, string>> = {
    easy: '🔰 かんたん',
    normal: '🧪 ふつう',
    oni: '👹 おに (60秒TA)'
};

/** おにモードのスコアに応じたランク・称号判定 */
export function getOniRankInfo(category: Category, score: number): RankInfo {
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
