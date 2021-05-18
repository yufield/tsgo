"use strict";

import P from "parsimmon";
import { interpretEscapes, prettyPrint } from "./helper.js";
import fs from "fs";

let optSplit = P.regexp(/(\s|\n)*/);
let optSplitWrapper = (parser) => parser.skip(optSplit);
let word = (str) => P.string(str).thru(optSplitWrapper);
let sepObjBy = (separator, ...args) => {
  let result = [];
  for (let i = 0; i < args.length; i++) {
    let p = args[i];
    if (typeof p == "string") {
      result.push(P.string(p));
    } else {
      result.push(p);
    }
    if (i != args.length - 1) {
      result.push(separator);
    }
  }
  return P.seqObj(...result);
};
let seq = (...args) => {
  let b = false;
  let result = [];
  for (let i = 0; i < args.length; i++) {
    let p = args[i];
    if (typeof p == "string") {
      result.push(P.string(p));
    } else {
      if (!p instanceof Array) {
        b = true;
      }
      result.push(p);
    }
  }
  if (b) {
    return P.seqObj(...result);
  } else {
    return P.seq(...result);
  }
};
let sepObj = (...args) => sepObjBy(optSplit, ...args);
let as = (type) => (r) => ({ type, ...r });
let TsgoParser = P.createLanguage({
  program: (r) => r.statements.map(as("Program")),
  statements: (r) =>
    P.sepBy(r.statement, r.statementSeparator).map((body) => ({ body })),
  statement: (r) => P.alt(r.variableStatement, r.value, r.functionDeclaration),
  value: (r) =>
    P.alt(
      r.objectExpression,
      r.arrayExpression,
      r.string,
      r.number,
      r.null,
      r.true,
      r.false
    ),
  variableStatement: (r) =>
    sepObj(["kind", P.alt(r.let, r.var)], ["id", r.identifier], "=", [
      "init",
      r.value,
    ]).map(as("VariableStatement")),
  functionParams: (r) => r.identifier.sepBy(r.commaSeparator),
  functionDeclaration: (r) =>
    sepObj(
      "func",
      ["id", r.identifier],
      "(",
      ["params", r.functionParams],
      ")",
      "{",
      ["body", r.statements.map(as("BlockStatements"))],
      "}"
    ).map(as("FunctionDeclaration")),
  identifier: () =>
    P.regexp(/[a-z][a-z0-9]*/)
      .map((a) => ({ name: a[0] }))
      .map(as("Identifier")),
  statementSeparator: () => P.regexp(/(;|\n)+/),
  optSeparator: () => P.regexp(/(\s|\n)*/),
  let: () => P.string("let"),
  var: () => P.string("var"),
  comma: () => P.string(","),
  commaSeparator: (r) => P.seq(r.optSeparator, r.comma, r.optSeparator),
  null: () => word("null").result(null),
  true: () => word("true").result(true),
  false: () => word("false").result(false),
  string: () =>
    P.regexp(/"((?:\\.|.)*?)"/, 1)
      .map(interpretEscapes)
      .desc("string"),
  number: () =>
    P.regexp(/-?(0|[1-9][0-9]*)([.][0-9]+)?([eE][+-]?[0-9]+)?/)
      .map(Number)
      .desc("number"),
  arrayExpression: (r) =>
    sepObj("[", ["elements", r.value.sepBy(r.commaSeparator)], "]").map(
      as("ArrayExpression")
    ),
  property: (r) =>
    sepObj(["key", P.alt(r.identifier, r.string)], ":", ["value", r.value]).map(
      as("Property")
    ),
  objectExpression: (r) =>
    sepObj("{", ["properties", r.property.sepBy(r.commaSeparator)], "}").map(
      as("ObjectExpression")
    ),
});

let text = fs.readFileSync("./testcase.txt").toString();
let ast = TsgoParser.program.tryParse(text);
prettyPrint(ast);
