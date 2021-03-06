// Turn escaped characters into real ones (e.g. "\\n" becomes "\n").
import util from "util";

export function interpretEscapes(str) {
    let escapes = {
        b: "\b",
        f: "\f",
        n: "\n",
        r: "\r",
        t: "\t"
    };
    return str.replace(/\\(u[0-9a-fA-F]{4}|[^u])/, (_, escape) => {
        let type = escape.charAt(0);
        let hex = escape.slice(1);
        if (type === "u") {
            return String.fromCharCode(parseInt(hex, 16));
        }
        if (escapes.hasOwnProperty(type)) {
            return escapes[type];
        }
        return type;
    });
}

export function prettyPrint(x) {
    let opts = {depth: null, colors: "auto"};
    let s = util.inspect(x, opts);
    console.log(s);
}