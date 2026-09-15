# 現代文キーワード 学習アプリ 実装計画（第1版・第1セットまで）

作成日: 2026-09-07
対象: `C:\Users\shtom\dev\gendaibun-keyword-learning`
ベース: `C:\Users\shtom\dev\kobun-vocab-learning`（コミット時点のmain）

この計画は、設計ラウンド1〜3で確定した仕様（本書「確定仕様」節）だけを根拠とする。
対象コードを知らない実装者が、上から順に着手できる粒度で書いてある。

---

## 確定仕様

| 項目 | 決定 |
| --- | --- |
| アプリ名 | 現代文キーワード 学習アプリ |
| フォルダ／リポジトリ | `gendaibun-keyword-learning` |
| localStorage接頭辞 | `gendaibun_keyword_*` |
| 収録予定 | 210語 ÷ 10語 = 21セット（本計画は第1セットのみ） |
| 第1セット | 書籍番号1〜10（普遍・特殊・具体・抽象・秩序・混沌・必然・偶然・対象・権威） |
| ブロック | 5語 × 2ブロック |
| 学習ステップ | STEP 1 覚える → STEP 2 確かめる → 誤答確認 → STEP 3 文中で解く → **STEP 4 つながり** → 最終チェック |
| STEP 4 | 「〈語〉と対になる語は？」の4択。対義語がない語は関連語で出題し、全10語をカバー |
| 誤答選択肢 | 同セット内の他9語から自動生成（手書き誤答は持たない） |
| 例文 | 私（実装者）が書く評論調の作例。`source` は `"作例"` 固定 |
| 著作権 | 書籍本文は転記しない。スキャンPDFはリポジトリに入れない |
| 引き継ぐ機能 | SRS（意味だけ復習）・学習目標カード・誤答確認・最終チェック80%・セット別状態・履歴500件 |
| 配色 | 地 `#f2f3f6` ／ 主色 紺 `#26397a` ／ 強調 朱 `#a8392c` |
| 見出しフォント | Shippori Mincho（本文は既存のsans継承） |
| クラウド同期 | 第1版では入れない（localStorageのみ） |

### 本計画の範囲外

- `git init`・リモートリポジトリ作成・push・GitHub Pages公開（別途の明示指示を待つ）
- 第2セット以降のデータ作成
- Supabaseクラウド同期（`static/cloud.js` の有効化）
- portalへの登録

> 追記（2026-09-08）: 上記の範囲外項目は本計画の完了後にすべて実施済み。git/Pages公開・第2〜5セット・portal登録に加え、生徒別クラウド同期を有効化した（詳細は `README.md` / `AGENTS.md`）。現在の範囲外は第6セット以降のデータ作成のみ。
>
> 追記（2026-09-15）: 本計画で実装した STEP 4「つながり」は削除済み。現在の学習フローは STEP 3 文中問題の後に最終チェックへ進む。以下の T5 などの記述は当初計画の履歴として残す。

---

## タスク

### T1 リポジトリ雛形の作成 `IMPLEMENT`

**対象**: 新規 `gendaibun-keyword-learning/` 全体

**内容**
1. `kobun-vocab-learning` から次を除いてコピーする。
   - 除外: `.git/`, `.hermes/`, `graft/`, `data/set-*.json`, `docs/`, `static/config.json`, `scripts/` のうち古文固有のもの（`apply-waka.mjs`, `ndl.mjs`, `check-waka-*.mjs`, `check-set-NN.mjs`, `fix-example-quality*.mjs`, `mark-prose.mjs`, `replace-generated-examples.mjs`）
   - 残す: `index.html`, `static/*.js`, `static/styles.css`, `static/favicon.svg`, `.github/workflows/pages.yml`, `.gitignore`, `.nojekyll`, `scripts/write-config.mjs`, `scripts/check-data.mjs`, `scripts/check-set-choices.mjs`, `scripts/check-context-choices.mjs`, `scripts/check-set-progress.cjs`, `scripts/check-srs.cjs`, `scripts/check-study-plan.cjs`, `scripts/lib/`
2. `data/manifest.json` を第1セットのみの内容に置き換える。
3. `.gitignore` に `*.pdf` と `scan/` を追加する（著作物の混入防止）。

**検証**: `ls -R` で上記の除外・残存が意図どおりか目視。
**受入基準**: 古文セットのJSONとwaka関連スクリプトが1つも存在しない。

---

### T2 名前空間・定数の置換 `IMPLEMENT` （依存: T1）

**対象**: `static/mode-vocab.js`, `static/set-progress.js`, `static/srs.js`, `static/meaning-guard.js`, `static/example-source.js`, `static/app.js`, `index.html`

**内容**

