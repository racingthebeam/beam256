const DEFAULT_UNITS = new Map<string, string>(Object.entries({
    fontSize: 'px',

    top: 'px',
    right: 'px',
    bottom: 'px',
    left: 'px',

    width: 'px',
    minWidth: 'px',
    maxWidth: 'px',

    height: 'px',
    minHeight: 'px',
    maxHeight: 'px',

    outlineWidth: 'px',

    margin: 'px',
    marginTop: 'px',
    marginRight: 'px',
    marginBottom: 'px',
    marginLeft: 'px',

    padding: 'px',
    paddingTop: 'px',
    paddingRight: 'px',
    paddingBottom: 'px',
    paddingLeft: 'px',

    borderTopWidth: 'px',
    borderRightWidth: 'px',
    borderBottomWidth: 'px',
    borderLeftWidth: 'px'
}));

type ExtractTag<S extends string> =
    S extends "" ? "div" :
    S extends `.${string}` | `#${string}` ? "div" :
    S extends `${infer Tag}#${string}` ? Tag :
    S extends `${infer Tag}.${string}` ? Tag :
    S;

type ElementFromSelector<S extends string> =
    ExtractTag<S> extends keyof HTMLElementTagNameMap
    ? HTMLElementTagNameMap[ExtractTag<S>]
    : HTMLElement;

type Feature =
    (() => Feature)
    | string
    | number
    | false
    | null
    | Node
    | { [key: string]: any }
    | Feature[];

export function build<S extends string>(tag: S, ...features: Feature[]): ElementFromSelector<S> {
    const el = createElement(tag);
    append(el, features);
    return el as ElementFromSelector<S>;
}

export function text(text: string): Text {
    return document.createTextNode(text);
}

function setAttribute(el: HTMLElement, k: string, v: any) {
    if (v === true) {
        el.setAttribute(k, '');
    } else if (typeof v === 'object') {
        el.setAttribute(k, JSON.stringify(v));
    } else if (v !== false) {
        el.setAttribute(k, v);
    }
}

type Setter = (el: HTMLElement, v: any) => void;

const SETTERS = new Map<string, Setter>(Object.entries({
    style(el: HTMLElement, v: any) {
        if (typeof v === 'string') {
            el.style.cssText = v;
        } else {
            for (let prop in v) {
                let pv = v[prop];
                if (typeof pv === 'number' && DEFAULT_UNITS.has(prop)) {
                    pv = String(pv) + DEFAULT_UNITS.get(prop);
                }
                el.style.setProperty(prop, pv);
            }
        }
    },
    properties(el: HTMLElement, v: any) {
        for (const [prop, value] of Object.entries(v)) {
            (el as any)[prop] = value;
        }
    },
    innerHTML(el: HTMLElement, v: any) {
        el.innerHTML = v;
    },
    data(el: HTMLElement, v: any) {
        for (let [dk, dv] of Object.entries(v)) {
            if (typeof dv === 'object') dv = JSON.stringify(dv);
            setAttribute(el, `data-${dk}`, dv);
        }
    }
}));

function append(el: HTMLElement, features: any[]) {
    for (let f of features) {
        while (typeof f === 'function') {
            f = f();
        }
        if (typeof f === 'string' || typeof f === 'number') {
            el.appendChild(document.createTextNode(String(f)));
        } else if (Array.isArray(f)) {
            append(el, f);
        } else if (!f) {
            continue;
        } else if (f instanceof Node) {
            el.appendChild(f);
        } else {
            for (const [k, v] of Object.entries(f)) {
                const s = SETTERS.get(k);
                if (s) {
                    s(el, v);
                } else if (typeof v === 'function' && k.startsWith('on')) {
                    el.addEventListener(k.substring(2).toLowerCase(), v as EventListener);
                } else {
                    setAttribute(el, k, v);
                }
            }
        }
    }
    return el;
}

// FIXME: support namespaces e.g. svg:circle
function createElement(tag: string): HTMLElement {
    if (tag.length) {
        var m;
        if ((m = /^([\w-]+)?(#[\w-]+)?((\.[\w-]+)*)$/.exec(tag))) {
            var el = document.createElement(m[1] || 'div');
            if (m[2]) el.id = m[2].substring(1);
            if (m[3]) el.className = m[3].replace(/\./g, ' ').trim();
            return el;
        }
    }
    throw new Error("invalid tag");
}
