import csv, io, json, os, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = {'id','year','category','title','authors','venue','visible'}

def main():
    url = os.environ.get('PUBLICATIONS_CSV_URL')
    if not url:
        raise RuntimeError('Set PUBLICATIONS_CSV_URL to the published Google Sheet CSV URL')
    with urllib.request.urlopen(url, timeout=30) as r:
        content = r.read().decode('utf-8-sig')
    reader = csv.DictReader(io.StringIO(content))
    if not reader.fieldnames or not REQUIRED.issubset(reader.fieldnames):
        raise ValueError(f'Missing required columns: {sorted(REQUIRED - set(reader.fieldnames or []))}')
    result, seen = [], set()
    for number, row in enumerate(reader, 2):
        if not any((v or '').strip() for v in row.values() if isinstance(v, str)):
            continue
        if (row.get('visible') or '').strip().lower() not in ('true','yes','1'):
            continue
        p = {k: (v or '').strip() for k,v in row.items() if k}
        for field in REQUIRED - {'visible'}:
            if not p.get(field):
                raise ValueError(f'Row {number}: missing {field}')
        if p['id'] in seen:
            raise ValueError(f'Row {number}: duplicate ID {p["id"]}')
        seen.add(p['id'])
        p['year'] = int(p['year'])
        p['order'] = int(p.get('order') or 999)
        result.append(p)
    if not result:
        raise ValueError('No visible publications; refusing to overwrite JSON')
    result.sort(key=lambda p: (p['category'], -p['year'], p['order']))
    target = ROOT / 'data' / 'publications.json'
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(result, indent=2, ensure_ascii=False)+'\n', encoding='utf-8')
    print(f'Exported {len(result)} publications to {target}')

if __name__ == '__main__':
    main()
