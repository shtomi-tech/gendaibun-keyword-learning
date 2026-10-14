# Issue #4 教材表現の改善

対象: https://github.com/shtomi-tech/gendaibun-keyword-learning/issues/4

## 実装と人手QA

- P2-1 / IMPLEMENT / DONE: gk15-146「装置」を、学校の規則・評価が行動や価値観を方向づける社会的用法に変更した。既存の語義と解説に整合し、目的と作用を空欄前後に残した。
- P2-2 / IMPLEMENT / DONE: gk14-140「時間・空間の均質化」を、標準時への統一と地図の座標による比較に変更した。土地固有の意味を離れることと共通尺度を具体的に示した。
- P3 / IMPLEMENT / DONE: gk15-147「リスク」の語義を「将来、損失や被害など望ましくない結果が生じる可能性。」へ変更した。個人の行動に限らず、環境・技術・制度由来の被害の可能性も含む。既存の解説と例文は引き続き妥当。

例文は書き下ろしの評論調1文。見出し語は各1回のみ、空欄は見出し語の正確な置換。同セットの別見出し語は空欄前後に含めない。ID、dataVersion、その他の教材情報とアプリの進捗契約は保持した。

## 検証

2026-10-15、最終教材編集後に以下が成功した。

- 構文: mode-vocab.js、meaning-guard.js、set-progress.js、srs.js
- check-data.mjs、check-data-contract.mjs、check-meaning-guard.cjs
- check-set-choices.mjs、check-context-choices.mjs
- check-srs.cjs、check-fsrs-vendor.cjs、check-response-time-ui.cjs
- check-set-progress.cjs、check-study-plan.cjs
- git diff --check

例文2問を正答ラベルなし・全適格候補でJevに追加照合した（失敗0、実モデル jev-1.13.0）。時間・空間の均質化の最適解確率0.99、装置0.75。複数解判定はそれぞれ0.27、0.36。生応答と正確な入力は issue-4-jev.json に保存。校正済みの合否基準ではなく、内容判断の補助証拠である。

UIのコード・スタイルは変更していないため、今回ブラウザ操作による表示検証は実施していない。ローカルで公開用ビルド・Cloudflare dry-runは実施していない。push後のCIを別途確認する。過去の全問監査は当時の入力に対する履歴であり、今回変更した2セットの現行ハッシュを保証しない。
