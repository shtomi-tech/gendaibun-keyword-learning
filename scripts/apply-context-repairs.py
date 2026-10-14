"""Apply reviewed cloze replacements, preserving all other JSON bytes and fields."""
import json, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
AUDIT = ROOT / 'docs/audits/context-jev-2026-10-15'
replacements = json.loads((AUDIT / 'replacements.json').read_text(encoding='utf-8'))
originals = {r['id']: r for r in json.loads((AUDIT / 'results.json').read_text(encoding='utf-8'))['results']}
changes = []
for path in sorted((ROOT / 'data').glob('set-*.json')):
    source = path.read_bytes().decode('utf-8')
    data = json.loads(source)
    for word in data['words']:
        if word['id'] not in replacements:
            continue
        cloze = replacements[word['id']]
        assert cloze.count('（　）') == 1
        example = cloze.replace('（　）', word['headword'])
        assert example.count(word['headword']) == 1, word['id']
        assert all(other['headword'] not in cloze for other in data['words'] if other['id'] != word['id']), word['id']
        assert 40 <= len(example) <= 75, (word['id'], len(example))
        changes.append({'id': word['id'], 'headword': word['headword'], 'before': originals[word['id']]['cloze'], 'after': cloze})
        if word['cloze'] == cloze:
            continue
        prior = {}
        if (AUDIT / 'changes.json').exists():
            prior = {r['id']: r['after'] for r in json.loads((AUDIT / 'changes.json').read_text(encoding='utf-8'))}
        assert word['cloze'] in (originals[word['id']]['cloze'], prior.get(word['id'])), f"Unexpected edit: {word['id']}"
        for field, value in [('example', example), ('cloze', cloze)]:
            old = json.dumps(field, ensure_ascii=False) + ': ' + json.dumps(word[field], ensure_ascii=False)
            new = json.dumps(field, ensure_ascii=False) + ': ' + json.dumps(value, ensure_ascii=False)
            assert source.count(old) == 1, word['id']
            source = source.replace(old, new, 1)
    if changes:
        path.write_bytes(source.encode('utf-8'))
if changes:
    (AUDIT / 'changes.json').write_text(json.dumps(changes, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'Updated {len(changes)} examples')
