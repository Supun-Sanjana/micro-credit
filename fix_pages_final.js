const fs = require('fs');

const files = [
  'app/app/(dashboard)/centres/page.tsx',
  'app/app/(dashboard)/groups/page.tsx',
  'app/app/(dashboard)/branches/page.tsx',
  'app/app/(dashboard)/loan-products/page.tsx'
];

for (const file of files) {
  let c = fs.readFileSync(file, 'utf8');
  if (!c.includes('useQueryClient')) {
    c = c.replace('import { useState, useEffect } from "react"', 'import { useState, useEffect } from "react"\nimport { useQuery, useQueryClient } from "@tanstack/react-query"');
  }

  // Find the fetchData function and useEffect
  c = c.replace(/const fetchData = async \(\) \{[\s\S]*?\}\n  useEffect\(\(\) => \{ fetchData\(\) \}, \[\]\)/, '');
  c = c.replace(/const fetchProducts = async \(\) \{[\s\S]*?\}\n  useEffect\(\(\) => \{ fetchProducts\(\) \}, \[\]\)/, '');
  
  if (file.includes('centres/page.tsx')) {
    c = c.replace(/const \[centres, setCentres\] = useState<any\[\]>\(\[\]\)/, '');
    c = c.replace(/const \[branches, setBranches\] = useState<Branch\[\]>\(\[\]\)/, '');
    c = c.replace(/const \[officers, setOfficers\] = useState<any\[\]>\(\[\]\)/, '');
    c = c.replace(/const \[isLoading, setIsLoading\] = useState\(true\)/, '');
    
    // Add useQuery block
    const queryBlock = `const queryClient = useQueryClient()
  const { data: centresRes, isLoading } = useQuery({ queryKey: ['centres'], queryFn: async () => (await fetch('/api/centres')).json() })
  const centres = centresRes?.data || centresRes || []
  const { data: branchesRes } = useQuery({ queryKey: ['branches'], queryFn: async () => (await fetch('/api/branches')).json(), staleTime: 600000 })
  const branches = branchesRes?.data || branchesRes || []
  const { data: officersRes } = useQuery({ queryKey: ['team'], queryFn: async () => { const res = await fetch('/api/team'); const users = await res.json(); return users.filter((u: any) => u.role === "USER" || u.role === "FIELD_OFFICER") }, staleTime: 600000 })
  const officers = officersRes || []`;
    
    c = c.replace('export default function CentresPage() {\n', 'export default function CentresPage() {\n  ' + queryBlock + '\n');
    c = c.replace('onSuccess={fetchData}', 'onSuccess={() => queryClient.invalidateQueries({ queryKey: [\'centres\'] })}');
  }

  if (file.includes('groups/page.tsx')) {
    c = c.replace(/const \[groups, setGroups\] = useState<any\[\]>\(\[\]\)/, '');
    c = c.replace(/const \[centres, setCentres\] = useState<any\[\]>\(\[\]\)/, '');
    c = c.replace(/const \[isLoading, setIsLoading\] = useState\(true\)/, '');
    
    const queryBlock = `const queryClient = useQueryClient()
  const { data: groupsRes, isLoading } = useQuery({ queryKey: ['groups'], queryFn: async () => (await fetch('/api/groups')).json() })
  const groups = groupsRes?.data || groupsRes || []
  const { data: centresRes } = useQuery({ queryKey: ['centres'], queryFn: async () => (await fetch('/api/centres')).json(), staleTime: 600000 })
  const centres = centresRes?.data || centresRes || []`;

    c = c.replace('export default function GroupsPage() {\n', 'export default function GroupsPage() {\n  ' + queryBlock + '\n');
    c = c.replace('onSuccess={fetchData}', 'onSuccess={() => queryClient.invalidateQueries({ queryKey: [\'groups\'] })}');
  }

  if (file.includes('branches/page.tsx')) {
    c = c.replace(/const \[branches, setBranches\] = useState<Branch\[\]>\(\[\]\)/, '');
    c = c.replace(/const \[isLoading, setIsLoading\] = useState\(true\)/, '');

    const queryBlock = `const queryClient = useQueryClient()
  const { data: branchesRes, isLoading } = useQuery({ queryKey: ['branches'], queryFn: async () => (await fetch('/api/branches')).json(), staleTime: 600000 })
  const branches = branchesRes?.data || branchesRes || []`;

    c = c.replace('export default function BranchesPage() {\n', 'export default function BranchesPage() {\n  ' + queryBlock + '\n');
    c = c.replace('onSuccess={fetchData}', 'onSuccess={() => queryClient.invalidateQueries({ queryKey: [\'branches\'] })}');
  }

  if (file.includes('loan-products/page.tsx')) {
    c = c.replace(/const \[products, setProducts\] = useState<ExtendedLoanProduct\[\]>\(\[\]\)/, '');
    c = c.replace(/const \[isLoading, setIsLoading\] = useState\(true\)/, '');

    const queryBlock = `const queryClient = useQueryClient()
  const { data: productsRes, isLoading } = useQuery({ queryKey: ['loan-products'], queryFn: async () => (await fetch('/api/loan-products')).json(), staleTime: 600000 })
  const products = productsRes?.data || productsRes || []`;

    c = c.replace('export default function LoanProductsPage() {\n', 'export default function LoanProductsPage() {\n  ' + queryBlock + '\n');
    c = c.replace('onSuccess={fetchProducts}', 'onSuccess={() => queryClient.invalidateQueries({ queryKey: [\'loan-products\'] })}');
    c = c.replace('if (res.ok) fetchProducts()', 'if (res.ok) queryClient.invalidateQueries({ queryKey: [\'loan-products\'] })');
  }

  fs.writeFileSync(file, c);
}
console.log('done');
