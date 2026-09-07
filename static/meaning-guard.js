"use strict";

// 四択の誤答が正解と同義にならないための判定をまとめる。
// アプリ（static/mode-vocab.js）と検査スクリプト（scripts/check-*.mjs）が
// 同じ実装を参照するための唯一の正本。ここを直せば両方に反映される。
const GendaibunMeaningGuard = (() => {
  // 意味文の表記ゆれを落とす。記号・囲み数字・「〜」の省略記号は同義判定の邪魔になる。
  const normalizeMeaning = (value) => value.replace(/[「」『』【】（）()、。・／〜～⇔①②③④⑤\s]/g, "");
  const meaningParts = (value) => value.split(/[。／]/).map(normalizeMeaning).filter(Boolean);
  const meaningText = (word) => word.meanings.join("／");

  // 字面は違うが学習上は同義に見える語群。1問の選択肢に2つ以上出さない。
  // 現代文キーワードは同一セット内の語が隣接概念（具体／抽象、秩序／混沌）で
  // もともと紛らわしいので、明確に「言い換えが利く」ものだけを最小限で持つ。
  // 第1セット（普遍・特殊・具体・抽象・秩序・混沌・必然・偶然・対象・権威）で
  // 必要な族は次の4つ。セットを増やすときはここへ追記する。
  const meaningFamilies = [
    // 「普遍」と「一般」は評論では言い換えが利き、語義文でも重なりやすい。
    /普遍|一般|例外なく/,
    // 「具体」「具象」「具現」は同じ方向の語で、語義からは切り分けられない。
    /具体|具象|具現|現実に即/,
    // 「秩序」と「整然」「まとまり」は同じ状態を指す。
    /秩序|整然|まとまって/,
    // 「必然」と「法則」「因果」は、避けられなさという同じ含意で入れ替わる。
    /必然|法則|因果/,
  ];

  const hasMeaningOverlap = (word, other) => word.meanings.some((meaning) =>
    other.meanings.some((candidate) => meaningParts(meaning).some((left) =>
      meaningParts(candidate).some((right) =>
        left === right || (Math.min(left.length, right.length) >= 4 && (left.includes(right) || right.includes(left)))
      )
    ))
  );

  const hasMeaningFamilyOverlap = (word, other) => meaningFamilies.some((family) =>
    word.meanings.some((meaning) => family.test(meaning)) &&
    other.meanings.some((meaning) => family.test(meaning))
  );

  const isSafePair = (word, other) => !hasMeaningOverlap(word, other) && !hasMeaningFamilyOverlap(word, other);

  // choiceSet() は誤答を1つずつ足しながら、既に選んだ誤答とも安全かを見る。
  // つまり「正解に対して安全」だけでは足りず、誤答どうしも安全な3つ組が要る。
  function hasThreeMutuallySafe(target, pool) {
    const candidates = pool.filter((other) => other.id !== target.id && isSafePair(target, other));
    for (let first = 0; first < candidates.length; first += 1) {
      for (let second = first + 1; second < candidates.length; second += 1) {
        if (!isSafePair(candidates[first], candidates[second])) continue;
        for (let third = second + 1; third < candidates.length; third += 1) {
          if (isSafePair(candidates[first], candidates[third]) && isSafePair(candidates[second], candidates[third])) {
            return { ok: true, candidateCount: candidates.length };
          }
        }
      }
    }
    return { ok: false, candidateCount: candidates.length };
  }

  return {
    meaningText,
    normalizeMeaning,
    meaningParts,
    meaningFamilies,
    hasMeaningOverlap,
    hasMeaningFamilyOverlap,
    isSafePair,
    hasThreeMutuallySafe,
  };
})();

if (typeof module !== "undefined") module.exports = GendaibunMeaningGuard;