| 現行 | 変更後 | 位置 |
| --- | --- | --- |
| `KobunVocabApp` | `GendaibunKeywordApp` | `mode-vocab.js:3` ほか |
| `KobunSetProgress` | `GendaibunSetProgress` | `set-progress.js:3` |
| `KobunMeaningGuard` | `GendaibunMeaningGuard` | `meaning-guard.js:6` |
| `KobunExampleSource` | （T4で削除） | `example-source.js` |
| `kobun_vocab_dataset` | `gendaibun_keyword_dataset` | `mode-vocab.js:10` |
| `kobun_vocab_progress_` | `gendaibun_keyword_progress_` | `mode-vocab.js:11` |
| `kobun_vocab_study_plan_v1` | `gendaibun_keyword_study_plan_v1` | `mode-vocab.js:20` |
| `APP_ID = "kobun-vocab-learning"` | `"gendaibun-keyword-learning"` | `mode-vocab.js:16` |
| `BATCH_SIZE = 4` | `5` | `mode-vocab.js:13` |
| `VOCAB_GOAL_TOTAL = 600` | `210` | `mode-vocab.js:18` |
| `STUDY_PLAN_DEFAULT_DAILY = 12` | `10`（1セット） | `mode-vocab.js:22` |

`PASS_RATE = 0.8`、`MEANING_SESSION_SIZE = 20`、`HISTORY_LIMIT = 500` は据え置く。

**検証**: `grep -ri "kobun" .` の結果が0件（`docs/` を除く）。ブラウザでホーム画面が読み込めること。
**受入基準**: 古文版のlocalStorageキーを一切読み書きしない。ホームに「全10語を5語ずつ2ブロックで進める」と表示される。

---

### T3 データスキーマの確定と第1セット執筆 `IMPLEMENT` （依存: T1）

**対象**: 新規 `data/set-01.json`, `data/manifest.json`, 新規 `docs/AUTHORING_STANDARD.md`

**内容**
1. 1語あたり次のフィールドを持つ。

```json
{
  "id": "gk01-005",
  "keyNo": 5,
  "headword": "秩序",
  "reading": "ちつじょ",
  "alias": "コスモス",
  "level": 3,
  "meanings": ["整然とまとまっている状態。"],
  "notes": ["…", "…"],
  "antonyms": ["混沌"],
  "related": ["分節"],
  "example": "人間は言語によって世界を秩序あるものとしてとらえてきた。",
  "cloze": "人間は言語によって世界を（　）あるものとしてとらえてきた。",
  "source": "作例"
}
```

2. `meta` は `{ "id": "gk-set-01", "title": "第1セット　普遍と特殊・具体と抽象", "count": 10, "dataVersion": 1 }`。
3. 執筆規約（`docs/AUTHORING_STANDARD.md`）を先に書き、それに従って10語を書く。
   - `meanings` は原則1文。書籍の定義文を写さず、同じ概念を自分の語で書く。
   - `notes` は2つ。1つ目は語の中核、2つ目は評論文での使われ方。
   - `example` は40〜70字の評論調1文。見出し語をそのままの表記で1回だけ含む。
   - `cloze` は `example` の見出し語部分を `（　）` に置換した文字列（`mode-vocab.js:80 exampleTargetPart` が前後一致で位置を求めるため、それ以外の差異があってはならない）。
   - `antonyms` は書籍の「反」、`related` は「関」に対応。第1セットでは 対象→`related:["主体"]`（「具象・具現」は書籍では「具体」の関連語。計画初版の誤りを2026-09-07に訂正）、権威→`related:["権力"]`。
4. 例文中の見出し語は、活用や送り仮名で表記が変わらない語だけを選ぶ（現代文キーワードは名詞中心のため原則問題にならない）。

**検証**: `node scripts/check-data.mjs`（T8で改修後）。
**受入基準**: 10語すべてが上記フィールドを持ち、`cloze` から `example` が復元できる。`source` が全語 `"作例"`。

---

### T4 古文固有ロジックの除去 `IMPLEMENT` （依存: T2）

**対象**: `static/mode-vocab.js`, `static/meaning-guard.js`, `static/example-source.js`

