"""Read-only semantic screening; run from repository root. Never edits learning data."""
import argparse, concurrent.futures, datetime, json, os, pathlib, subprocess, urllib.request

parser = argparse.ArgumentParser()
parser.add_argument('--out', type=pathlib.Path, default=pathlib.Path('docs/audits/context-jev-2026-10-15'))
OUT = parser.parse_args().out
OUT.mkdir(parents=True, exist_ok=True)
items = json.loads(subprocess.check_output(['node', 'scripts/export-context-audit.cjs'], encoding='utf-8'))
(OUT / 'inputs.json').write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding='utf-8')
instruction = ('日本語の評論文の空所補充を審査する。`cloze` の（　）に指定の候補語をそのまま入れたとき、'
               '文法・語の通常の意味・前後の論理のすべてに照らして自然で妥当な文として成立するか。'
               '元の例文や作問者の意図を推測せず、書かれた文だけで判断する。'
               '文外の特殊な設定や比喩を補わなければ成立しない場合は否。候補語: ')
def check(item):
    target = OUT / (item['id'] + '.json')
    if target.exists():
        cached = json.loads(target.read_text(encoding='utf-8'))
        if any(cached.get(key) != item[key] for key in ('sha256', 'cloze', 'candidates')):
            raise ValueError(f"Stale audit cache: {item['id']}; use a new --out directory")
        return cached
    questions = {f'fit_{i}': {'type': 'noul', 'instructions': instruction + word} for i, word in enumerate(item['candidates'])}
    payload = {'model': 'jev-latest', 'state': {'cloze': item['cloze']}, 'questions': questions}
    req = urllib.request.Request('https://api.typesafe.ai/v1/systemone', data=json.dumps(payload, ensure_ascii=False).encode(), headers={'Authorization': 'Bearer ' + os.environ['TYPESAFE_API_KEY'], 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            raw = json.load(response)
        result = {**item, 'response': raw, 'fit': {word: raw['answers'][f'fit_{i}']['noul'] for i, word in enumerate(item['candidates'])}}
        target.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
        return result
    except Exception as error:
        return {**item, 'error': type(error).__name__}
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
    results = []
    for result in executor.map(check, items):
        results.append(result)
        if len(results) % 25 == 0:
            print(f'completed {len(results)}/{len(items)}', flush=True)
summary = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'requested_model': 'jev-latest', 'instruction': instruction, 'thresholds': {'alternative_review': 0.5, 'borderline': 0.2, 'intended_review_below': 0.8}, 'results': results}
(OUT / 'results.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding='utf-8')
print('errors', sum('error' in r for r in results), flush=True)
