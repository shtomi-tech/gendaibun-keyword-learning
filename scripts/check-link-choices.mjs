import fs from "node:fs";

// STEP 4「つながり」の四択が全語で成立するかを検査する。
// 実装（static/mode-vocab.js の linkTarget / linkChoiceSet）と同じ規則で確かめる。
//   - 正解は antonyms[0]、無ければ related[0]
//   - 誤答は同セット内の他語の見出し語から、正解と重複しない3つ

const manifest = JSON.parse(fs.readFileSync(new URL("../data/manifest.json", import.meta.url)));

let failures = 0;
for (const [setId, entry] of Object.entries(manifest.sets)) {
  const { words } = JSON.parse(fs.readFileSync(new URL(`../${entry.dataUrl}`, import.meta.url)));
  const bad = [];
  for (const word of words) {
    const answer = (Array.isArray(word.antonyms) && word.antonyms.find(Boolean))
      || (Array.isArray(word.related) && word.related.find(Boolean))
      || null;
    if (!answer) { bad.push(`${word.id} ${word.headword}: 対義語も関連語も無い`); continue; }

    const distractors = words
      .filter((other) => other.id !== word.id && other.headword !== answer)
      .map((other) => other.headword)
      .filter((value, index, values) => values.indexOf(value) === index);
    if (distractors.length < 3) {
      bad.push(`${word.id} ${word.headword}: 誤答候補が${distractors.length}語しかない`);
    }
    if (distractors.includes(answer)) {
      bad.push(`${word.id} ${word.headword}: 誤答候補に正解「${answer}」が混ざる`);
    }
  }
  failures += bad.length;
  console.log(`${bad.length ? `NG ${bad.length}語` : "OK"}: ${setId} / ${words.length}語`);
  for (const line of bad) console.log(`    ${line}`);
}

if (failures) process.exit(1);