**内容**
1. **和歌関連の削除**: `isWaka`（`mode-vocab.js:69`）、`wakaRefText`、`wakaBlankPart`、`exampleClass` の `--waka` 分岐、`exampleForm` 判定を削除。`example` は常に散文として扱う。
2. **現代語訳の削除**: `word.translation` を参照する箇所（`mode-vocab.js:1168` の `現代語訳：${word.translation}` など）を削除。STEP 3の手掛かりは、古文版の「現代語訳」ではなく**空欄を含む例文そのもの**とする。
3. **音数フィルタの削除**: `contextMoraCount`（`:77`）と、それを使う誤答絞り込み（`:437`）を削除。現代文キーワードは字数が手掛かりにならない。
4. **`example-source.js` の削除**: 出典優先度（attached/waka/prose/generated）は作例のみの本アプリでは無意味。`index.html` の読み込みも外す。`applyExampleSourcePriority`（`mode-vocab.js:157`）の呼び出しも削除。
5. **`meaning-guard.js` の同義語群の入れ替え**: 古語の意味族（死・出家・和歌など）を全削除し、現代文キーワード用に書き直す。第1セットで必要な族は最低限、次の4つ。
   - `/普遍|一般|例外なく/`
   - `/具体|具象|具現|現実に即/`
   - `/秩序|整然|まとまって/`
   - `/必然|法則|因果/`
   同族の語義を1問の選択肢に2つ以上出さないという既存の判定ロジック自体は変更しない。

**検証**: `grep -n "waka\|translation\|Mora" static/*.js` が0件。ブラウザでSTEP 1〜3を通し、コンソールエラーが出ないこと。
**受入基準**: 「秩序」のSTEP 2で、選択肢に「整然とまとまっている状態」と「物事がバラバラな状態」以外の同義重複が出ない。

---

### T5 STEP 4「つながり」の実装 `IMPLEMENT` （依存: T3, T4）

**対象**: `static/mode-vocab.js`, `static/styles.css`, `static/set-progress.js`

**内容**
1. `session.stage` に `"link"` を追加する。学習セッションのステップ配列（`mode-vocab.js:1073`）を
   `["flash", "meaning", "wrongReview", "context"]` → `["flash", "meaning", "wrongReview", "context", "link"]` にし、
   ラベル（`:1077`）へ `link: "4 つながり"` を足す。
2. 出題データ: 各語の `antonyms[0]` があればそれ、なければ `related[0]` を正解とする。どちらも空の語は出題対象から外す（第1セットでは全語が該当するため0語）。
3. 設問文: 対義語なら「〈普遍〉と**対になる**語は？」、関連語なら「〈対象〉と**関わりの深い**語は？」。データのどちらを使ったかで文言を切り替える。
4. 誤答: 同セット内の他語の `headword` から3つ。正解語がセット内にない場合（権威→権力など）も、誤答はセット内から採る。
5. 進捗: `units[wordId].link = true/false` を追加し、`set-progress.js` の `summarize` に反映する。既存の `learned` / `context` 判定は変えない。`dataVersion` は1のままでよい（新規アプリのため移行対象データがない）。
6. STEP 4の正誤は最終チェックの合否には算入しない（最終チェックは既存どおり意味選択10問）。

**検証**: ブラウザで第1セットを通し、STEP 3の後にSTEP 4が10問出ること。ステップバーが5段になること。リロードして途中再開できること。
**受入基準**: 全10語が1問ずつ出題される。「対象」「権威」で設問文が「関わりの深い語は？」になる。

---

### T6 配色・タイポグラフィの差し替え `IMPLEMENT` （依存: T2）

**対象**: `static/styles.css`, `index.html`, 新規 `DESIGN.md`

**内容**
1. `styles.css:3-14` のトークンを差し替える。レイアウト・余白・角丸のトークン（`:34-49`）は変更しない。

| トークン | 現行（古文版） | 変更後 |
| --- | --- | --- |
| `--color-canvas` | `#faf9f5` | `#f2f3f6` |
| `--color-surface-primary` | `#efe9de` | `#e6e9f0` |
| `--color-surface-subtle` | `#f5f0e8` | `#eceef4` |
| `--color-ink-primary` | `#141413` | `#191d26` |
| `--color-ink-secondary` | `#615c54` | `#5b6272` |
| `--color-border` | `#e6dfd8` | `#d2d6de` |
| `--color-control-border` | `#8a8478` | `#b5bbc7` |
| `--color-accent` | `#a9583e` | `#26397a` |
| `--color-accent-strong` | `#8a4732` | `#1b2a5e` |

`--color-success` / `--color-danger` / `--color-warn` は役割色なので変更しない。朱 `#a8392c` は新規トークン `--color-highlight` として追加し、STEP 4の設問見出しと「要復習」バッジにのみ使う（正誤表示には使わない。`--color-danger` と混同されるため）。

2. `--serif` を `"Shippori Mincho", "Yu Mincho", serif` に変更し、`index.html` のGoogle Fontsリンクを `Cormorant+Garamond` から `Shippori+Mincho:wght@500;700` に差し替える。`--sans` と `--mono` は据え置く。
3. `index.html` の `theme-color` を `#f2f3f6` に変更する。
4. `DESIGN.md` を新規作成し、古文版からの差分（上表・フォント・朱の使いどころ）だけを記録する。古文版の全文はコピーせず、「レイアウト・余白・コンポーネント規約は kobun-vocab-learning の DESIGN.md に準拠する」と明記して参照する。

