const fs = require('fs');

const files = [
  'app/app/(dashboard)/centres/page.tsx',
  'app/app/(dashboard)/groups/page.tsx',
  'app/app/(dashboard)/branches/page.tsx',
  'app/app/(dashboard)/loan-products/page.tsx'
];

for (const file of files) {
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace('import { useState, useEffect }\nimport { useQuery, useQueryClient } from "@tanstack/react-query" from "react"', 'import { useState, useEffect } from "react"\nimport { useQuery, useQueryClient } from "@tanstack/react-query"');
  fs.writeFileSync(file, c);
}
console.log('Fixed');
