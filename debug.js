const fs = require('fs')
const file = 'app/api/loans/[id]/events/route.ts'
let content = fs.readFileSync(file, 'utf8')
const startStr = '// --- ACCOUNTING ---'
let idx1 = content.indexOf(startStr)
console.log(content.substring(idx1, idx1 + 1000))
