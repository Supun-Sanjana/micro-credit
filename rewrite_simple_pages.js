const fs = require('fs');

// BRANCHES
let f = 'app/app/(dashboard)/branches/page.tsx';
let c = fs.readFileSync(f, 'utf8');
c = c.replace('import { useState, useEffect } from "react"', 'import { useState } from "react"');
c = c.replace('import Link from "next/link"', 'import Link from "next/link"\nimport { useQuery, useQueryClient } from "@tanstack/react-query"');

let oldB = `export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [search, setSearch] = useState("")

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/branches')
      if (res.ok) setBranches(await res.json())
    } finally { setIsLoading(false) }
  }
  useEffect(() => { fetchData() }, [])`;
let newB = `export default function BranchesPage() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [search, setSearch] = useState("")

  const queryClient = useQueryClient()
  const { data: branchesRes, isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => (await fetch('/api/branches')).json(),
    staleTime: 600000
  })
  const branches: Branch[] = branchesRes?.data || branchesRes || []`;
c = c.replace(oldB, newB);
c = c.replace('onSuccess={fetchData}', 'onSuccess={() => queryClient.invalidateQueries({ queryKey: [\'branches\'] })}');
fs.writeFileSync(f, c);

// GROUPS
f = 'app/app/(dashboard)/groups/page.tsx';
c = fs.readFileSync(f, 'utf8');
c = c.replace('import { useState, useEffect } from "react"', 'import { useState } from "react"');
c = c.replace('import Link from "next/link"', 'import Link from "next/link"\nimport { useQuery, useQueryClient } from "@tanstack/react-query"');
let oldG = `export default function GroupsPage() {
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
  useEffect(() => { fetchData() }, [])`;
let newG = `export default function GroupsPage() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [centreFilter, setCentreFilter] = useState("")

  const queryClient = useQueryClient()

  const { data: groupsRes, isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => (await fetch('/api/groups')).json()
  })
  const groups = groupsRes?.data || groupsRes || []

  const { data: centresRes } = useQuery({
    queryKey: ['centres'],
    queryFn: async () => (await fetch('/api/centres')).json(),
    staleTime: 600000
  })
  const centres = centresRes?.data || centresRes || []`;
c = c.replace(oldG, newG);
c = c.replace('onSuccess={fetchData}', 'onSuccess={() => queryClient.invalidateQueries({ queryKey: [\'groups\'] })}');
fs.writeFileSync(f, c);

// LOAN PRODUCTS
f = 'app/app/(dashboard)/loan-products/page.tsx';
c = fs.readFileSync(f, 'utf8');
c = c.replace('import { useState, useEffect } from "react"', 'import { useState, useEffect } from "react"\nimport { useQuery, useQueryClient } from "@tanstack/react-query"');
let oldLP = `export default function LoanProductsPage() {
  const [products, setProducts] = useState<ExtendedLoanProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ExtendedLoanProduct | null>(null)
  const [search, setSearch] = useState("")

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/loan-products')
      if (res.ok) setProducts(await res.json())
    } finally { setIsLoading(false) }
  }
  useEffect(() => { fetchProducts() }, [])`;
let newLP = `export default function LoanProductsPage() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ExtendedLoanProduct | null>(null)
  const [search, setSearch] = useState("")

  const queryClient = useQueryClient()
  const { data: productsRes, isLoading } = useQuery({
    queryKey: ['loan-products'],
    queryFn: async () => (await fetch('/api/loan-products')).json(),
    staleTime: 600000
  })
  const products: ExtendedLoanProduct[] = productsRes?.data || productsRes || []`;
c = c.replace(oldLP, newLP);
c = c.replace('onSuccess={fetchProducts}', 'onSuccess={() => queryClient.invalidateQueries({ queryKey: [\'loan-products\'] })}');
c = c.replace('if (res.ok) fetchProducts()', 'if (res.ok) queryClient.invalidateQueries({ queryKey: [\'loan-products\'] })');
fs.writeFileSync(f, c);

console.log('done');
