// scripts/check-*.mjs が共有する読み込みと、意味重複ガードの薄いラッパー。
import fs from "node:fs";
import { createRequire } from "node:module";

const root = new URL("../../", import.meta.url);
const require = createRequire(import.meta.url);

export const guard = require("../../static/meaning-guard.js");
// 改行コードはLFへ揃える。実装の字面を正規表現で見る検査が、CRLFの作業コピーでも同じ結果になる。
export const read = (relativePath) => fs.readFileSync(new URL(relativePath, root), "utf8").replace(/\r\n/g, "\n");
export const readJson = (relativePath) => JSON.parse(read(relativePath));

export const manifest = readJson("data/manifest.json");

// 誤答候補は全セットから探すため、毎回読み直さず一度だけ読む。
let allWordsCache = null;
export function allWords() {
  if (!allWordsCache) {
    allWordsCache = Object.values(manifest.sets).flatMap(({ dataUrl }) => readJson(dataUrl).words);
  }
  return allWordsCache;
}

// 意味の字面が同じ語は選択肢に並べても四択にならないため、候補から外してから数える。
export function hasThreeSafeCandidates(target, pool = allWords()) {
  const distinct = pool.filter((candidate) =>
    guard.meaningText(candidate) !== guard.meaningText(target) || candidate.id === target.id);
  return guard.hasThreeMutuallySafe(target, distinct).ok;
}
