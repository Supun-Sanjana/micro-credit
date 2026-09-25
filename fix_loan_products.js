const fs = require('fs');
let p = fs.readFileSync('app/app/(dashboard)/loan-products/page.tsx', 'utf8');

if (!p.includes('useQueryClient')) {
    p = p.replace('import { useState, useEffect } from "react"', 'import { useState, useEffect } from "react"\nimport { useQuery, useQueryClient } from "@tanstack/react-query"');
}

const lpOld = `export default function LoanProductsPage() {
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
  useEffect(() => { fetchProducts() }, [])

  const filtered = products.filter(p => {`;

const lpNew = `export default function LoanProductsPage() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ExtendedLoanProduct | null>(null)
  const [search, setSearch] = useState("")

  const queryClient = useQueryClient()
  const { data: productsRes, isLoading } = useQuery({ queryKey: ['loan-products'], queryFn: async () => (await fetch('/api/loan-products')).json(), staleTime: 600000 })
  const products: ExtendedLoanProduct[] = productsRes?.data || productsRes || []

  const filtered = products.filter((p: any) => {`;

p = p.replace(lpOld, lpNew);
p = p.replace('onSuccess={fetchProducts}', 'onSuccess={() => queryClient.invalidateQueries({ queryKey: [\'loan-products\'] })}');
p = p.replace(/if \(res\.ok\) fetchProducts\(\)/g, 'if (res.ok) queryClient.invalidateQueries({ queryKey: [\'loan-products\'] })');
p = p.replace(/filtered.map\(p =>/g, 'filtered.map((p: any) =>');
fs.writeFileSync('app/app/(dashboard)/loan-products/page.tsx', p);
console.log('done');
