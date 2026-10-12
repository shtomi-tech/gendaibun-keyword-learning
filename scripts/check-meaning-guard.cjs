"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const guard = require("../static/meaning-guard.js");
const words = [3, 7, 8, 9, 10].flatMap((number) => JSON.parse(fs.readFileSync(
  path.join(__dirname, `../data/set-${String(number).padStart(2, "0")}.json`), "utf8",
)).words);
const word = (headword) => {
  const found = words.find((candidate) => candidate.headword === headword);
  assert.ok(found, headword);
  return found;
};
const distinctPairs = [
  ["文化", "文明"], ["自我", "アイデンティティ"],
  ["コード", "制度"], ["コード", "規範"], ["コード", "禁忌"],
  ["制度", "規範"], ["制度", "禁忌"], ["規範", "禁忌"],
];
for (const [left, right] of distinctPairs) {
  assert.equal(guard.isSafePair(word(left), word(right)), true, `${left} / ${right} must be available together`);
}
const original = word("文化");
assert.equal(guard.isSafePair(original, { ...original, id: "duplicate-meaning" }), false, "same meaning must still be excluded");
assert.equal(guard.isSafePair(word("象徴"), word("アレゴリー")), false, "existing overlap protection must remain");
console.log(`OK: meaning guard / ${distinctPairs.length} distinct pairs + overlap protection`);
