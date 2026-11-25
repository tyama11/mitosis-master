/** 細胞周期図に現れる全ステージID */
export type CycleStageId =
    | 'interphase'
    | 'g1'
    | 's'
    | 'g2'
    | 'm'
    | 'mitosis'
    | 'prophase'
    | 'metaphase'
    | 'anaphase'
    | 'telophase';

/** 顕微鏡スケッチで観察できる5時期 */
export type SketchStageId = 'interphase' | 'prophase' | 'metaphase' | 'anaphase' | 'telophase';

export type CellType = 'plant' | 'animal';
export type SketchVariant = 'standard' | 'polar' | 'tilted';
export type Category = 'cycle' | 'sketch';
export type Difficulty = 'easy' | 'normal' | 'oni';

export interface CycleItemDef {
    readonly stageId: CycleStageId;
    readonly name: string;
    readonly emoji: string;
    readonly color: string;
    readonly bg: string;
    readonly hint: string;
    readonly oniSentences: readonly string[];
}

export interface SketchDef {
    readonly cellType: CellType;
    readonly hint: string;
}

export interface OniSketchDef {
    readonly cellType: CellType;
    readonly rotated: boolean;
    readonly variant: SketchVariant;
    readonly angleNote?: string;
}

export interface SketchStageDef {
    readonly id: SketchStageId;
    readonly stageName: string;
    readonly color: string;
    readonly sketches: readonly SketchDef[];
    /** 通常出題プール */
    readonly normalOni: readonly OniSketchDef[];
    /** たまに混ざるひっかけ出題プール */
    readonly trickOni: readonly OniSketchDef[];
    readonly oniSentences: readonly string[];
}

export interface CategoryConfig {
    readonly label: string;
    readonly trayTitle: string;
    readonly description: string;
    readonly normalRuleHtml: string;
    readonly oniRuleHtml: string;
    readonly startToast: string;
    readonly oniToast: string;
}

interface CardBase {
    readonly id: string;
    readonly stageId: CycleStageId;
    readonly stageName: string;
}

/** 細胞周期「かんたん」「ふつう」のカード */
export interface CycleCard extends CardBase {
    readonly kind: 'cycle';
    readonly emoji: string;
    readonly name: string;
    readonly hint: string;
    readonly color: string;
    readonly bg: string;
}

/** 細胞スケッチ「かんたん」「ふつう」のカード */
export interface SketchCard extends CardBase {
    readonly kind: 'sketch';
    readonly stageId: SketchStageId;
    readonly cellType: CellType;
    readonly rotated: boolean;
    readonly variant: SketchVariant;
    readonly label: string;
    readonly hint: string;
    readonly color: string;
}

/** スケッチ「おに」：図だけの選択肢 */
export interface SketchOnlyCard extends CardBase {
    readonly kind: 'sketch-only';
    readonly stageId: SketchStageId;
    readonly cellType: CellType;
    readonly rotated: boolean;
    readonly variant: SketchVariant;
    readonly angleNote: string;
    readonly color: string;
}

/** 周期「おに」：単語だけの選択肢 */
export interface WordOnlyCard extends CardBase {
    readonly kind: 'word-only';
    readonly name: string;
}

/** 「おに」：文章だけの選択肢 */
export interface SentenceOnlyCard extends CardBase {
    readonly kind: 'sentence-only';
    readonly name: string;
}

export type Card = CycleCard | SketchCard | SketchOnlyCard | WordOnlyCard | SentenceOnlyCard;
export type CardKind = Card['kind'];

export type RankLetter = 'S' | 'A' | 'B' | 'C';

export interface RankInfo {
    readonly rank: RankLetter;
    readonly icon: string;
    readonly title: string;
    readonly className: 'rank-s' | 'rank-a' | 'rank-b' | 'rank-c';
}
