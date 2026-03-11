export function bind<E extends HTMLElement, K extends keyof HTMLElementEventMap>(
    el: E,
    evtType: K,
    cb: (ev: HTMLElementEventMap[K]) => any,
    useCapture: boolean = false
): () => void {
    el.addEventListener(evtType, cb, useCapture);
    let removed = false;
    return () => {
        if (removed) return;
        removed = true;
        el.removeEventListener(evtType, cb);
    };
}

export function delegate<E extends HTMLElement, K extends keyof HTMLElementEventMap>(
    el: E,
    evtType: K,
    selector: string,
    cb: (evt: HTMLElementEventMap[K] & { delegateTarget?: Element }) => void,
    useCapture: boolean = false
): () => void {
    const listener = (evt: Event) => {
        const target = (evt.target as HTMLElement).closest(selector);
        if (target && el.contains(target)) {
            (evt as any).delegateTarget = target;
            cb.call(el, evt as any);
        }
    }
    el.addEventListener(evtType, listener, useCapture);
    let removed = false;
    return () => {
        if (removed) return;
        removed = true;
        el.removeEventListener(evtType, listener, useCapture);
    }
}
