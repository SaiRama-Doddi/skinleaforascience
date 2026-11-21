// Copies frontend/dist into every folder the Hostinger deployment may serve from,
// replacing (not accumulating) the hashed files in each assets/ folder.
// Never touches anything else in the targets (e.g. backend/public/uploads).
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'frontend', 'dist');

if (!fs.existsSync(path.join(source, 'index.html'))) {
  console.error('frontend/dist/index.html not found. Run the frontend build first.');
  process.exit(1);
}

const fullTargets = ['dist', 'build', 'backend/dist', 'backend/public'];

const replaceAssets = (targetDir) => {
  const assetsDir = path.join(targetDir, 'assets');
  fs.rmSync(assetsDir, { recursive: true, force: true });
  fs.cpSync(path.join(source, 'assets'), assetsDir, { recursive: true });
};

for (const rel of fullTargets) {
  const target = path.join(root, rel);
  fs.mkdirSync(target, { recursive: true });
  replaceAssets(target);
  for (const entry of fs.readdirSync(source)) {
    if (entry === 'assets') continue;
    fs.cpSync(path.join(source, entry), path.join(target, entry), { recursive: true });
  }
  console.log(`synced → ${rel}/`);
}

// Repo root only gets index.html + assets/ (the server exposes nothing else from the root)
replaceAssets(root);
fs.copyFileSync(path.join(source, 'index.html'), path.join(root, 'index.html'));
console.log('synced → ./index.html + ./assets/');
