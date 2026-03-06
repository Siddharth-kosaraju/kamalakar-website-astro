/**
 * Extract YAML content from basic.md and write to separate files
 * for Astro content collections.
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '../../kamalakar-website/content/basic.md');
const SITE_DIR = path.join(__dirname, '../src/content/site');
const SERVICES_DIR = path.join(__dirname, '../src/content/services');

const raw = fs.readFileSync(SRC, 'utf-8');

// Split by ## en and ## te headings
const sections = raw.split(/^## /m).filter(Boolean);

for (const section of sections) {
  const lines = section.split('\n');
  const lang = lines[0].trim();
  if (lang !== 'en' && lang !== 'te') continue;

  // Extract YAML between ```yaml and ```
  const yamlBlocks = [];
  let inYaml = false;
  let currentBlock = [];
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '```yaml') {
      inYaml = true;
      currentBlock = [];
    } else if (inYaml && lines[i].trim() === '```') {
      inYaml = false;
      yamlBlocks.push(currentBlock.join('\n'));
    } else if (inYaml) {
      currentBlock.push(lines[i]);
    }
  }

  const fullYaml = yamlBlocks.join('\n');

  // Extract servicePages section and write to separate files
  // First, find the servicePages: line
  const spIdx = fullYaml.indexOf('\nservicePages:');
  if (spIdx === -1) {
    // No servicePages — write entire YAML as site content
    fs.writeFileSync(path.join(SITE_DIR, `${lang}.yaml`), fullYaml.trim() + '\n');
    continue;
  }

  // Everything before servicePages is the site content
  const siteYaml = fullYaml.substring(0, spIdx).trim();
  fs.writeFileSync(path.join(SITE_DIR, `${lang}.yaml`), siteYaml + '\n');

  // Extract servicePages section
  const spYaml = fullYaml.substring(spIdx + 1); // skip the leading \n

  // Parse servicePages manually — find each "- slug:" entry
  const serviceEntries = spYaml.split(/\n    - slug: /).slice(1); // split on "    - slug: "

  for (const entry of serviceEntries) {
    const slugMatch = entry.match(/^"?([a-z-]+)"?/);
    if (!slugMatch) continue;
    const slug = slugMatch[1];

    // Reconstruct the YAML for this service, removing 6-space indentation
    const rawLines = ('slug: ' + entry.trim()).split('\n');
    const dedentedLines = rawLines.map(line => {
      // The first line (slug:) has no extra indent, subsequent lines have 6 spaces
      if (line.startsWith('      ')) return line.substring(6);
      return line;
    });
    const serviceYaml = dedentedLines.join('\n');

    // Write to per-service file (append lang suffix if Telugu)
    const filename = lang === 'en' ? `${slug}.yaml` : `${slug}-te.yaml`;
    fs.writeFileSync(path.join(SERVICES_DIR, filename), serviceYaml + '\n');
  }
}

console.log('Content extraction complete!');
console.log('Site files:', fs.readdirSync(SITE_DIR));
console.log('Service files:', fs.readdirSync(SERVICES_DIR));