**検証**: ブラウザで主要4画面（ホーム／暗記カード／4択／結果）を表示し、文字色と背景のコントラストが崩れていないこと。
**受入基準**: 古文版と並べて一目で区別できる。正誤の緑・赤が主色の紺と競合しない。

---

### T7 文言とメタ情報の書き換え `IMPLEMENT` （依存: T2, T5）

**対象**: `index.html`, 新規 `README.md`, 新規 `AGENTS.md`

**内容**
1. `index.html`: `<title>`「現代文キーワード 学習アプリ」、`meta description`「現代文の重要キーワード210語を『覚える → 確かめる → 文中で解く → つながりを押さえる』の順に学べる無料アプリ。」、`.backlink` を `Gendaibun ・ Modern Japanese Keywords`、`h1` を「現代文キーワード 学習アプリ」に。
2. `README.md`: 起動コマンド（ポートは `8063` を使い、古文版の `8062` と衝突させない）、学習フロー、データ仕様、範囲外事項を書く。
3. `AGENTS.md`: 古文版のものをベースに、和歌・典拠台帳・NDL照合の節を削除し、「例文は作例であり原典を引用しない」「書籍のスキャンをリポジトリに置かない」を明記する。

**検証**: `grep -ri "古文\|kobun" index.html README.md AGENTS.md` が意図した参照（古文版DESIGN.mdへの参照のみ）以外0件。
**受入基準**: 画面上に古文アプリ由来の文言が残っていない。

---

### T8 検証スクリプトの改修 `IMPLEMENT` （依存: T3, T4, T5）

**対象**: `scripts/check-data.mjs`, `scripts/check-set-choices.mjs`, `scripts/check-context-choices.mjs`, 新規 `scripts/check-link-choices.mjs`

**内容**
1. `check-data.mjs`: 必須フィールドをT3のスキーマに合わせる。`translation`・`exampleForm`・`waka` の検査を削除し、`keyNo`・`reading`・`level`・`antonyms`・`related`・`source === "作例"` の検査を追加。`cloze` から `example` が復元できることを検査する。
2. `check-set-choices.mjs` / `check-context-choices.mjs`: 意味族の参照先を新しい `meaning-guard.js` に合わせる。和歌・音数に関する検査を削除。
3. `check-link-choices.mjs`（新規）: 全語が `antonyms[0]` か `related[0]` を持つこと、STEP 4の誤答3つが正解と重複しないことを検査する。

**検証**: `node scripts/check-data.mjs && node scripts/check-set-choices.mjs && node scripts/check-context-choices.mjs && node scripts/check-link-choices.mjs` が全て成功で終わる。
**受入基準**: 4スクリプトが第1セットに対して0エラー。

---

### T9 通し確認 `VERIFY_ONLY` （依存: T1〜T8）

**対象**: 実ブラウザ

**内容**
1. `py -3 -m http.server 8063 --bind 127.0.0.1` で起動し、`http://127.0.0.1:8063/` を開く。
2. 第1セットを最初から最後まで通す（STEP 1→2→誤答確認→3→4→最終チェック）。
3. 途中でリロードし、再開位置が保たれることを確認する。
4. コンソールエラー0件、主要操作領域44px以上、キーボード操作のみで1セット完走できることを確認する。
5. 幅375px（スマホ）と1280px（PC）で表示崩れがないことを確認する。

**受入基準**: 上記5項目すべてが確認済み。未確認の項目は理由とともに報告する。

---

## 依存順

```
T1 ──┬─ T2 ──┬─ T4 ──┬─ T5 ──┬─ T8 ── T9
     │       ├─ T6 ──┤       │
     │       └─ T7 ──┘       │
     └─ T3 ───────────────────┘
```

T3（データ執筆）はT2以降のコード改修と独立して進められる。T5はT3の `antonyms` / `related` を前提とする。

---

## 未確定として残す事項

- `meanings` を1文に収めきれない語（多義のキーワード）が第2セット以降に出た場合の扱い。第1セット10語では発生しない見込み。
- 210語のうち `antonyms` も `related` も持たない語が出た場合のSTEP 4の扱い。第1セットでは0語のため、実際に発生した時点で判断する（T5の実装では「出題対象から外す」を既定とする）。
- 第1セットの語義・例文は執筆後にユーザーの検収を受ける。文体・粒度の指摘が入った場合、`docs/AUTHORING_STANDARD.md` を先に更新してから全10語へ反映する。
