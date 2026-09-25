const fs = require('fs');

function convertPage(file, queryKeyName, apiEndpoint, isPaginated) {
  let c = fs.readFileSync(file, 'utf8');
  
  if (c.includes('useQuery')) return; // already done
  
  c = c.replace('import { useState, useEffect }', 'import { useState, useEffect }\nimport { useQuery, useQueryClient } from "@tanstack/react-query"');
  
  // replace fetch with useQuery
  // First, find the function name and state hooks
  const functionRegex = /export default function (\w+)\(\) \{([\s\S]*?)return \(/;
  const match = c.match(functionRegex);
  if (!match) return;
  
  const funcBody = match[2];
  
  let newBody = funcBody;
  
  if (file.includes('centres')) {
    newBody = newBody.replace(/const \[centres, setCentres\] = useState.*?\n/, '');
    newBody = newBody.replace(/const \[isLoading, setIsLoading\] = useState\(true\)\n/, '');
    newBody = newBody.replace(/const fetchData = async \(\) \{[\s\S]*?\}\n  useEffect\(\(\) => \{ fetchData\(\) \}, \[\]\)/, 
    `const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const limit = 50

  const { data: centresRes, isLoading, isFetching } = useQuery({
    queryKey: ['centres', page, limit],
    queryFn: async () => {
      const res = await fetch(\`/api/centres?page=\${page}&limit=\${limit}\`)
      return res.json()
    }
  })
  
  const centres = centresRes?.data || centresRes || []
  const total = centresRes?.meta?.total || centres.length
  const totalPages = centresRes?.meta?.totalPages || 1

  const { data: branchesRes } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => (await fetch('/api/branches')).json(),
    staleTime: 600000
  })
  const branches = branchesRes?.data || branchesRes || []

  const { data: officersRes } = useQuery({
    queryKey: ['team'],
    queryFn: async () => {
      const res = await fetch('/api/team')
      const users = await res.json()
      return users.filter((u: any) => u.role === "USER" || u.role === "FIELD_OFFICER")
    },
    staleTime: 600000
  })
  const officers = officersRes || []
    `);
    
    // Add pagination controls to UI
    c = c.replace(/<\/table>\n\s*<\/div>\n\s*<\/div>/, 
      `</table>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/60 flex items-center justify-between">
          <span className="text-[13px] text-slate-500 flex items-center gap-2">
            Showing {filtered.length} of {total} centres
            {isFetching && <span className="inline-block w-3 h-3 border-2 border-brand-600 border-t-transparent rounded-full animate-spin ml-2"></span>}
          </span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-md border border-gray-200 text-[13px] font-medium text-slate-600 disabled:opacity-50 hover:bg-gray-100">Previous</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5 rounded-md border border-gray-200 text-[13px] font-medium text-slate-600 disabled:opacity-50 hover:bg-gray-100">Next</button>
          </div>
        </div>
      </div>`
    )
    c = c.replace('onSuccess={fetchData}', "onSuccess={() => queryClient.invalidateQueries({ queryKey: ['centres'] })}")
  }
  
  if (file.includes('groups')) {
    newBody = newBody.replace(/const \[groups, setGroups\] = useState.*?\n/, '');
    newBody = newBody.replace(/const \[isLoading, setIsLoading\] = useState\(true\)\n/, '');
    newBody = newBody.replace(/const fetchData = async \(\) \{[\s\S]*?\}\n  useEffect\(\(\) => \{ fetchData\(\) \}, \[\]\)/, 
    `const queryClient = useQueryClient()
  const { data: groupsRes, isLoading, isFetching } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => (await fetch('/api/groups')).json()
  })
  const groups = groupsRes?.data || groupsRes || []

  const { data: centresRes } = useQuery({
    queryKey: ['centres'],
    queryFn: async () => (await fetch('/api/centres')).json(),
    staleTime: 600000
  })
  const centres = centresRes?.data || centresRes || []
    `);
    
    c = c.replace('onSuccess={fetchData}', "onSuccess={() => queryClient.invalidateQueries({ queryKey: ['groups'] })}")
  }
  
  if (file.includes('branches')) {
    newBody = newBody.replace(/const \[branches, setBranches\] = useState.*?\n/, '');
    newBody = newBody.replace(/const \[isLoading, setIsLoading\] = useState\(true\)\n/, '');
    newBody = newBody.replace(/const fetchData = async \(\) \{[\s\S]*?\}\n  useEffect\(\(\) => \{ fetchData\(\) \}, \[\]\)/, 
    `const queryClient = useQueryClient()
  const { data: branchesRes, isLoading, isFetching } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => (await fetch('/api/branches')).json(),
    staleTime: 600000
  })
  const branches = branchesRes?.data || branchesRes || []
    `);
    
    c = c.replace('onSuccess={fetchData}', "onSuccess={() => queryClient.invalidateQueries({ queryKey: ['branches'] })}")
  }
  
  if (file.includes('loan-products')) {
    newBody = newBody.replace(/const \[products, setProducts\] = useState.*?\n/, '');
    newBody = newBody.replace(/const \[isLoading, setIsLoading\] = useState\(true\)\n/, '');
    newBody = newBody.replace(/const fetchProducts = async \(\) \{[\s\S]*?\}\n  useEffect\(\(\) => \{ fetchProducts\(\) \}, \[\]\)/, 
    `const queryClient = useQueryClient()
  const { data: productsRes, isLoading, isFetching } = useQuery({
    queryKey: ['loan-products'],
    queryFn: async () => (await fetch('/api/loan-products')).json(),
    staleTime: 600000
  })
  const products = productsRes?.data || productsRes || []
    `);
    
    c = c.replace('onSuccess={fetchProducts}', "onSuccess={() => queryClient.invalidateQueries({ queryKey: ['loan-products'] })}")
    c = c.replace('if (res.ok) fetchProducts()', "if (res.ok) queryClient.invalidateQueries({ queryKey: ['loan-products'] })")
  }

  c = c.replace(funcBody, newBody);
  fs.writeFileSync(file, c);
}

convertPage('app/app/(dashboard)/centres/page.tsx')
convertPage('app/app/(dashboard)/groups/page.tsx')
convertPage('app/app/(dashboard)/branches/page.tsx')
convertPage('app/app/(dashboard)/loan-products/page.tsx')

console.log('Pages converted');
