const fs = require('fs');
let g = fs.readFileSync('app/app/(dashboard)/groups/page.tsx', 'utf8');

if (!g.includes('useQueryClient')) {
    g = g.replace('import { useState, useEffect } from "react"', 'import { useState, useEffect } from "react"\nimport { useQuery, useQueryClient } from "@tanstack/react-query"');
}

const gOld = `export default function GroupsPage() {
  const [groups, setGroups] = useState<any[]>([])
  const [centres, setCentres] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [centreFilter, setCentreFilter] = useState("")

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [gr, cr] = await Promise.all([fetch("/api/groups"), fetch("/api/centres")])
      if (gr.ok) setGroups(await gr.json())
      if (cr.ok) setCentres(await cr.json())
    } finally { setIsLoading(false) }
  }
  useEffect(() => { fetchData() }, [])

  const filtered = groups.filter(g => {`;

const gNew = `export default function GroupsPage() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [centreFilter, setCentreFilter] = useState("")

  const queryClient = useQueryClient()
  const { data: groupsRes, isLoading } = useQuery({ queryKey: ['groups'], queryFn: async () => (await fetch('/api/groups')).json() })
  const groups = groupsRes?.data || groupsRes || []
  
  const { data: centresRes } = useQuery({ queryKey: ['centres'], queryFn: async () => (await fetch('/api/centres')).json(), staleTime: 600000 })
  const centres = centresRes?.data || centresRes || []

  const filtered = groups.filter((g: any) => {`;

g = g.replace(gOld, gNew);
g = g.replace('onSuccess={fetchData}', 'onSuccess={() => queryClient.invalidateQueries({ queryKey: [\'groups\'] })}');
g = g.replace(/centres.map\(c =>/g, 'centres.map((c: any) =>');
g = g.replace(/filtered.map\(g =>/g, 'filtered.map((g: any) =>');
fs.writeFileSync('app/app/(dashboard)/groups/page.tsx', g);
console.log('done');
