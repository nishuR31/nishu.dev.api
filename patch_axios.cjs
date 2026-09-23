const fs = require('fs');
const path = require('path');

const viewsDir = path.join(__dirname, 'client/src/views');
const appFile = path.join(__dirname, 'client/src/App.tsx');

const replaceInFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content.replace(/axios\.get\(['"`]\/api\/portfolio['"`]\)/g, 'axios.get("/api/portfolio/admin")');
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent);
    console.log(`Patched ${filePath}`);
  }
};

const files = fs.readdirSync(viewsDir);
files.forEach(file => {
  if (file.endsWith('.tsx')) {
    replaceInFile(path.join(viewsDir, file));
  }
});

replaceInFile(appFile);
