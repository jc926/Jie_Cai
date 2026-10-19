"""Download the Apps Script multi-tab JSON snapshot and validate before committing."""
import json
import os
from pathlib import Path
from urllib.request import Request, urlopen

ENDPOINT = os.environ['PUBLICATIONS_APPS_SCRIPT_URL']
OUTPUT = Path('data/publications.json')


def main():
    if not ENDPOINT.startswith('https://'):
        raise ValueError('PUBLICATIONS_APPS_SCRIPT_URL must be an HTTPS URL')
    request = Request(ENDPOINT, headers={'User-Agent': 'PublicationSync/2.0'})
    with urlopen(request, timeout=60) as response:
        payload = json.load(response)
    if not isinstance(payload, dict) or payload.get('error'):
        raise ValueError(f'Apps Script export error: {payload}')
    categories = payload.get('categories')
    publications = payload.get('publications')
    if not isinstance(categories, list) or not isinstance(publications, list) or not publications:
        raise ValueError('Expected non-empty publications and categories lists')
    names = [c.get('name') for c in categories]
    if len(names) != len(set(names)) or not all(isinstance(n, str) and n for n in names):
        raise ValueError('Invalid category names')
    seen = set()
    for p in publications:
        if not isinstance(p, dict) or not all(p.get(k) for k in ('id','title','authors','venue')):
            raise ValueError('Invalid publication record')
        if p['id'] in seen:
            raise ValueError('Duplicate publication ID: '+p['id'])
        seen.add(p['id'])
        if p.get('category') not in names or not isinstance(p.get('year'), int):
            raise ValueError('Invalid publication category or year')
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f'Exported {len(publications)} publications in {len(categories)} categories')


if __name__ == '__main__':
    main()
