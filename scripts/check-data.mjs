import fs from "node:fs";

// 現代文キーワードの語データ（data/set-*.json）の形式検査。
// 通過しても壊れうる失敗（語義の当否、例文の文体、対義語の妥当性）は
// docs/AUTHORING_STANDARD.md の「人手で守ること」で担保する。

const manifest = JSON.parse(fs.readFileSync(new URL("../data/manifest.json", import.meta.url)));
if (!manifest.sets?.[manifest.defaultSetId]) throw new Error("defaultSetId is not registered");

const clozeBlank = "（　）";
const idPattern = /^gk\d{2}-\d{3}$/;
const idsAcrossSets = new Set();

const countNonOverlappingOccurrences = (text, needle) => {
  if (!needle) return 0;
  let count = 0;
  let offset = 0;
  while (true) {
    const index = text.indexOf(needle, offset);
    if (index < 0) return count;
    count++;
    offset = index + needle.length;
  }
};

const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
const isStringArray = (value) => Array.isArray(value) && value.every((item) => typeof item === "string" && item.trim().length > 0);

for (const [setId, entry] of Object.entries(manifest.sets)) {
  const data = JSON.parse(fs.readFileSync(new URL(`../${entry.dataUrl}`, import.meta.url)));
  if (data.meta.id !== setId) throw new Error(`${setId}: meta.id mismatch`);
  if (data.meta.count !== data.words.length) throw new Error(`${setId}: count mismatch`);
  if (!Number.isInteger(data.meta.dataVersion) || data.meta.dataVersion < 1) throw new Error(`${setId}: invalid dataVersion`);

  const ids = new Set();
  data.words.forEach((word, position) => {
    const where = `${setId}: ${word.id || `#${position + 1}`}`;

    if (!idPattern.test(word.id || "")) throw new Error(`${where} id must match gkNN-XXX`);
    if (ids.has(word.id)) throw new Error(`${setId}: duplicate id ${word.id}`);
    ids.add(word.id);
    if (idsAcrossSets.has(word.id)) throw new Error(`cross-set duplicate id ${word.id}`);
    idsAcrossSets.add(word.id);

    if (!Number.isInteger(word.keyNo) || word.keyNo < 1) throw new Error(`${where} keyNo must be a positive integer`);
    if (!isNonEmptyString(word.headword)) throw new Error(`${where} missing headword`);
    if (!isNonEmptyString(word.reading)) throw new Error(`${where} missing reading`);
    if (!/^[ぁ-ゖー]+$/u.test(word.reading)) throw new Error(`${where} reading must be hiragana`);
    if (word.alias !== undefined && !isNonEmptyString(word.alias)) throw new Error(`${where} alias must be a non-empty string when present`);
    if (!Number.isInteger(word.level) || word.level < 1 || word.level > 5) throw new Error(`${where} level must be 1-5`);

    if (!Array.isArray(word.meanings) || word.meanings.length < 1 || !isStringArray(word.meanings)) throw new Error(`${where} meanings must be a non-empty string array`);
    if (word.meanings.length !== 1) throw new Error(`${where} meanings must hold exactly one sentence (AUTHORING_STANDARD §3)`);
    if (!Array.isArray(word.notes) || word.notes.length < 1 || !isStringArray(word.notes)) throw new Error(`${where} notes must be a non-empty string array`);

    if (!Array.isArray(word.antonyms) || !word.antonyms.every((item) => isNonEmptyString(item))) throw new Error(`${where} antonyms must be a string array`);
    if (!Array.isArray(word.related) || !word.related.every((item) => isNonEmptyString(item))) throw new Error(`${where} related must be a string array`);

    if (!isNonEmptyString(word.example)) throw new Error(`${where} missing example`);
    if (!isNonEmptyString(word.cloze)) throw new Error(`${where} missing cloze`);
    if (word.source !== "作例") throw new Error(`${where} source must be "作例" (examples are original, never quoted)`);

    if ((word.cloze.match(/（　）/g) ?? []).length !== 1) throw new Error(`${where} cloze must have exactly one blank`);
    const blankIndex = word.cloze.indexOf(clozeBlank);
    const prefix = word.cloze.slice(0, blankIndex);
    const suffix = word.cloze.slice(blankIndex + clozeBlank.length);
    if (!word.example.startsWith(prefix) || !word.example.endsWith(suffix) || prefix.length + suffix.length >= word.example.length) {
      throw new Error(`${where} cloze must replace one contiguous span of example`);
    }
    const removed = word.example.slice(prefix.length, word.example.length - suffix.length);
    if (removed.length >= 2 && countNonOverlappingOccurrences(word.example, removed) >= 2) {
      throw new Error(`${where} cloze answer is exposed elsewhere in example`);
    }
    if (word.headword !== removed) throw new Error(`${where} cloze blank must cover the headword exactly (removed: ${removed})`);
    if (countNonOverlappingOccurrences(word.example, word.headword) !== 1) throw new Error(`${where} headword must appear exactly once in example`);
  });

  const keyNos = data.words.map((word) => word.keyNo);
  const sorted = [...keyNos].sort((a, b) => a - b);
  if (keyNos.some((value, index) => value !== sorted[index])) throw new Error(`${setId}: keyNo values must be in ascending order`);

  console.log(`OK: ${setId} / ${data.words.length}語`);
}
