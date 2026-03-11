import * as uikit from "@racingthebeam/uikit";
import { B, T, bind, delegate } from "@racingthebeam/domutil";

uikit.test();

const el = B("button.foo.bar", "My button", {
    data: {
        "foo": 123
    },
    onclick: (evt: Event) => { console.log("button clicked!"); },
    style: {
        "background-color": "red"
    }
});

bind(el, "click", (evt) => { console.log("click again!"); })

setTimeout(() => {
    document.body.append(el);
}, 100);

