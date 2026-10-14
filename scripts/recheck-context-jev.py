import argparse, concurrent.futures, json, os, pathlib, urllib.request
parser = argparse.ArgumentParser()
parser.add_argument('--out', type=pathlib.Path, default=pathlib.Path('docs/audits/context-jev-2026-10-15'))
OUT = parser.parse_args().out
results = json.loads((OUT / 'results.json').read_text(encoding='utf-8'))['results']
def check(item):
    alternatives = {w:p for w,p in item['fit'].items() if w != item['intended'] and p >= .5}
    if not alternatives:
        return None
    word = max(alternatives, key=alternatives.get)
    options = sorted(item['witnesses'][word])
    payload = {'model':'jev-latest', 'state':{'cloze':item['cloze'], 'options':options}, 'questions':{
      'best': {'type':'choice', 'instructions':'日本語の評論の空欄に入る語を、前後の文脈と通常の語義から最も適切なもの一つとして選ぶ。作問者の意図を推測しない。', 'criteria':{w:None for w in options}},
      'ambiguous': {'type':'noul', 'instructions':'`options` の二つ以上が、`cloze` の空欄の答えとして同程度に妥当で、書かれた文脈だけでは一つに絞れないか。単に文法的に入るだけ、特殊な仮定を補えば入るだけの場合は否。'}
    }}
    request = urllib.request.Request('https://api.typesafe.ai/v1/systemone',data=json.dumps(payload,ensure_ascii=False).encode(),headers={'Authorization':'Bearer '+os.environ['TYPESAFE_API_KEY'],'Content-Type':'application/json'})
    with urllib.request.urlopen(request,timeout=60) as response:
        raw=json.load(response)
    return {'id':item['id'], 'intended':item['intended'], 'alternative':word, 'payload':payload, 'response':raw}
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
    checks=[r for r in executor.map(check,results) if r]
(OUT/'recheck.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2),encoding='utf-8')
for r in checks:
    a=r['response']['answers']
    print(r['id'],r['intended'],r['alternative'],a['best']['choice'],a['ambiguous']['noul'])
