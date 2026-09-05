const fs = require('fs');
const path = require('path');
const archiver = require ? null : null;

// Simple zip using Node's built-in archiving via tar-like approach
// We'll just copy the needed files to a temp folder
const src = path.join(__dirname);
const dest = path.join('C:\\Users\\Dr Mehra\\Desktop\\bus-setu-deploy');

const ignore = ['node_modules', '.gitignore', 'bus-setu-deploy'];

function copyDir(from, to) {
  if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });
  const items = fs.readdirSync(from);
  for (const item of items) {
    if (ignore.some(ig => item === ig)) continue;
    const srcPath = path.join(from, item);
    const destPath = path.join(to, item);
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Remove old deploy folder
if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true });

copyDir(src, dest);
console.log('Deploy folder created at:', dest);
console.log('Files copied:', fs.readdirSync(dest).join(', '));
