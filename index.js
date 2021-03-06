"use strict";

// Run me with Node to see my output!

import util from "util";
import P from 'parsimmon';
import {ArrayExpression} from "./astNode.js";

///////////////////////////////////////////////////////////////////////

// Turn escaped characters into real ones (e.g. "\\n" becomes "\n").
function interpretEscapes(str) {
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

// Use the JSON standard's definition of whitespace rather than Parsimmon's.
let optSplit = P.regexp(/(\s|\n)*/);
let split = P.regexp(/(\s|\n)+/)
let splitWrapper = parser => parser.skip(split)
let optSplitWrapper = parser => parser.skip(optSplit)
// JSON is pretty relaxed about whitespace, so let's make it easy to ignore
// after most text.
// Several parsers are just strings with optional whitespace.
let word = str => P.string(str).thru(optSplitWrapper)


let TsgoParser = P.createLanguage({
    program: r =>
        optSplit.then(
            P.alt(
                r.variableStatement,
                r.value
            ).many()
        ),
    value: r =>
        P.alt(r.object, r.array, r.string, r.number, r.null, r.true, r.false).thru(optSplitWrapper),
    pVariable: () => P.regexp(/[a-z]+/i).thru(optSplitWrapper),
    variableStatement: r => P.seqObj(
        P.string("var"),
        split,
        ["id", r.pVariable],
        r.equal,
        ["init", r.value],
        ["index", P.index]
    ),
    equal: () => word("="),
    lbrace: () => word("{"),
    rbrace: () => word("}"),
    lbracket: () => word("["),
    rbracket: () => word("]"),
    comma: () => word(","),
    colon: () => word(":"),
    null: () => word("null").result(null),
    true: () => word("true").result(true),
    false: () => word("false").result(false),
    string: () =>
        P.regexp(/"((?:\\.|.)*?)"/, 1).thru(optSplitWrapper)
            .map(interpretEscapes)
            .desc("string"),
    number: () =>
        P.regexp(/-?(0|[1-9][0-9]*)([.][0-9]+)?([eE][+-]?[0-9]+)?/).thru(optSplitWrapper)
            .map(Number)
            .desc("number"),
    array: r => r.lbracket.then(r.value.sepBy(r.comma)).skip(r.rbracket).map(arr => new ArrayExpression(arr)),
    pair: r => P.seq(P.alt(r.pVariable, r.string).skip(r.colon), r.value),
    object: r =>
        r.lbrace
            .then(r.pair.sepBy(r.comma))
            .skip(r.rbrace)
            .map(pairs => {
                let object = {};
                pairs.forEach(pair => {
                    let [key, value] = pair;
                    object[key] = value;
                });
                return object;
            })
});

///////////////////////////////////////////////////////////////////////

let text = ` 
var a ={
  id: "a thing\\nice\tab",
  "another property!"
    : "also cool"
  , "weird formatting is ok too........😂": 123.45e1,
  "": [
    true, false, null,
    "",
    " ",
    {a:1},
    {"": {}}
  ]
}
var b="c"
`;

function prettyPrint(x) {
    let opts = {depth: null, colors: "auto"};
    let s = util.inspect(x, opts);
    console.log(s);
}

let ast = TsgoParser.program.tryParse(text);
prettyPrint(ast);