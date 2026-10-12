import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

// 実際のCLIを独立した作業領域で実行し、不正データの終了コードも検査する。
const root = new URL("../", import.meta.url);
const original = JSON.parse(fs.readFileSync(new URL("data/set-08.json", root), "utf8"));
const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "gendaibun-data-contract-"));
try {
  fs.mkdirSync(path.join(sandbox, "scripts"));
  fs.mkdirSync(path.join(sandbox, "data"));
  fs.copyFileSync(new URL("scripts/check-data.mjs", root), path.join(sandbox, "scripts/check-data.mjs"));
  const run = (mutate = () => {}, setId = "gk-set-08") => {
    const data = structuredClone(original);
    mutate(data);
    fs.writeFileSync(path.join(sandbox, "data/set-08.json"), JSON.stringify(data));
    fs.writeFileSync(path.join(sandbox, "data/manifest.json"), JSON.stringify({
      defaultSetId: setId,
      sets: { [setId]: { dataUrl: "data/set-08.json" } },
    }));
    return spawnSync(process.execPath, [path.join(sandbox, "scripts/check-data.mjs")], { encoding: "utf8" });
  };
  assert.equal(run().status, 0, "valid set with a kanji alias must pass");
  const cases = [
    ["9 words even when count agrees", (data) => { data.words.pop(); data.meta.count = 9; }, /exactly 10 words/],
    ["11 words even when count agrees", (data) => { data.words.push(structuredClone(data.words[0])); data.meta.count = 11; }, /exactly 10 words/],
    ["wrong id set number", (data) => { data.words[0].id = "gk09-071"; }, /id set number/],
    ["wrong id keyword number", (data) => { data.words[0].id = "gk08-070"; }, /id keyword number/],
    ["missing number", (data) => { data.words[0].keyNo = 72; data.words[0].id = "gk08-072"; }, /keyNo must be 71/],
    ["duplicate number with distinct id", (data) => { data.words[1].keyNo = 71; }, /id keyword number/],
    ["duplicate number and id", (data) => { data.words[1].keyNo = 71; data.words[1].id = "gk08-071"; }, /duplicate id/],
    ["outside range", (data) => { data.words[9].keyNo = 81; data.words[9].id = "gk08-081"; }, /keyNo must be 80/],
    ["wrong order", (data) => { [data.words[0], data.words[1]] = [data.words[1], data.words[0]]; }, /keyNo must be 71/],
    ["empty alias", (data) => { data.words[0].alias = ""; }, /alias must be a non-empty string/],
  ];
  for (const [label, mutate, message] of cases) {
    const result = run(mutate);
    assert.equal(result.status, 1, `${label}: must fail`);
    assert.match(result.stderr, message, `${label}: must fail for the intended reason`);
  }
  const invalidSet = run((data) => { data.meta.id = "gk-set-00"; }, "gk-set-00");
  assert.equal(invalidSet.status, 1);
  assert.match(invalidSet.stderr, /invalid set id/);
  console.log(`OK: data CLI contract / valid set + ${cases.length + 1} invalid cases`);
} finally {
  fs.rmSync(sandbox, { recursive: true, force: true });
}
