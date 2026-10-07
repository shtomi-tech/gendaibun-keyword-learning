# 現代文キーワード 学習アプリ

現代文（評論）の重要キーワードを「覚える → 確かめる → 文中で解く」の順に学ぶ静的Webアプリです。`kobun-vocab-learning` を土台に、データ構造・出題ステップ・外装を現代文キーワード向けに差し替えています。

収録目標は210語（10語 × 21セット）。このリポジトリの現状は**第1〜7セット（書籍番号1〜70）**です。

公開版: https://gendaibun-keyword-learning.shtomi0913.workers.dev/ （Cloudflare Workers）

旧公開版 https://shtomi-tech.github.io/gendaibun-keyword-learning/ も、配布済みリンクのため当面は同じ内容で並行公開しています（[公開](#公開)）。

## 起動

```powershell
cd C:\Users\shtom\dev\gendaibun-keyword-learning
py -3 -m http.server 8063 --bind 127.0.0.1
```

`http://127.0.0.1:8063/` を開きます。JSONを読み込むため、`index.html` の直接表示は使いません。ポート `8063` は `kobun-vocab-learning`（`8062`）と衝突させないための値です。

## 学習フロー（1セット10語）

1. **STEP 1 覚える** — 5語の暗記カードを読む（見出し語・読み・意味・解説・対義語/関連語・例文）
2. **STEP 2 確かめる** — その5語について、例文中の語の意味を4択で選ぶ
3. 1〜2を2ブロック（5語 × 2）行う
4. **誤答確認** — STEP 2で誤答した語をカードで読み直す
5. **STEP 3 文中で解く** — 空欄を含む評論文の一文に入るキーワードを4択で選ぶ（全10語）
6. **セット完了** — 全10語の文中問題に正解するとCLEAR。誤答があれば、復習後にCLEAR

進捗と途中位置はブラウザの `localStorage`（キー接頭辞 `gendaibun_keyword_*`）に保存します。ポータルの配布シートで発行した生徒専用URL（`?s=<生徒ID>&t=<トークン>`）で開くと、進捗を共通Supabaseにクラウド保存し、別端末でも同じ生徒として再開できます（[生徒別クラウド同期](#生徒別クラウド同期)）。

## 補助学習（`kobun-vocab-learning` から継承）

- 文中問題まで解いた語を対象に「意味だけ復習」（1回最大20語）。次にいつ出すかは **FSRS-6**（[ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) を同梱）が語ごとに計算します。固定の日数表ではなく、その語の記録から「約9割思い出せるうちに出す」日を決めます。間隔の上限は180日です。
- 解答にかかった時間も見ます。速い正解は間隔を大きく伸ばし、時間のかかった正解は伸びを抑え、間違えた語は当日中（約10分後）に戻ってきます（8秒未満は常に速い・20秒以上は常に遅い・その間はその回の中央値の1.6倍を境に判定。中断などで60秒を超えた計測は捨てます）。解答直後に「出題から○秒で解答（前回までの平均△秒）」を表示します。ホームの内訳は「未実施／要再確認／3日以内／1週間／2週間／1か月／3か月／半年以上」の8つです。
- 学習目標カード（今日 n / m語）と到達予想（210語ペース）。
- セット別状態表示、履歴500件、途中保存からの再開。

## データ

- `data/manifest.json`: セット一覧
- `data/set-01.json`: 第1セット「普遍と特殊・具体と抽象」10語（書籍番号1〜10）
- `data/set-02.json`: 第2セット「権力・合理・懐疑」10語（書籍番号11〜20）
- `data/set-03.json`: 第3セット「概念と理念・絶対と相対」10語（書籍番号21〜30）
- `data/set-04.json`: 第4セット「多元・自律と他律」10語（書籍番号31〜40）
- `data/set-05.json`: 第5セット「科学とテクノロジー」10語（書籍番号41〜50）
- `data/set-06.json`: 第6セット「科学・表現・文脈」10語（書籍番号51〜60）
- `data/set-07.json`: 第7セット「記号・表象・言語」10語（書籍番号61〜70）

1語あたりのフィールド:

| フィールド | 内容 |
| --- | --- |
| `id` | `gkNN-XXX`（全セットで一意） |
| `keyNo` | 書籍のキーワード番号 |
| `headword` / `reading` / `alias?` | 見出し語（漢字表記）／読み（ひらがな）／カタカナ別称（任意） |
| `level` | 難易度 1〜5 |
| `meanings` | 語義（1文） |
| `notes` | 解説・補足（1件以上） |
| `antonyms` / `related` | 対義語（書籍の「反」）／関連語（書籍の「関」） |
| `example` / `cloze` | 評論調の作例1文／見出し語を `（　）` に置換した文字列 |
| `source` | 常に `"作例"`。例文は書き下ろしで、原典を引用しない |

**書籍本文は転記しません。スキャンPDFはリポジトリに入れません**（`.gitignore` に `*.pdf` / `scan/` を登録）。作成基準は [docs/AUTHORING_STANDARD.md](docs/AUTHORING_STANDARD.md)、UIの差分は [DESIGN.md](DESIGN.md) を正本とします。

## 生徒別クラウド同期

`kobun-vocab-learning` と同じ共通契約（`portal/student_progress_contract.md`）で動きます。

- 生徒登録は共通テーブル `app_students` に1回だけ。ポータルの配布シートの「生徒を管理」から発行するSQLをSupabaseで実行する。
- このアプリの進捗は `app_progress` の `app = gendaibun-keyword-learning` に保存され、他アプリとは混ざらない。
- 公開版の `static/config.json` は GitHub Actions の `SUPABASE_URL` / `SUPABASE_ANON_KEY`（**anon キーのみ。`service_role` は配布しない**）から `scripts/write-config.mjs` が生成する。シークレット未設定なら `config.json` は空になり、匿名ローカル保存へ自動フォールバックする。
- `?s=` / `?t=` の無い通常アクセスでは、これまでどおり `localStorage` のみで動く。

## 公開

main へ push すると `.github/workflows/pages.yml` が検査 → `_site/` 作成 → Cloudflare Workers と GitHub Pages の両方へデプロイします。

- Cloudflare は Worker スクリプトなしの静的アセット配信です（`wrangler.jsonc`、`assets.directory = ./_site`）。
- 必要な Actions シークレット: `CLOUDFLARE_API_TOKEN`（Workers Scripts の編集権限）と `CLOUDFLARE_ACCOUNT_ID`。portal の `student-ledger` と同じ値でよい。未設定のときは Cloudflare のデプロイだけ警告を出して飛ばします。
- `localStorage` はドメインごとに別です。github.io で匿名利用していた進捗は workers.dev に引き継がれません。生徒専用URL（`?s=&t=`）の進捗はクラウドにあるので、どちらのURLでも同じものが読めます。

## 本リポジトリの範囲外

- 第6セット以降のデータ作成（書籍番号51〜210）
