const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.spec.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = [...walk('app'), ...walk('components'), ...walk('lib'), ...walk('tests')];
const targetRoutes = ['branches', 'centres', 'members', 'loans', 'collection', 'reports', 'loan-products', 'settings'];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;
  
  targetRoutes.forEach(route => {
    // Match /route followed by optional /something or closing quote
    const regex = new RegExp(`(["'])\\/(${route})(\\/[^"']*)?(["'])`, 'g');
    newContent = newContent.replace(regex, '$1/app/$2$3$4');
  });

  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Updated ' + file);
  }
});
