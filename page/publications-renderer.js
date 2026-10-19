/* Multi-tab publication renderer. Supports legacy array and new v2 object data. */
(async function () {
  const root = document.getElementById('publications-container');
  if (!root) return;
  const response = await fetch('../data/publications.json', {cache:'no-cache'});
  if (!response.ok) throw new Error('Could not load publications.json ('+response.status+')');
  const data = await response.json();
  const publications = Array.isArray(data) ? data : data.publications;
  if (!Array.isArray(publications)) throw new Error('Invalid publication JSON');
  const categories = Array.isArray(data.categories) ? data.categories :
    [...new Set(publications.map(p=>p.category))].map((name,order)=>({name,order}));
  const headings = {
    'Journal':'Journal Articles (Peer-reviewed)',
    'Conference':'Conference Publications (Peer-reviewed)',
    'Extended Abstract':'Extended Abstracts and Late-Breaking Work',
    'Organized Workshop':'Organized Workshops',
    'Doctoral Consortium':'Doctoral Consortium',
    'Workshop Presentation':'Workshop Presentations'
  };
  function addLink(parent, label, raw) {
    if (!raw) return;
    try {
      const u = new URL(raw, location.href);
      if (!['https:','http:'].includes(u.protocol)) return;
      const a = document.createElement('a');
      a.className = 'linkpaper'; a.href = u.href;
      a.textContent = label; a.rel = 'noopener noreferrer';
      parent.append(' ',a);
    } catch (_) { /* malformed link */ }
  }
  function addAuthors(parent, value) {
    String(value || '').split(/(Jie Cai\*?)/g).forEach(part => {
      if (/^Jie Cai\*?$/.test(part)) {
        const bold = document.createElement('b'); bold.textContent = part; parent.append(bold);
      } else parent.append(document.createTextNode(part));
    });
  }
  const fragment = document.createDocumentFragment();
  categories.slice().sort((a,b)=>Number(a.order)-Number(b.order)).forEach(c => {
    const heading = document.createElement('h4');
    heading.textContent = headings[c.name] || c.name;
    const list = document.createElement('ol'); list.reversed = true;
    const rows = publications.filter(p=>p.category===c.name)
      .sort((a,b)=>Number(b.year)-Number(a.year) || Number(a.order||999)-Number(b.order||999));
    rows.forEach(p => {
      const li = document.createElement('li');
      const title = document.createElement('p'); title.className = 'title';
      if (p.award) title.append('🏅 ');
      title.append(document.createTextNode(p.title || ''));
      for (const [field,label] of [['pdf','PDF'],['doi','DOI'],['media','Media'],['project','Project'],['video','Video']])
        addLink(title,label,p[field]);
      const authors = document.createElement('p'); authors.className = 'author';
      addAuthors(authors,p.authors);
      const venue = document.createElement('p'); venue.className = 'venue'; venue.textContent = p.venue || '';
      li.append(title,authors,venue); list.append(li);
    });
    fragment.append(heading,list);
  });
  root.replaceChildren(fragment);
})().catch(err=>console.error('Publication display error:',err));
