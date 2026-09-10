"use client"

import { useState } from "react"
import { mockCentres, mockBranches } from "@/lib/mock-data"
import { Centre } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

export default function CentresPage() {
  const [centres, setCentres] = useState<Centre[]>(mockCentres)
  const [formData, setFormData] = useState({ 
    branchId: "", 
    centreNumber: 1, 
    centreCode: "", 
    name: "", 
    isMicro: false 
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newCentre: Centre = {
      id: `ctr_${Date.now()}`,
      branchId: formData.branchId,
      centreNumber: formData.centreNumber,
      centreCode: formData.centreCode,
      name: formData.name,
      isMicro: formData.isMicro,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    setCentres([...centres, newCentre])
    setFormData({ branchId: "", centreNumber: 1, centreCode: "", name: "", isMicro: false })
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Centres</h1>
        <p className="text-gray-500">Manage branch centres.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>New Centre</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="branch">Branch</Label>
                <Select value={formData.branchId} onValueChange={v => setFormData({...formData, branchId: v || ""})}>
                  <SelectTrigger id="branch">
                    <SelectValue placeholder="Select Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockBranches.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name} ({b.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="centreNo">Centre No.</Label>
                <Input id="centreNo" type="number" required placeholder="e.g. 1" value={formData.centreNumber} onChange={e => setFormData({...formData, centreNumber: parseInt(e.target.value)||0})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input id="code" required placeholder="e.g. SA01/001" value={formData.centreCode} onChange={e => setFormData({...formData, centreCode: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" required placeholder="Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              
              <div className="flex items-center space-x-2 pt-2 pb-2">
                <input id="isMicro" type="checkbox" checked={formData.isMicro} onChange={e => setFormData({...formData, isMicro: e.target.checked})} className="w-4 h-4 rounded border-gray-300" />
                <Label htmlFor="isMicro" className="font-normal cursor-pointer">Is Micro Loan Centre</Label>
              </div>
              
              <Button type="submit" className="w-full">Create Centre</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Branch</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {centres.map(c => {
                  const branch = mockBranches.find(b => b.id === c.branchId)
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="text-gray-500">{branch?.name || c.branchId}</TableCell>
                      <TableCell className="font-mono text-sm">{c.centreCode}</TableCell>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>
                        <Badge variant={c.isMicro ? "secondary" : "outline"} className={c.isMicro ? "bg-purple-100 text-purple-800 hover:bg-purple-100" : ""}>
                          {c.isMicro ? 'MICRO' : 'REGULAR'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {centres.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500 py-6">No centres found.</TableCell>
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
