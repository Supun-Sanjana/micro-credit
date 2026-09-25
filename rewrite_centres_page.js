const fs = require('fs');
const file = 'app/app/(dashboard)/centres/page.tsx';
let c = fs.readFileSync(file, 'utf8');

c = c.replace('import { useState, useEffect }', 'import { useState }');
c = c.replace('import { Search', 'import { useQuery, useQueryClient } from "@tanstack/react-query"\nimport { Search');

const oldComponent = `export default function CentresPage() {
  const [centres, setCentres] = useState<any[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [officers, setOfficers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [branchFilter, setBranchFilter] = useState("")

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [centresRes, branchesRes, usersRes] = await Promise.all([
        fetch('/api/centres'), fetch('/api/branches'), fetch('/api/team')
      ])
      if (centresRes.ok) setCentres(await centresRes.json())
      if (branchesRes.ok) setBranches(await branchesRes.json())
      if (usersRes.ok) {
        const users = await usersRes.json()
        setOfficers(users.filter((u: any) => u.role === "USER" || u.role === "FIELD_OFFICER"))
      }
    } finally { setIsLoading(false) }
  }
  useEffect(() => { fetchData() }, [])`;

const newComponent = `export default function CentresPage() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [branchFilter, setBranchFilter] = useState("")
  const [page, setPage] = useState(1)
  const limit = 50

  const queryClient = useQueryClient()

  const { data: centresRes, isLoading, isFetching } = useQuery({
    queryKey: ['centres', page, limit],
    queryFn: async () => (await fetch(\`/api/centres?page=\${page}&limit=\${limit}\`)).json(),
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
      const users = await (await fetch('/api/team')).json()
      return users.filter((u: any) => u.role === "USER" || u.role === "FIELD_OFFICER")
    },
    staleTime: 600000
  })
  const officers = officersRes || []`;

c = c.replace(oldComponent, newComponent);
c = c.replace('onSuccess={fetchData}', 'onSuccess={() => queryClient.invalidateQueries({ queryKey: [\'centres\'] })}');

// Add pagination
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
      </div>`);

fs.writeFileSync(file, c);
