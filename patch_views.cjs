const fs = require('fs');
const path = require('path');

const viewsDir = path.join(__dirname, 'client/src/views');
const files = fs.readdirSync(viewsDir);

files.forEach(file => {
  if (!file.endsWith('View.tsx')) return;
  const filePath = path.join(viewsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  const match = content.match(/useEffect\(\(\) => \{\n\s+fetch([A-Za-z]+)\(\);\n\s+\}, \[\]\);/);
  if (match) {
    const fetchFuncName = `fetch${match[1]}`;
    const newHook = `useEffect(() => {
    ${fetchFuncName}();
    const handleRefresh = () => ${fetchFuncName}();
    window.addEventListener("portfolio-data-refresh", handleRefresh);
    return () => window.removeEventListener("portfolio-data-refresh", handleRefresh);
  }, []);`;
    
    content = content.replace(match[0], newHook);
    fs.writeFileSync(filePath, content);
    console.log(`Patched ${file}`);
  }
});
