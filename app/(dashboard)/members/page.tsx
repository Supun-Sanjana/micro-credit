"use client"

import { useState } from "react"
import { mockMembers, mockCentres } from "@/lib/mock-data"
import { Member } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>(mockMembers)
  
  const [formData, setFormData] = useState({ 
    centreId: "", 
    name: "", 
    nic: "", 
    address: "", 
    contact1: "", 
    groupNumber: "" 
  })

  const [searchTerm, setSearchTerm] = useState("")
  const [filterCentre, setFilterCentre] = useState("ALL")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const centre = mockCentres.find(c => c.id === formData.centreId)
    const newMember: Member = {
      id: `mem_${Date.now()}`,
      memberNumber: `${centre?.centreCode}/${members.length + 1}`.padStart(3, '0'),
      name: formData.name,
      organizationId: 'mock-org-id',
      nic: formData.nic,
      address: formData.address,
      contact1: formData.contact1,
      contact2: null,
      groupNumber: formData.groupNumber ? parseInt(formData.groupNumber) : null,
      centreId: formData.centreId,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setMembers([...members, newMember])
    setFormData({ centreId: "", name: "", nic: "", address: "", contact1: "", groupNumber: "" })
  }

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (m.nic && m.nic.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          m.memberNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCentre = filterCentre === "ALL" || m.centreId === filterCentre
    return matchesSearch && matchesCentre
  })

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Members</h1>
        <p className="text-gray-500">Manage centre members.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Register Member</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="centreId">Centre</Label>
                <Select value={formData.centreId} onValueChange={v => setFormData({...formData, centreId: v || ""})}>
                  <SelectTrigger id="centreId">
                    <SelectValue placeholder="Select Centre" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockCentres.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name} ({c.centreCode})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" required placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nic">NIC</Label>
                <Input id="nic" placeholder="NIC (Optional)" value={formData.nic} onChange={e => setFormData({...formData, nic: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact1">Contact Number</Label>
                <Input id="contact1" placeholder="Contact Number" value={formData.contact1} onChange={e => setFormData({...formData, contact1: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="groupNumber">Group Number</Label>
                <Input id="groupNumber" type="number" min="1" max="6" placeholder="Group Number (1-6)" value={formData.groupNumber} onChange={e => setFormData({...formData, groupNumber: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" placeholder="Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
              <Button type="submit" className="w-full">Register</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardContent className="p-0">
            <div className="p-4 border-b flex flex-col sm:flex-row gap-4 items-center bg-gray-50/50">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input 
                  placeholder="Search by name, NIC, or member no..." 
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterCentre} onValueChange={(v) => setFilterCentre(v || "")}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by Centre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Centres</SelectItem>
                  {mockCentres.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member No.</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>NIC</TableHead>
                  <TableHead>Centre</TableHead>
                  <TableHead>Group</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map(m => {
                  const centre = mockCentres.find(c => c.id === m.centreId)
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="font-mono font-medium text-blue-600">
                        <a href={`/members/${m.id}`} className="hover:underline">{m.memberNumber}</a>
                      </TableCell>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell className="text-gray-500">{m.nic || '-'}</TableCell>
                      <TableCell className="text-gray-500">{centre?.name}</TableCell>
                      <TableCell className="text-gray-500">{m.groupNumber ? `Group ${m.groupNumber}` : '-'}</TableCell>
                    </TableRow>
                  )
                })}
                {filteredMembers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-6">No members found.</TableCell>
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
