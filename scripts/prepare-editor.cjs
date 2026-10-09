const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const pkg = path.dirname(require.resolve('vditor/package.json'));
const target = path.join(root, 'public/vendor/vditor');
fs.mkdirSync(target, { recursive: true });
fs.cpSync(path.join(pkg, 'dist'), path.join(target, 'dist'), { recursive: true });
fs.copyFileSync(path.join(pkg, 'LICENSE'), path.join(target, 'LICENSE'));
console.log('Vditor assets prepared for same-origin delivery.');
