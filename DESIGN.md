# DESIGN.md — 現代文キーワード 学習アプリ

このアプリのUI規約は `../kobun-vocab-learning/DESIGN.md` を土台とする。**レイアウト・余白・グリッド・コンポーネント役割・Motion・状態マトリクスはそちらに準拠**し、本書には現代文キーワード版で意図的に変えた差分だけを記録する。同じ生徒が2つのアプリを行き来するため、**操作は同じ・色で区別できる**ことを設計の軸にする。

## 1. 色（役割トークンの差し替え）

`static/styles.css` の `:root` で次のトークンだけを差し替える。レイアウト・余白・角丸・数値表示のトークンは変更しない。役割色（`--color-success` / `--color-danger` / `--color-warn`）も変更しない。

| トークン | 古文版 | 本アプリ | 役割 |
| --- | --- | --- | --- |
| `--color-canvas` | `#faf9f5` | `#f2f3f6` | 地。わずかに青みのある明るいグレー |
| `--color-surface-primary` | `#efe9de` | `#e6e9f0` | カード面 |
| `--color-surface-subtle` | `#f5f0e8` | `#eceef4` | 補助面 |
| `--color-ink-primary` | `#141413` | `#191d26` | 本文インク |
| `--color-ink-secondary` | `#615c54` | `#5b6272` | 補助テキスト |
| `--color-border` | `#e6dfd8` | `#d2d6de` | 罫線 |
| `--color-control-border` | `#8a8478` | `#b5bbc7` | コントロール境界 |
| `--color-accent` | `#a9583e`（赤茶） | `#26397a`（紺） | 主アクセント |
| `--color-accent-strong` | `#8a4732` | `#1b2a5e` | 主アクセント濃 |

`--clay` / `--clay-dark` は `--color-accent` / `--color-accent-strong` のエイリアスなので、紺へ自動追従する（要復習の左罫、resumeNotice、meaningMission、reviewCta など）。

### 朱 `--color-highlight: #a8392c`（新規）

書籍の意匠（紺と朱）に合わせた差し色。**用途を限定する**:

- 「要復習」バッジのテキストと左罫（`.wordRow.review`、`.setOptionState--review`、`.blockCardState--review`、`.blockCard--review`）

**正誤表示には使わない。** 緑 `--color-success` / 赤 `--color-danger` と混同されるため。正誤の緑・赤は主色の紺とも競合しない。

## 2. タイポグラフィ

- `--serif` を `"Shippori Mincho", "Hiragino Mincho ProN", "Yu Mincho", serif` に変更（古文版は Cormorant Garamond）。見出し（h1/h2）・見出し語・例文に効く。
- `index.html` の Google Fonts を `Cormorant+Garamond` → `Shippori+Mincho:wght@500;700` に差し替え。`Inter`（`--sans`）と `JetBrains Mono`（`--mono`）は据え置き。
- `theme-color` は `#f2f3f6`。

## 3. 単語カード（`wordCard`）

- 見出しは `見出し語【読み】` ＋ カタカナ別称チップ（`alias` がある語のみ）。古文版の `【漢字】` は廃止。
- 「例文の訳」節を廃止（現代文キーワードに訳はない）。「和歌」表示・作者・出典箇所も廃止。
- 「対義語・関連語」節を追加（`antonyms` / `related` がある語のみ）。
- 例文見出しは `例文（作例）`。原典引用でないことを画面上で明示する。

## 4. STEP 3 の手掛かり

古文版は「現代語訳」を手掛かりに空欄の語を選ばせるが、現代文には訳がない。**空欄を含む例文そのもの**を手掛かりとし、正誤確定後に空欄なしの例文を提示する。設問ラベルは「空欄に入るキーワードを選べ」。
