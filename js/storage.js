                                           

/** localStorage と同じ最小インターフェース（テストではメモリ実装を使う） */
                                
                                        
                                              
 

export const MUTE_STORAGE_KEY = 'mitosis-master-muted';

export function oniBestKey(category          )         {
    return `mitosis-master-oni-best-${category}`;
}

export function oniUnlockKey(category          )         {
    return `mitosis-master-oni-unlocked-${category}`;
}

export function createMemoryStore(initial                         = {})                {
    const map = new Map                (Object.entries(initial));
    return {
        getItem: (key) => map.get(key) ?? null,
        setItem: (key, value) => {
            map.set(key, value);
        }
    };
}

/** プライベートモード等で localStorage が使えない場合はメモリに退避 */
export function safeLocalStorage()                {
    try {
        const probeKey = '__mitosis_probe__';
        globalThis.localStorage.setItem(probeKey, '1');
        globalThis.localStorage.removeItem(probeKey);
        return globalThis.localStorage;
    } catch {
        return createMemoryStore();
    }
}

                                
                                                  
                                                        
                                               
                                        
 

export function createProgressStore(store               )                {
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


//# sourceURL=storage.ts