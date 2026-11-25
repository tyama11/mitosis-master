import { CYCLE_ITEMS, SKETCH_STAGES } from './data.ts';
import { generateRandomCycleBoardSvg } from './oni-boards.ts';
import { pickRandom, shuffled, type Rng } from './random.ts';
import type {
    Card,
    Category,
    CycleStageId,
    SentenceOnlyCard,
    SketchOnlyCard,
    SketchStageDef,
    WordOnlyCard
} from './types.ts';

export const ONI_TIME_LIMIT = 60;
export const ONI_PENALTY_SECONDS = 5;
export const ONI_COMBO_STEP = 5;
export const ONI_BONUS_SECONDS = 3;
export const ONI_TRAY_SIZE = 3;
export const TRICK_SKETCH_CHANCE = 0.28;

export interface OniQuestion {
    readonly targetStageId: CycleStageId;
    readonly svgMarkup: string;
    readonly choices: Card[];
    readonly trayTitle: string;
    readonly askSentenceOnly: boolean;
    readonly nextUid: number;
}

/** かんたん・ふつう用のカード一覧を生成 */
export function buildStandardItems(category: Category, startUid = 0): { items: Card[]; nextUid: number } {
    let uid = startUid;

    if (category === 'cycle') {
        const items: Card[] = CYCLE_ITEMS.map((entry) => ({
            id: `item-${uid++}`,
            stageId: entry.stageId,
            stageName: entry.name,
            kind: 'cycle',
            emoji: entry.emoji,
            name: entry.name,
            hint: entry.hint,
            color: entry.color,
            bg: entry.bg
        }));
        return { items, nextUid: uid };
    }

    const items: Card[] = [];
    for (const stage of SKETCH_STAGES) {
        for (const sketch of stage.sketches) {
            items.push({
                id: `item-${uid++}`,
                stageId: stage.id,
                stageName: stage.stageName,
                kind: 'sketch',
                cellType: sketch.cellType,
                rotated: false,
                variant: 'standard',
                label: sketch.cellType === 'plant' ? '植物細胞' : '動物細胞',
                hint: sketch.hint,
                color: stage.color
            });
        }
    }
    return { items, nextUid: uid };
}

export function createOniItemForSketch(
    stage: SketchStageDef,
    uid: number,
    rng: Rng = Math.random
): SketchOnlyCard {
    const useTrick = stage.trickOni.length > 0 && rng() < TRICK_SKETCH_CHANCE;
    const pool = useTrick ? stage.trickOni : stage.normalOni;
    const def = pickRandom(pool, rng);

    return {
        id: `item-${uid}`,
        stageId: stage.id,
        stageName: stage.stageName,
        kind: 'sketch-only',
        cellType: def.cellType,
        rotated: Boolean(def.rotated),
        variant: def.variant,
        angleNote: def.angleNote ?? '',
        color: stage.color
    };
}

export function createOniSentenceItem(
    stage: SketchStageDef,
    uid: number,
    rng: Rng = Math.random
): SentenceOnlyCard {
    const text = pickRandom(stage.oniSentences, rng);
    return {
        id: `item-${uid}`,
        stageId: stage.id,
        stageName: stage.stageName,
        kind: 'sentence-only',
        name: text
    };
}

/** おにモードの次の1問（1箇所だけ「？」＋3択）を生成 */
export function buildOniQuestion(
    category: Category,
    currentTargetStageId: CycleStageId | null,
    startUid: number,
    rng: Rng = Math.random
): OniQuestion {
    let uid = startUid;

    if (category === 'sketch') {
        const candidates = SKETCH_STAGES.filter((s) => s.id !== currentTargetStageId);
        const correctStage = pickRandom(candidates.length > 0 ? candidates : SKETCH_STAGES, rng);
        const svgMarkup = generateRandomCycleBoardSvg(correctStage.id, rng);

        const otherStages = shuffled(
            SKETCH_STAGES.filter((s) => s.id !== correctStage.id),
            rng
        );
        const chosenStages = [correctStage, ...otherStages.slice(0, ONI_TRAY_SIZE - 1)];

        const askSentenceOnly = rng() < 0.5;
        const trayTitle = askSentenceOnly ? '❓ ？の時期の特徴は？' : '❓ ？の時期の図は？';
        const choices = shuffled(
            chosenStages.map((st) =>
                askSentenceOnly ? createOniSentenceItem(st, uid++, rng) : createOniItemForSketch(st, uid++, rng)
            ),
            rng
        );

        return {
            targetStageId: correctStage.id,
            svgMarkup,
            choices,
            trayTitle,
            askSentenceOnly,
            nextUid: uid
        };
    }

    const candidates = CYCLE_ITEMS.filter((c) => c.stageId !== currentTargetStageId);
    const correctEntry = pickRandom(candidates.length > 0 ? candidates : CYCLE_ITEMS, rng);
    const svgMarkup = generateRandomCycleBoardSvg(correctEntry.stageId, rng);

    const hasBothMitosisSynonyms =
        svgMarkup.includes('data-stage="m"') && svgMarkup.includes('data-stage="mitosis"');

    const distractorPool = shuffled(
        CYCLE_ITEMS.filter((c) => {
            if (c.stageId === correctEntry.stageId) return false;
            if (!hasBothMitosisSynonyms) {
                if (correctEntry.stageId === 'm' && c.stageId === 'mitosis') return false;
                if (correctEntry.stageId === 'mitosis' && c.stageId === 'm') return false;
            }
            return true;
        }),
        rng
    );

    const askSentenceOnly = rng() < 0.5;
    const trayTitle = askSentenceOnly ? '❓ ？の時期の特徴は？' : '❓ ？に入る名称は？';
    const chosenEntries = [correctEntry, ...distractorPool.slice(0, ONI_TRAY_SIZE - 1)];

    const choices: Card[] = shuffled(
        chosenEntries.map((entry): WordOnlyCard | SentenceOnlyCard => {
            if (askSentenceOnly) {
                return {
                    id: `item-${uid++}`,
                    stageId: entry.stageId,
                    stageName: entry.name,
                    kind: 'sentence-only',
                    name: pickRandom(entry.oniSentences, rng)
                };
            }
            return {
                id: `item-${uid++}`,
                stageId: entry.stageId,
                stageName: entry.name,
                kind: 'word-only',
                name: entry.name
            };
        }),
        rng
    );

    return {
        targetStageId: correctEntry.stageId,
        svgMarkup,
        choices,
        trayTitle,
        askSentenceOnly,
        nextUid: uid
    };
}

/** 枠の data-accept CSV とカードの stageId が一致するか（M期と分裂期の同義対応） */
export function isStageMatch(acceptedCsv: string, cardStageId: CycleStageId): boolean {
    return acceptedCsv.split(',').includes(cardStageId);
}

/** 残りミリ秒から切り上げ秒数を算出（0未満にならない） */
export function computeRemainingSeconds(endTimeMs: number, nowMs: number): number {
    return Math.ceil(Math.max(0, endTimeMs - nowMs) / 1000);
}

/** 連続正解ボーナスが発動するコンボ数か */
export function isBonusCombo(combo: number): boolean {
    return combo > 0 && combo % ONI_COMBO_STEP === 0;
}
