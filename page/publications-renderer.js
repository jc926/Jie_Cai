/* Place <script defer src="publications-renderer.js"></script> in publication.html.
   Add data-publication-category="Journal" (etc.) to each category's existing <ol>.
   Keep original list items until ready to switch to the generated data. */
(async function () {
  const lists = [...document.querySelectorAll('ol[data-publication-category]')];
  if (!lists.length) return;
  const response = await fetch('../data/publications.json');
  if (!response.ok) throw new Error('Could not load publications.json');
  const publications = await response.json();
  const allowedProtocols = new Set(['http:', 'https:']);
  function link(parent, label, raw) {
    if (!raw) return;
    try {
      const u = new URL(raw, window.location.href);
      if (!allowedProtocols.has(u.protocol)) return;
      const a = document.createElement('a');
      a.className = 'linkpaper'; a.href = u.href;
      a.textContent = label; a.rel = 'noopener noreferrer';
      parent.append(' ', a);
    } catch (_) { /* ignore malformed link */ }
  }
  function authorsWithHighlight(parent, names) {
    const chunks = names.split(/(Jie Cai\*?)/g);
    for (const chunk of chunks) {
      if (/^Jie Cai\*?$/.test(chunk)) {
        const b = document.createElement('b'); b.textContent = chunk; parent.append(b);
      } else parent.append(document.createTextNode(chunk));
    }
  }
  for (const ol of lists) {
    const category = ol.dataset.publicationCategory;
    const rows = publications.filter(p => p.category === category)
      .sort((a,b) => b.year-a.year || a.order-b.order);
    const fragment = document.createDocumentFragment();
    for (const p of rows) {
      const li = document.createElement('li');
      const title = document.createElement('p'); title.className = 'title';
      if (p.award) title.append(document.createTextNode('🏅 '));
      title.append(document.createTextNode(p.title));
      link(title, 'PDF', p.pdf); link(title, 'DOI', p.doi);
      link(title, 'Media', p.media); link(title, 'Project', p.project);
      const authors = document.createElement('p'); authors.className = 'author';
      authorsWithHighlight(authors, p.authors);
      const venue = document.createElement('p'); venue.className = 'venue';
      venue.textContent = p.venue;
      li.append(title, authors, venue); fragment.append(li);
    }
    // Replace only when matching records exist, protecting legacy HTML on incomplete migration.
    if (rows.length) ol.replaceChildren(fragment);
  }
})().catch(error => console.error('Publication sync display error:', error));
