/** id で要素を取得する。見つからなければ例外（HTML と TS のずれを早期に検出） */
export function byId                                 (id        )    {
    const el = document.getElementById(id);
    if (!el) {
        throw new Error(`要素 #${id} が index.html に見つかりません`);
    }
    return el                ;
}

/** セレクタで要素を1つ取得する。見つからなければ例外 */
export function bySelector                                 (selector        )    {
    const el = document.querySelector   (selector);
    if (!el) {
        throw new Error(`要素 ${selector} が index.html に見つかりません`);
    }
    return el;
}


//# sourceURL=dom.ts