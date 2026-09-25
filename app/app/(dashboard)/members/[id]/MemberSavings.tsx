"use client"

import { useState, useEffect } from "react"
import { getMemberSavingsAccounts, openSavingsAccount, postSavingsTransaction, getSavingsProducts } from "@/app/actions/savings"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

export function MemberSavings({ memberId }: { memberId: string }) {
  const [accounts, setAccounts] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [isOpening, setIsOpening] = useState(false)
  const [newAccProduct, setNewAccProduct] = useState("")
  const [newAccNumber, setNewAccNumber] = useState("")

  const [isTransacting, setIsTransacting] = useState(false)
  const [txAccountId, setTxAccountId] = useState("")
  const [txType, setTxType] = useState<"DEPOSIT" | "WITHDRAWAL">("DEPOSIT")
  const [txAmount, setTxAmount] = useState<number>(0)
  const [txNotes, setTxNotes] = useState("")

  const loadData = async () => {
    setLoading(true)
    const [accs, prods] = await Promise.all([
      getMemberSavingsAccounts(memberId),
      getSavingsProducts()
    ])
    setAccounts(accs)
    setProducts(prods)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [memberId])

  const handleOpenAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAccProduct || !newAccNumber) return
    const res = await openSavingsAccount({
      memberId,
      savingsProductId: newAccProduct,
      accountNumber: newAccNumber
    })
    if (res.error) alert(res.error)
    else {
      setNewAccProduct("")
      setNewAccNumber("")
      setIsOpening(false)
      loadData()
    }
  }

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!txAccountId || txAmount <= 0) return
    const res = await postSavingsTransaction({
      accountId: txAccountId,
      type: txType,
      amount: txAmount,
      notes: txNotes
    })
    if (res.error) alert(res.error)
    else {
      setTxAccountId("")
      setTxAmount(0)
      setTxNotes("")
      setIsTransacting(false)
      loadData()
    }
  }

  if (loading) return <div>Loading savings...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Savings Accounts</h3>
        <Button onClick={() => setIsOpening(!isOpening)} variant="outline">
          {isOpening ? "Cancel" : "Open Account"}
        </Button>
      </div>

      {isOpening && (
        <Card className="bg-gray-50">
          <CardContent className="pt-6">
            <form onSubmit={handleOpenAccount} className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">Product</label>
                <select 
                  className="w-full border rounded p-2"
                  value={newAccProduct}
                  onChange={e => setNewAccProduct(e.target.value)}
                  required
                >
                  <option value="">Select a product</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">Account Number</label>
                <input 
                  type="text" 
                  className="w-full border rounded p-2"
                  value={newAccNumber}
                  onChange={e => setNewAccNumber(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="bg-navy-900 text-white">Create Account</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {isTransacting && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h4 className="font-bold mb-4">Post Transaction</h4>
            <form onSubmit={handleTransaction} className="flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1 block">Account</label>
                  <select 
                    className="w-full border rounded p-2 bg-white"
                    value={txAccountId}
                    onChange={e => setTxAccountId(e.target.value)}
                    required
                  >
                    <option value="">Select an account</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.accountNumber} - {a.product.name} (Bal: {Number(a.balance).toLocaleString()})</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1 block">Type</label>
                  <select 
                    className="w-full border rounded p-2 bg-white"
                    value={txType}
                    onChange={e => setTxType(e.target.value as any)}
                  >
                    <option value="DEPOSIT">Deposit</option>
                    <option value="WITHDRAWAL">Withdrawal</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1 block">Amount</label>
                  <input 
                    type="number"
                    min="1"
                    className="w-full border rounded p-2 bg-white"
                    value={txAmount}
                    onChange={e => setTxAmount(parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1 block">Notes</label>
                  <input 
                    type="text"
                    className="w-full border rounded p-2 bg-white"
                    value={txNotes}
                    onChange={e => setTxNotes(e.target.value)}
                  />
                </div>
                <Button type="submit" className="bg-blue-600 text-white">Process</Button>
                <Button type="button" variant="outline" onClick={() => setIsTransacting(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {accounts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No savings accounts found.</div>
      ) : (
        <div className="space-y-6">
          {accounts.map(acc => (
            <Card key={acc.id}>
              <CardHeader className="flex flex-row justify-between items-center">
                <div>
                  <CardTitle>{acc.product.name} ({acc.accountNumber})</CardTitle>
                  <div className="text-sm text-gray-500 mt-1">Status: <Badge variant="outline">{acc.status}</Badge></div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">LKR {Number(acc.balance).toLocaleString()}</div>
                  <Button variant="link" size="sm" onClick={() => {
                    setTxAccountId(acc.id)
                    setIsTransacting(true)
                  }}>Transact</Button>
                </div>
              </CardHeader>
              <CardContent>
                <h4 className="text-sm font-medium mb-2">Recent Transactions</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {acc.transactions.map((tx: any) => (
                      <TableRow key={tx.id}>
                        <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={tx.type === 'DEPOSIT' || tx.type === 'INTEREST_POSTING' ? 'default' : 'destructive'}>
                            {tx.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{tx.notes || "-"}</TableCell>
                        <TableCell className="text-right font-medium">
                          {tx.type === 'DEPOSIT' || tx.type === 'INTEREST_POSTING' ? "+" : "-"}
                          LKR {Number(tx.amount).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                    {acc.transactions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-gray-500">No transactions yet.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
