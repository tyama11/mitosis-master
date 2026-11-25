import type { Category } from './types.ts';

/** localStorage と同じ最小インターフェース（テストではメモリ実装を使う） */
export interface KeyValueStore {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

export const MUTE_STORAGE_KEY = 'mitosis-master-muted';

export function oniBestKey(category: Category): string {
    return `mitosis-master-oni-best-${category}`;
}

export function oniUnlockKey(category: Category): string {
    return `mitosis-master-oni-unlocked-${category}`;
}

export function createMemoryStore(initial: Record<string, string> = {}): KeyValueStore {
    const map = new Map<string, string>(Object.entries(initial));
    return {
        getItem: (key) => map.get(key) ?? null,
        setItem: (key, value) => {
            map.set(key, value);
        }
    };
}

/** プライベートモード等で localStorage が使えない場合はメモリに退避 */
export function safeLocalStorage(): KeyValueStore {
    try {
        const probeKey = '__mitosis_probe__';
        globalThis.localStorage.setItem(probeKey, '1');
        globalThis.localStorage.removeItem(probeKey);
        return globalThis.localStorage;
    } catch {
        return createMemoryStore();
    }
}

export interface ProgressStore {
    getOniBest(category: Category): number | null;
    setOniBest(category: Category, score: number): void;
    isOniUnlocked(category: Category): boolean;
    unlockOni(category: Category): void;
}

export function createProgressStore(store: KeyValueStore): ProgressStore {
    return {
        getOniBest(category) {
            const raw = store.getItem(oniBestKey(category));
            if (raw === null) return null;
            const value = Number(raw);
            return Number.isFinite(value) && value >= 0 ? Math.floor(value) : null;
        },
        setOniBest(category, score) {
            store.setItem(oniBestKey(category), String(score));
        },
        isOniUnlocked(category) {
            return store.getItem(oniUnlockKey(category)) === 'true';
        },
        unlockOni(category) {
            store.setItem(oniUnlockKey(category), 'true');
        }
    };
}
