import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderCellSvg } from '../src/cells.ts';
import { CYCLE_ITEMS, SKETCH_STAGES, getOniRankInfo } from '../src/data.ts';
import {
    ONI_TRAY_SIZE,
    buildOniQuestion,
    buildStandardItems,
    computeRemainingSeconds,
    isBonusCombo,
    isStageMatch
} from '../src/game-logic.ts';
import { generateRandomCycleBoardSvg, generateRandomSketchBoardSvg } from '../src/oni-boards.ts';
import { comboFrequency, createSoundFx } from '../src/sound.ts';
import { createMemoryStore, createProgressStore } from '../src/storage.ts';
import type { CycleStageId, SketchStageId } from '../src/types.ts';

/** テスト用の決定論的疑似乱数 (LCG) */
function createSeededRng(seed = 12345): () => number {
    let s = seed >>> 0;
    return () => {
        s = (Math.imul(1664525, s) + 1013904223) >>> 0;
        return s / 0x100000000;
    };
}

describe('data & rank info', () => {
    it('CYCLE_ITEMS has 10 stages with hints and oniSentences', () => {
        assert.equal(CYCLE_ITEMS.length, 10);
        for (const item of CYCLE_ITEMS) {
            assert.ok(item.name.length > 0);
            assert.ok(item.hint.length > 0);
            assert.ok(item.oniSentences.length > 0);
        }
    });

    it('SKETCH_STAGES has 5 stages with plant & animal sketches and oniSentences', () => {
        assert.equal(SKETCH_STAGES.length, 5);
        for (const stage of SKETCH_STAGES) {
            assert.equal(stage.sketches.length, 2);
            assert.ok(stage.normalOni.length > 0);
            assert.ok(stage.oniSentences.length > 0);
        }
    });

    it('getOniRankInfo returns S/A/B/C ranks at exact thresholds', () => {
        assert.equal(getOniRankInfo('cycle', 25).rank, 'S');
        assert.equal(getOniRankInfo('cycle', 24).rank, 'A');
        assert.equal(getOniRankInfo('cycle', 18).rank, 'A');
        assert.equal(getOniRankInfo('cycle', 10).rank, 'B');
        assert.equal(getOniRankInfo('cycle', 9).rank, 'C');

        assert.equal(getOniRankInfo('sketch', 18).rank, 'S');
        assert.equal(getOniRankInfo('sketch', 12).rank, 'A');
        assert.equal(getOniRankInfo('sketch', 7).rank, 'B');
        assert.equal(getOniRankInfo('sketch', 0).rank, 'C');
    });
});

describe('cells SVG renderer', () => {
    const stages: readonly SketchStageId[] = ['interphase', 'prophase', 'metaphase', 'anaphase', 'telophase'];

    it('renders valid SVG for all stages in plant & animal cells', () => {
        for (const stage of stages) {
            for (const cellType of ['plant', 'animal'] as const) {
                const svg = renderCellSvg(stage, cellType);
                assert.match(svg, /<svg viewBox="0 0 80 80"/);
                assert.match(svg, /<\/svg>/);
            }
        }
    });

    it('supports monochrome, rotated (90deg), tilted (45deg), and polar metaphase', () => {
        const rotated = renderCellSvg('prophase', 'animal', { monochrome: true, rotated: true });
        assert.match(rotated, /rotate\(90 40 40\)/);

        const tilted = renderCellSvg('anaphase', 'plant', { variant: 'tilted' });
        assert.match(tilted, /rotate\(45 40 40\)/);

        const polar = renderCellSvg('metaphase', 'plant', { monochrome: true, variant: 'polar' });
        assert.match(polar, /rotate\(300 40 40\)/);
    });
});

describe('oni-boards SVG generator', () => {
    const allCycleStages: readonly CycleStageId[] = [
        'interphase', 'g1', 's', 'g2', 'm', 'mitosis', 'prophase', 'metaphase', 'anaphase', 'telophase'
    ];

    it('generates exactly one .oni-target-blank matching targetStageId across seeds', () => {
        const rng = createSeededRng(42);
        for (let round = 0; round < 5; round++) {
            for (const stageId of allCycleStages) {
                const svg = generateRandomCycleBoardSvg(stageId, rng);
                const blanks = svg.match(/oni-target-blank/g) ?? [];
                assert.equal(blanks.length, 1, `Expected 1 blank for ${stageId}`);
                assert.ok(
                    svg.includes(`oni-target-blank interactive-target" data-stage="${stageId}"`),
                    `Blank should target ${stageId}`
                );
            }
        }
    });

    it('generates sketch board SVGs with masked targets', () => {
        const rng = createSeededRng(99);
        const svg = generateRandomSketchBoardSvg(rng);
        assert.match(svg, /sketch-target interactive-target masked/);
    });
});

