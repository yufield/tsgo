"use strict";

import P from 'parsimmon';
import {interpretEscapes, prettyPrint} from "./helper.js";
import fs from 'fs'

let optSplit = P.regexp(/(\s|\n)*/);
let optSplitWrapper = parser => parser.skip(optSplit)
let word = str => P.string(str).thru(optSplitWrapper)
let seqObjWr = (...args) => {
    let result = [optSplit]
    for (let i = 0; i < args.length; i++) {
        let p = args[i]
        if (typeof p == "string") {
            p = P.string(p)
        }
        result.push(p)
        result.push(optSplit)
    }
    return P.seqObj(...result)
}
let TsgoParser = P.createLanguage({
    program: r => P.alt(
        r.variableStatement,
        r.value).many(),
    value: r => P.alt(r.objectExpression, r.array, r.string, r.number, r.null, r.true, r.false),
    pVariable: () => P.regexp(/[a-z]+/i).thru(optSplitWrapper),
    variableStatement: r => seqObjWr(
        ["declarator", r.identifier],
        ["id", r.pVariable],
        "=",
        ["init", r.value]),
    identifier: () => P.regexp(/[a-z][a-z0-9]*/i, 0),
    comma: () => word(","),
    null: () => word("null").result(null),
    true: () => word("true").result(true),
    false: () => word("false").result(false),
    string: () => P.regexp(/"((?:\\.|.)*?)"/, 1).map(interpretEscapes).desc("string"),
    number: () => P.regexp(/-?(0|[1-9][0-9]*)([.][0-9]+)?([eE][+-]?[0-9]+)?/).map(Number).desc("number"),
    array: r => seqObjWr("[", ["array", r.value.sepBy(r.comma)], "]"),
    pair: r => seqObjWr(["key", P.alt(r.pVariable, r.string)], ":", ["value", r.value]),
    objectExpression: r => seqObjWr("{", ["entry", r.pair.sepBy(r.comma)], "}")
});

let text = fs.readFileSync("./testcase.txt").toString();
let ast = TsgoParser.program.tryParse(text);
prettyPrint(ast);