const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = [...walk('app'), ...walk('components'), ...walk('lib')];
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content
    .replace(/(["'])\/dashboard/g, '/app/dashboard')
    .replace(/(["'])\/admin/g, '/app/admin')
    .replace(/(["'])\/login/g, '/app/login')
    .replace(/(["'])\/signup/g, '/app/signup');
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Updated ' + file);
  }
});