describe('game-logic', () => {
    it('buildStandardItems returns 10 items with hints for both categories', () => {
        const cycle = buildStandardItems('cycle', 10);
        assert.equal(cycle.items.length, 10);
        assert.equal(cycle.nextUid, 20);
        assert.ok(cycle.items.every((c) => c.kind === 'cycle' && c.hint.length > 0));

        const sketch = buildStandardItems('sketch', 0);
        assert.equal(sketch.items.length, 10);
        assert.equal(sketch.nextUid, 10);
        assert.ok(sketch.items.every((c) => c.kind === 'sketch' && c.hint.length > 0));
    });

    it('buildOniQuestion produces 3 choices containing the target and never repeats targetStageId', () => {
        const rng = createSeededRng(777);
        let prevTarget: CycleStageId | null = null;
        let uid = 0;

        for (let i = 0; i < 30; i++) {
            const q = buildOniQuestion('cycle', prevTarget, uid, rng);
            assert.notEqual(q.targetStageId, prevTarget);
            assert.equal(q.choices.length, ONI_TRAY_SIZE);
            assert.ok(q.choices.some((c) => c.stageId === q.targetStageId));
            prevTarget = q.targetStageId;
            uid = q.nextUid;
        }
    });

    it('buildOniQuestion for sketch produces 3 choices (sketch-only or sentence-only)', () => {
        const rng = createSeededRng(2026);
        let prevTarget: CycleStageId | null = null;
        let uid = 0;

        for (let i = 0; i < 20; i++) {
            const q = buildOniQuestion('sketch', prevTarget, uid, rng);
            assert.notEqual(q.targetStageId, prevTarget);
            assert.equal(q.choices.length, ONI_TRAY_SIZE);
            assert.ok(q.choices.some((c) => c.stageId === q.targetStageId));
            const expectedKind = q.askSentenceOnly ? 'sentence-only' : 'sketch-only';
            assert.ok(q.choices.every((c) => c.kind === expectedKind));
            prevTarget = q.targetStageId;
            uid = q.nextUid;
        }
    });

    it('isStageMatch handles single stage and m/mitosis synonyms', () => {
        assert.equal(isStageMatch('g1', 'g1'), true);
        assert.equal(isStageMatch('g1', 's'), false);
        assert.equal(isStageMatch('m,mitosis', 'm'), true);
        assert.equal(isStageMatch('m,mitosis', 'mitosis'), true);
        assert.equal(isStageMatch('m,mitosis', 'prophase'), false);
    });

    it('computeRemainingSeconds and isBonusCombo behave accurately', () => {
        assert.equal(computeRemainingSeconds(10_500, 10_000), 1);
        assert.equal(computeRemainingSeconds(9_000, 10_000), 0);
        assert.equal(isBonusCombo(0), false);
        assert.equal(isBonusCombo(4), false);
        assert.equal(isBonusCombo(5), true);
        assert.equal(isBonusCombo(10), true);
    });
});

describe('storage & sound', () => {
    it('createProgressStore persists oni best scores and unlocks', () => {
        const store = createMemoryStore();
        const progress = createProgressStore(store);

        assert.equal(progress.getOniBest('cycle'), null);
        assert.equal(progress.isOniUnlocked('cycle'), false);

        progress.unlockOni('cycle');
        progress.setOniBest('cycle', 21);

        assert.equal(progress.isOniUnlocked('cycle'), true);
        assert.equal(progress.getOniBest('cycle'), 21);
        assert.equal(progress.isOniUnlocked('sketch'), false);
    });

    it('comboFrequency clamps and createSoundFx toggles mute state', () => {
        assert.equal(comboFrequency(0), 523.25);
        assert.equal(comboFrequency(1), 523.25);
        assert.equal(comboFrequency(99), 1318.51);

        const store = createMemoryStore();
        const fx = createSoundFx(store);
        assert.equal(fx.isMuted(), false);
        assert.equal(fx.toggleMute(), true);
        assert.equal(fx.isMuted(), true);
        assert.equal(fx.toggleMute(), false);
    });
});

describe('DOM & index.html integrity', () => {
    const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
    const html = readFileSync(join(rootDir, 'index.html'), 'utf8');
    const appTs = readFileSync(join(rootDir, 'src/app.ts'), 'utf8');

    it('every byId(...) referenced in src/app.ts exists in index.html', () => {
        const idMatches = [...appTs.matchAll(/byId(?:<[^>]+>)?\('([^']+)'\)/g)];
        assert.ok(idMatches.length > 10, 'Expected at least 10 byId calls in src/app.ts');

        for (const match of idMatches) {
            const id = match[1];
            assert.ok(id, 'Expected captured id');
            assert.ok(
                html.includes(`id="${id}"`),
                `index.html is missing element with id="${id}"`
            );
        }
    });

    it('linear-svg and circle-svg each contain all 10 stage nodes and m/mitosis synonyms', () => {
        const linearStart = html.indexOf('id="linear-svg"');
        const circleStart = html.indexOf('id="circle-svg"');
        const oniStart = html.indexOf('id="oni-cycle-svg"');
        assert.ok(linearStart !== -1 && circleStart > linearStart && oniStart > circleStart);

        const linearSection = html.slice(linearStart, circleStart);
        const circleSection = html.slice(circleStart, oniStart);
        const requiredStages: readonly CycleStageId[] = [
            'interphase', 'g1', 's', 'g2', 'm', 'mitosis', 'prophase', 'metaphase', 'anaphase', 'telophase'
        ];

        for (const section of [linearSection, circleSection]) {
            for (const stage of requiredStages) {
                assert.ok(
                    section.includes(`data-stage="${stage}"`),
                    `Missing data-stage="${stage}"`
                );
            }
            const synMatches = section.match(/data-accept="m,mitosis"/g) ?? [];
            assert.equal(synMatches.length, 2, 'Expected both m and mitosis to accept m,mitosis');
        }
    });

    it('index.html loads js/app.js as module with matching cache-busting version', () => {
        const cssMatch = html.match(/href="css\/style\.css\?v=([^"]+)"/);
        const jsMatch = html.match(/<script type="module" src="js\/app\.js\?v=([^"]+)"><\/script>/);
        assert.ok(cssMatch?.[1], 'Missing css/style.css?v=... link');
        assert.ok(jsMatch?.[1], 'Missing <script type="module" src="js/app.js?v=...">');
        assert.equal(cssMatch[1], jsMatch[1], 'CSS and JS cache-buster versions should match');
    });
});
