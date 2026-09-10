// 解答時間の計測と表示の契約。
//
// 解答の速さで復習間隔の伸び方が変わるため、何が測られたかを解答直後に見せる。
const assert = require("node:assert/strict");
const fs = require("node:fs");

const js = fs.readFileSync("static/mode-vocab.js", "utf8").replace(/\r\n/g, "\n");

// --- 計測 ---
assert.match(
  js,
  /if \(!session\.answered && isNewEntry\) \{\n\s*session\.askedAt = Date\.now\(\);/,
  "解答時間の起点は、新しい問題が未回答で表示された瞬間である必要がある",
);
assert.match(js, /session\.lastElapsedMs = null;/, "新しい問題では前の計測値を持ち越さない必要がある");
assert.match(
  js,
  /GendaibunSrs\.measuredMs\(Date\.now\(\) - \(session\.askedAt \|\| 0\)\)/,
  "計測値は measuredMs を通し、中断・再開で伸びた値を捨てる必要がある",
);
assert.match(
  js,
  /medianMs: GendaibunSrs\.medianMs\(session\.rtLog \|\| \[\]\)/,
  "Hard判定の基準はその回の中央値である必要がある",
);
assert.match(
  js,
  /if \(isCorrect && elapsedMs !== null\) \(session\.rtLog \|\| \(session\.rtLog = \[\]\)\)\.push\(elapsedMs\);/,
  "中央値の標本は正解した回の計測値だけを積む必要がある",
);

// --- 表示 ---
assert.match(js, /function responseTimeNote\(\)/, "解答時間の表示関数が必要");
assert.match(js, /session\.mode !== "meaningReview"/, "解答時間の表示は意味だけ復習に限定する必要がある");
assert.match(js, /出題から \$\{\(elapsed \/ 1000\)\.toFixed\(1\)\} 秒で解答/, "解答時間を秒で表示する必要がある");
assert.match(js, /前回までの平均 \$\{\(average \/ 1000\)\.toFixed\(1\)\} 秒/, "前回までの平均を併記する必要がある");
assert.match(
  js,
  /session\.prevAvgMs = GendaibunSrs\.normalize\(progress\.items\[wordId\]\)\.avgMs;/,
  "平均は record が更新する前の値を控える必要がある（今回の値を混ぜない）",
);
assert.ok(js.includes("responseTimeNote()"), "フィードバックへ解答時間の表示を差し込む必要がある");

console.log("OK: 解答時間の計測と表示");
