"use client"

import { useState } from "react"
import { mockLoanProducts } from "@/lib/mock-data"
import { LoanProduct } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

// Extended type to support UI requirements before backend is updated
interface ExtendedLoanProduct extends LoanProduct {
  interestType?: "FLAT" | "REDUCING";
  rate?: number;
  docFee?: number;
  insuranceFee?: number;
  penaltyRate?: number;
}

export default function LoanProductsPage() {
  const [products, setProducts] = useState<ExtendedLoanProduct[]>(mockLoanProducts)
  
  const [isEditing, setIsEditing] = useState(false)
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ 
    name: "", 
    loanType: "QUICK" as any, 
    numberOfWeeks: 13,
    interestType: "FLAT" as "FLAT" | "REDUCING",
    rate: 0,
    docFee: 0,
    insuranceFee: 0,
    penaltyRate: 0
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isEditing && currentId) {
      setProducts(products.map(p => p.id === currentId ? {
        ...p,
        ...formData
      } : p))
    } else {
      const newProduct: ExtendedLoanProduct = {
        id: `prod_${Date.now()}`,
        ...formData,
        organizationId: 'mock-org-id', // Just for UI mock
        createdAt: new Date(),
        updatedAt: new Date()
      }
      setProducts([...products, newProduct])
    }
    resetForm()
  }

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure?")) return
    setProducts(products.filter(p => p.id !== id))
  }

  const handleEdit = (product: ExtendedLoanProduct) => {
    setIsEditing(true)
    setCurrentId(product.id)
    setFormData({
      name: product.name,
      loanType: product.loanType,
      numberOfWeeks: product.numberOfWeeks,
      interestType: product.interestType || "FLAT",
      rate: product.rate || 0,
      docFee: product.docFee || 0,
      insuranceFee: product.insuranceFee || 0,
      penaltyRate: product.penaltyRate || 0
    })
  }

  const resetForm = () => {
    setIsEditing(false)
    setCurrentId(null)
    setFormData({ 
      name: "", loanType: "QUICK", numberOfWeeks: 13,
      interestType: "FLAT", rate: 0, docFee: 0, insuranceFee: 0, penaltyRate: 0 
    })
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Loan Products</h1>
        <p className="text-gray-500">Configure loan types, interest rates, and fees.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>{isEditing ? "Edit Product" : "New Product"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input required id="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Quick 13W" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="loanType">Category</Label>
                  <Select value={formData.loanType} onValueChange={v => setFormData({ ...formData, loanType: v as any })}>
                    <SelectTrigger id="loanType"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="QUICK">QUICK</SelectItem>
                      <SelectItem value="BUSINESS">BUSINESS</SelectItem>
                      <SelectItem value="MICRO">MICRO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numberOfWeeks">Weeks</Label>
                  <Input required id="numberOfWeeks" type="number" min="1" value={formData.numberOfWeeks} onChange={e => setFormData({ ...formData, numberOfWeeks: parseInt(e.target.value) || 0 })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-2">
                  <Label htmlFor="interestType">Interest Type</Label>
                  <Select value={formData.interestType} onValueChange={v => setFormData({ ...formData, interestType: v as any })}>
                    <SelectTrigger id="interestType"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FLAT">FLAT</SelectItem>
                      <SelectItem value="REDUCING">REDUCING</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rate">Rate (%)</Label>
                  <Input required id="rate" type="number" step="0.1" value={formData.rate} onChange={e => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>

              <div className="space-y-3 border-t pt-4">
                <Label className="text-gray-500 font-semibold uppercase text-xs">Fees & Penalties</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="docFee" className="text-xs">Doc Fee (LKR)</Label>
                    <Input id="docFee" type="number" value={formData.docFee} onChange={e => setFormData({ ...formData, docFee: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="insuranceFee" className="text-xs">Insurance (LKR)</Label>
                    <Input id="insuranceFee" type="number" value={formData.insuranceFee} onChange={e => setFormData({ ...formData, insuranceFee: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="penaltyRate" className="text-xs">Default Penalty Rate (%)</Label>
                  <Input id="penaltyRate" type="number" step="0.1" value={formData.penaltyRate} onChange={e => setFormData({ ...formData, penaltyRate: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1">
                  {isEditing ? "Update" : "Create"}
                </Button>
                {isEditing && (
                  <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* List */}
        <Card className="lg:col-span-2">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Terms</TableHead>
                  <TableHead>Fees</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                        {product.loanType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500">
                      <div>{product.numberOfWeeks}W</div>
                      <div className="text-xs">{product.rate || 0}% {product.interestType || "FLAT"}</div>
                    </TableCell>
                    <TableCell className="text-gray-500 text-xs">
                      <div>Doc: {product.docFee || 0}</div>
                      <div>Ins: {product.insuranceFee || 0}</div>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(product)} className="text-blue-600 hover:text-blue-900">Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900 hover:bg-red-50">Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {products.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-6">No loan products found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
