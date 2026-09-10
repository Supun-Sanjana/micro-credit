"use client"

import { useState } from "react"
import { mockBranches } from "@/lib/mock-data"
import { Branch } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>(mockBranches)
  const [formData, setFormData] = useState({ code: "", name: "", address: "" })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newBranch: Branch = {
      id: `br_${Date.now()}`,
      code: formData.code,
      name: formData.name,
      address: formData.address,
      organizationId: "org_1",
      createdAt: new Date(),
      updatedAt: new Date()
    }
    setBranches([...branches, newBranch])
    setFormData({ code: "", name: "", address: "" })
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Branches</h1>
        <p className="text-gray-500">Manage organization branches.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>New Branch</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input id="code" required placeholder="e.g. SA01" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" required placeholder="e.g. GALLE" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" placeholder="123 Main St" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
              <Button type="submit" className="w-full">Create Branch</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branches.map(b => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.code}</TableCell>
                    <TableCell>{b.name}</TableCell>
                    <TableCell className="text-gray-500">{b.address || '-'}</TableCell>
                  </TableRow>
                ))}
                {branches.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-gray-500 py-6">No branches found.</TableCell>
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
