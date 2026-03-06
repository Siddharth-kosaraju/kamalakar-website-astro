import http from 'http';

const pages = [
  '/', '/about/', '/blog/', '/contact/', '/education/', '/services/',
  '/services/angioplasty/', '/services/ecg-echo/', '/services/emergency-cardiac-care/',
  '/services/heart-failure/', '/services/hypertension-cholesterol/', '/services/pacemaker/',
  '/privacy-policy/', '/terms-of-service/',
  '/blog/understanding-heart-attack-warning-signs/',
  '/te/', '/te/about/', '/te/blog/', '/te/contact/', '/te/education/', '/te/services/',
  '/te/services/angioplasty/', '/te/services/ecg-echo/', '/te/services/emergency-cardiac-care/',
  '/te/services/heart-failure/', '/te/services/hypertension-cholesterol/', '/te/services/pacemaker/',
  '/te/blog/understanding-heart-attack-warning-signs/',
  '/te/privacy-policy/', '/te/terms-of-service/'
];

function fetchPage(path) {
  return new Promise((resolve, reject) => {
    http.get({ host: 'localhost', port: 4321, path }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function extractH2s(html) {
  const matches = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)];
  return matches.map(m => m[1].replace(/<[^>]+>/g, '').trim());
}

const pageH2s = {};
for (const page of pages) {
  const html = await fetchPage(page);
  pageH2s[page] = extractH2s(html);
}

// Find H2 text that appears across multiple pages
const h2Map = {};
for (const [page, h2s] of Object.entries(pageH2s)) {
  for (const h2 of h2s) {
    if (!h2Map[h2]) h2Map[h2] = [];
    h2Map[h2].push(page);
  }
}

const duplicates = Object.entries(h2Map).filter(([, ps]) => ps.length > 1);

console.log('=== ALL H2s PER PAGE ===');
for (const [page, h2s] of Object.entries(pageH2s)) {
  console.log(`${page}: [${h2s.join(' | ')}]`);
}

console.log('\n=== DUPLICATE H2s ACROSS PAGES ===');
if (duplicates.length === 0) {
  console.log('No duplicates found!');
} else {
  for (const [h2, ps] of duplicates) {
    console.log(`"${h2}" appears on ${ps.length} pages:`);
    ps.forEach(p => console.log(`  - ${p}`));
  }
}
