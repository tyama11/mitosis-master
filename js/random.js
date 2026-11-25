/** 0以上1未満の乱数を返す関数（テストではシード付き乱数を差し込む） */
                               

export function randomInt(maxExclusive        , rng      = Math.random)         {
    return Math.floor(rng() * maxExclusive);
}

export function pickRandom   (arr              , rng      = Math.random)    {
    if (arr.length === 0) {
        throw new Error('pickRandom: 空の配列からは選べません');
    }
    return arr[randomInt(arr.length, rng)]     ;
}

/** Fisher–Yates シャッフル（破壊的） */
export function shuffleInPlace   (array     , rng      = Math.random)      {
    for (let i = array.length - 1; i > 0; i--) {
        const j = randomInt(i + 1, rng);
        const tmp = array[i]     ;
        array[i] = array[j]     ;
        array[j] = tmp;
    }
    return array;
}

/** 元配列を変更せずにシャッフルしたコピーを返す */
export function shuffled   (arr              , rng      = Math.random)      {
    return shuffleInPlace([...arr], rng);
}


//# sourceURL=random.ts