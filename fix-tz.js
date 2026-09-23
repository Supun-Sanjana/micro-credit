const fs = require('fs');
const files = [
  'app/api/field/dashboard/route.ts',
  'app/api/field/centres/[id]/collection-sheet/route.ts',
  'app/api/field/reconcile/route.ts'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(/import \{ toZonedTime \} from "date-fns-tz";\n/, '');
  
  if (file.includes('reconcile')) {
    content = content.replace(/const targetDate = new Date\(date\);\n[\s]*const start = startOfDay\(targetDate\);\n[\s]*const end = endOfDay\(targetDate\);/g, 
      `const targetDate = new Date(date);
    const start = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
    const end = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);
    // Adjusted for Asia/Colombo statically if needed
    start.setUTCHours(start.getUTCHours() - 5, start.getUTCMinutes() - 30);
    end.setUTCHours(end.getUTCHours() - 5, end.getUTCMinutes() - 30);`
    );
  } else {
    content = content.replace(/const start = startOfDay\(today\);\n[\s]*const end = endOfDay\(today\);/g, 
      `const formatter = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Colombo", year: "numeric", month: "2-digit", day: "2-digit" });
    const parts = formatter.formatToParts(today);
    const y = parts.find((p) => p.type === 'year')?.value;
    const m = parts.find((p) => p.type === 'month')?.value;
    const d = parts.find((p) => p.type === 'day')?.value;
    const start = new Date(\`\${y}-\${m}-\${d}T00:00:00+05:30\`);
    const end = new Date(\`\${y}-\${m}-\${d}T23:59:59.999+05:30\`);`
    );
  }

  fs.writeFileSync(file, content);
});
