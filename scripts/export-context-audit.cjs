const fs = require('node:fs');
const crypto = require('node:crypto');
const { isSafePair } = require('../static/meaning-guard.js');
const manifest = JSON.parse(fs.readFileSync('data/manifest.json', 'utf8'));
const items = [];
for (const [setId, entry] of Object.entries(manifest.sets)) {
  const source = fs.readFileSync(entry.dataUrl, 'utf8');
  const { words } = JSON.parse(source);
  for (const word of words) {
    const pool = words.filter(w => w.id !== word.id && isSafePair(word, w));
    const witnesses = {};
    for (let i = 0; i < pool.length; i++) for (let j = i + 1; j < pool.length; j++) for (let k = j + 1; k < pool.length; k++) {
      const triple = [pool[i], pool[j], pool[k]];
      if (!isSafePair(triple[0], triple[1]) || !isSafePair(triple[0], triple[2]) || !isSafePair(triple[1], triple[2])) continue;
      for (const w of triple) witnesses[w.headword] = [word.headword, ...triple.map(x => x.headword)];
    }
    items.push({ setId, id: word.id, source: entry.dataUrl, sha256: crypto.createHash('sha256').update(source).digest('hex'), cloze: word.cloze, intended: word.headword, candidates: [word.headword, ...Object.keys(witnesses)].sort(), witnesses });
  }
}
process.stdout.write(JSON.stringify(items, null, 2));
