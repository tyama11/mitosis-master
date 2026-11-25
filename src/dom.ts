/** id で要素を取得する。見つからなければ例外（HTML と TS のずれを早期に検出） */
export function byId<T extends Element = HTMLElement>(id: string): T {
    const el = document.getElementById(id);
    if (!el) {
        throw new Error(`要素 #${id} が index.html に見つかりません`);
    }
    return el as Element as T;
}

/** セレクタで要素を1つ取得する。見つからなければ例外 */
export function bySelector<T extends Element = HTMLElement>(selector: string): T {
    const el = document.querySelector<T>(selector);
    if (!el) {
        throw new Error(`要素 ${selector} が index.html に見つかりません`);
    }
    return el;
}
