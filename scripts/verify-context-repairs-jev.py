"""Blindly select the best answer from every eligible candidate for each repaired cloze."""
import argparse, concurrent.futures, json, os, pathlib, urllib.request

parser = argparse.ArgumentParser()
parser.add_argument('--out', type=pathlib.Path, default=pathlib.Path('docs/audits/context-jev-2026-10-15-after'))
OUT = parser.parse_args().out
results = json.loads((OUT / 'results.json').read_text(encoding='utf-8'))['results']
ids = set(json.loads(pathlib.Path('docs/audits/context-jev-2026-10-15/replacements.json').read_text(encoding='utf-8')))
def check(item):
    payload = {'model':'jev-latest', 'state':{'cloze':item['cloze'], 'candidates':item['candidates']}, 'questions':{
      'best': {'type':'choice', 'instructions':'日本語の評論文の空欄に入る最も適切な語を、文脈と通常の語義から一つ選ぶ。作問者の意図を推測しない。妥当な候補がない場合は該当なしを選ぶ。', 'criteria':{**{w:None for w in item['candidates']}, '該当なし':'どの候補を入れても不自然、または文脈に合わない。'}},
      'ambiguous': {'type':'noul', 'instructions':'`candidates` の二つ以上が、空欄の答えとして同程度に妥当で、書かれた文脈だけでは最適な一つに絞れないか。単に文法的に入るだけ、特殊な仮定を補えば入るだけの場合は否。'}
    }}
    req=urllib.request.Request('https://api.typesafe.ai/v1/systemone',data=json.dumps(payload,ensure_ascii=False).encode(),headers={'Authorization':'Bearer '+os.environ['TYPESAFE_API_KEY'],'Content-Type':'application/json'})
    with urllib.request.urlopen(req,timeout=60) as response:
        raw=json.load(response)
    return {'id':item['id'],'intended':item['intended'],'sha256':item['sha256'],'payload':payload,'response':raw}
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
    checks=list(executor.map(check,[r for r in results if r['id'] in ids]))
(OUT/'all-candidates-verification.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2),encoding='utf-8')
for r in checks:
    a=r['response']['answers']
    if a['best']['choice']!=r['intended'] or a['ambiguous']['noul']>=.5:
        print(r['id'],r['intended'],a['best']['choice'],a['ambiguous']['noul'])
print(f'Checked {len(checks)} repaired items')
