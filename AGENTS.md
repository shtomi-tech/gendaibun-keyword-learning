# AGENTS.md — gendaibun-keyword-learning

> `C:\Users\shtom\dev\` 配下の共通ルール（`../AGENTS.md`）に従ったうえで、本リポジトリ固有の点だけをここに置く。

## このアプリ

現代文キーワードの静的学習Webアプリ。`kobun-vocab-learning` を複製し、古文固有のデータ・ロジック（和歌 `waka`、現代語訳 `translation`、音数フィルタ、典拠台帳、NDL底本照合）を除いたもの。学習コア（暗記カード → 意味四択 → 誤答確認 → 文中四択 → 最終チェック）とSRS・学習目標・セット状態・履歴を継承している。対義語・関連語は単語カードに表示するが、独立した演習にはしない。

- 名前空間: `GendaibunKeywordApp` / `GendaibunSetProgress` / `GendaibunMeaningGuard` / `GendaibunSrs` / `GendaibunCloud`
- `localStorage` 接頭辞: `gendaibun_keyword_*`
- 起動ポート: `8063`（`kobun-vocab-learning` の `8062` と分ける）

## データ作成の正本

`data/set-*.json` へ語・セットを追加、または例文を差し替えるときは [docs/AUTHORING_STANDARD.md](docs/AUTHORING_STANDARD.md) に従う。

- **例文は作例であり、原典を引用しない。** `source` は全語 `"作例"` 固定。書籍の定義文・解説・コラムを転記しない。見出し語（普遍・秩序 等）は一般語なので問題ないが、語義文・解説・例文は自分のことばで書く。
- **書籍のスキャンをリポジトリに置かない。** `.gitignore` に `*.pdf` / `scan/` を登録済み。スキャンは作業ディレクトリの外（Downloads 等）に置く。
- 和歌・典拠台帳・NDL底本照合の節は、このアプリには存在しない（古文版固有）。

## UIの正本

[DESIGN.md](DESIGN.md)。レイアウト・余白・コンポーネント規約は `kobun-vocab-learning` の `DESIGN.md` に準拠し、本リポジトリの `DESIGN.md` には**差分（配色・見出しフォント・朱の使いどころ）だけ**を記録する。

## 検証

変更後は最終編集の状態で次を通す。

```bash
node --check static/mode-vocab.js
node --check static/meaning-guard.js
node --check static/set-progress.js
node --check static/srs.js
node scripts/check-data.mjs
node scripts/check-set-choices.mjs
node scripts/check-context-choices.mjs
node scripts/check-srs.cjs
node scripts/check-set-progress.cjs
node scripts/check-study-plan.cjs
```

UIに関わる変更は実ブラウザ（`8063`）で、STEP 1〜3と最終チェックの通し、コンソールエラー、320〜375px幅、キーボード操作を確認する。

## 生徒別クラウド同期

`static/cloud.js` は `kobun-vocab-learning` と同じ共通契約（`portal/student_progress_contract.md`）で有効。`mount()` が `GendaibunCloud.create({ appId: "gendaibun-keyword-learning" })` を呼び、生徒専用URL（`?s=&t=`）のときだけ `app_auth_student` → `app_load_progress` → `app_save_progress_dataset` を実行する。

- 公開版の `static/config.json` は Actions の `SUPABASE_URL` / `SUPABASE_ANON_KEY`（anon キーのみ）から `scripts/write-config.mjs` が生成する。`config.json` は `.gitignore` 済み。
- シークレット未設定なら `config.json` は空になり、匿名 `localStorage` へ自動フォールバックする。契約変更（新RPC・スキーマ）は `portal` 側の正本に従う。

## 範囲外（別途の明示指示を待つ）

第6セット以降のデータ作成（書籍番号51〜210）。共通進捗スキーマ・RPCそのものの変更。
