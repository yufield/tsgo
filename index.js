"use strict";

// Run me with Node to see my output!

import util from "util";
import P from 'parsimmon';

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
let whitespace = P.regexp(/\s*/m);

// JSON is pretty relaxed about whitespace, so let's make it easy to ignore
// after most text.
function token(parser) {
    return parser.skip(whitespace);
}

// Several parsers are just strings with optional whitespace.
function word(str) {
    return P.string(str).thru(token);
}

let JSONParser = P.createLanguage({
    program: r => P.alt(r.variableStatement, r.value),
    value: r =>
        P.alt(r.object, r.array, r.string, r.number, r.null, r.true, r.false).thru(
            parser => whitespace.then(parser)
        ),
    pVariable: () => P.regexp(/[a-z]+/i).thru(token),
    variableStatement: r => P.seq(word("var").then(r.pVariable).skip(r.equal), r.value).map(seq => ({
        varName: seq[0],
        value: seq[1]
    })),
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
        token(P.regexp(/"((?:\\.|.)*?)"/, 1))
            .map(interpretEscapes)
            .desc("string"),
    number: () =>
        token(P.regexp(/-?(0|[1-9][0-9]*)([.][0-9]+)?([eE][+-]?[0-9]+)?/))
            .map(Number)
            .desc("number"),
    array: r => r.lbracket.then(r.value.sepBy(r.comma)).skip(r.rbracket),
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

let text = `\
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
`;

function prettyPrint(x) {
    let opts = {depth: null, colors: "auto"};
    let s = util.inspect(x, opts);
    console.log(s);
}

let ast = JSONParser.program.tryParse(text);
prettyPrint(ast);