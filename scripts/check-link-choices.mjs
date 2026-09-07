import fs from "node:fs";

// STEP 4「つながり」の四択が全語で成立するかを検査する。
// 実装（static/mode-vocab.js の linkTarget / linkChoiceSet）と同じ規則で確かめる。
//   - 正解は antonyms[0]、無ければ related[0]
//   - 誤答は同セットの見出し語と、他語の対義語・関連語から3つ
//   - 正解がセット外の語なら、誤答にもセット外の語を1つ以上混ぜられること
//     （混ぜられないと「セットに無い語」を選ぶだけで当たってしまう）

const manifest = JSON.parse(fs.readFileSync(new URL("../data/manifest.json", import.meta.url)));

let failures = 0;
for (const [setId, entry] of Object.entries(manifest.sets)) {
  const { words } = JSON.parse(fs.readFileSync(new URL(`../${entry.dataUrl}`, import.meta.url)));
  const headwords = new Set(words.map((word) => word.headword));
  const bad = [];
  for (const word of words) {
    const answer = (Array.isArray(word.antonyms) && word.antonyms.find(Boolean))
      || (Array.isArray(word.related) && word.related.find(Boolean))
      || null;
    if (!answer) { bad.push(`${word.id} ${word.headword}: 対義語も関連語も無い`); continue; }

    const excluded = new Set([word.headword, answer, ...(word.antonyms || []), ...(word.related || [])]);
    const pool = [];
    for (const other of words) {
      const values = other.id === word.id ? [] : [other.headword];
      values.push(...(other.antonyms || []), ...(other.related || []));
      for (const value of values) {
        if (!excluded.has(value) && !pool.includes(value)) pool.push(value);
      }
    }
    if (pool.length < 3) {
      bad.push(`${word.id} ${word.headword}: 誤答候補が${pool.length}語しかない`);
    }
    if (pool.includes(answer)) {
      bad.push(`${word.id} ${word.headword}: 誤答候補に正解「${answer}」が混ざる`);
    }
    if (!headwords.has(answer) && !pool.some((value) => !headwords.has(value))) {
      bad.push(`${word.id} ${word.headword}: 正解「${answer}」がセット外なのに、セット外の誤答候補が無い`);
    }
  }
  failures += bad.length;
  console.log(`${bad.length ? `NG ${bad.length}語` : "OK"}: ${setId} / ${words.length}語`);
  for (const line of bad) console.log(`    ${line}`);
}

if (failures) process.exit(1);
