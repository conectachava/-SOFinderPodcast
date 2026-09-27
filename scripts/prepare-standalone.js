const fs = require('node:fs');
const path = require('node:path');

const projectRoot = process.cwd();
const standaloneDir = path.join(projectRoot, '.next', 'standalone');

if (!fs.existsSync(path.join(standaloneDir, 'server.js'))) {
  throw new Error('Next.js standalone server is missing. Run next build first.');
}

const assets = [
  {
    source: path.join(projectRoot, 'public'),
    destination: path.join(standaloneDir, 'public'),
  },
  {
    source: path.join(projectRoot, '.next', 'static'),
    destination: path.join(standaloneDir, '.next', 'static'),
  },
];

for (const { source, destination } of assets) {
  if (fs.existsSync(source)) {
    fs.cpSync(source, destination, { recursive: true });
  }
}