import { getChartOfAccounts, getJournalEntries, getTrialBalance, createAccount } from "@/app/actions/accounting";
import { Prisma } from "@prisma/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { format } from "date-fns";
import { revalidatePath } from "next/cache";

export default async function AccountingPage({
  searchParams,
}: {
  searchParams: Promise<{ asOfDate?: string; startDate?: string; endDate?: string }>;
}) {
  const params = await searchParams;
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const asOfDate = params?.asOfDate ? new Date(params.asOfDate) : today;
  const startDate = params?.startDate ? new Date(params.startDate) : startOfMonth;
  const endDate = params?.endDate ? new Date(params.endDate) : endOfMonth;

  const chartOfAccounts = await getChartOfAccounts();
  const journalEntries = await getJournalEntries(startDate, endDate);
  const trialBalance = await getTrialBalance(asOfDate);

  // Calculate Trial Balance grand totals using Prisma.Decimal as requested
  const totalDebit = trialBalance.reduce(
    (acc, row) => acc.add(new Prisma.Decimal(row.debit)),
    new Prisma.Decimal(0)
  );
  const totalCredit = trialBalance.reduce(
    (acc, row) => acc.add(new Prisma.Decimal(row.credit)),
    new Prisma.Decimal(0)
  );

  async function handleCreateAccount(formData: FormData) {
    "use server";
    const code = formData.get("code") as string;
    const name = formData.get("name") as string;
    const type = formData.get("type") as "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE";
    
    if (code && name && type) {
      await createAccount({ code, name, type });
      revalidatePath("/app/accounting");
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-serif font-bold tracking-tight">Accounting</h1>
      </div>

      <Tabs defaultValue="chart" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chart">Chart of Accounts</TabsTrigger>
          <TabsTrigger value="journal">Journal</TabsTrigger>
          <TabsTrigger value="trial">Trial Balance</TabsTrigger>
        </TabsList>

        <TabsContent value="chart" className="space-y-4">
          <Card className="rounded-[20px] shadow-subtle-3 bg-white border-none">
            <CardHeader>
              <CardTitle>Create Account</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={handleCreateAccount} className="flex gap-4 items-end">
                <div className="space-y-1 flex-1">
                  <Label htmlFor="code">Code</Label>
                  <Input id="code" name="code" required />
                </div>
                <div className="space-y-1 flex-1">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="space-y-1 flex-1">
                  <Label htmlFor="type">Type</Label>
                  <Select name="type" defaultValue="ASSET">
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ASSET">Asset</SelectItem>
                      <SelectItem value="LIABILITY">Liability</SelectItem>
                      <SelectItem value="EQUITY">Equity</SelectItem>
                      <SelectItem value="INCOME">Income</SelectItem>
                      <SelectItem value="EXPENSE">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit">Create</Button>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-[20px] shadow-subtle-3 bg-white border-none">
            <CardHeader>
              <CardTitle>Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.entries(chartOfAccounts).map(([type, accounts]) => (
                <div key={type} className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">{type}</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accounts.map((acc) => (
                        <TableRow key={acc.id}>
                          <TableCell className="font-medium">{acc.code}</TableCell>
                          <TableCell>{acc.name}</TableCell>
                          <TableCell>{acc.isActive ? "Active" : "Inactive"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="journal" className="space-y-4">
          <Card className="rounded-[20px] shadow-subtle-3 bg-white border-none">
            <CardHeader>
              <CardTitle>Journal Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex gap-4">
                <form className="flex gap-4 items-end">
                  <div className="space-y-1">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input id="startDate" name="startDate" type="date" defaultValue={format(startDate, "yyyy-MM-dd")} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input id="endDate" name="endDate" type="date" defaultValue={format(endDate, "yyyy-MM-dd")} />
                  </div>
                  <Button type="submit" variant="secondary">Filter</Button>
                </form>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Lines</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {journalEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{format(new Date(entry.entryDate), "MMM dd, yyyy")}</TableCell>
                      <TableCell>{entry.reference}</TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {entry.lines.map((line) => (
                            <div key={line.id} className="text-sm flex justify-between gap-4">
                              <span>{line.account.name}</span>
                              <span className="text-muted-foreground">
                                {line.debit !== "0" ? `Dr ${Number(line.debit).toFixed(2)}` : ""}
                                {line.credit !== "0" ? `Cr ${Number(line.credit).toFixed(2)}` : ""}
                              </span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trial" className="space-y-4">
          <Card className="rounded-[20px] shadow-subtle-3 bg-white border-none">
            <CardHeader>
              <CardTitle>Trial Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <form className="flex gap-4 items-end">
                  <div className="space-y-1">
                    <Label htmlFor="asOfDate">As Of Date</Label>
                    <Input id="asOfDate" name="asOfDate" type="date" defaultValue={format(asOfDate, "yyyy-MM-dd")} />
                  </div>
                  <Button type="submit" variant="secondary">Update</Button>
                </form>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trialBalance.map((row) => (
                    <TableRow key={row.code}>
                      <TableCell>{row.code}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell className="text-right">
                        {row.debit !== "0" ? Number(row.debit).toFixed(2) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.credit !== "0" ? Number(row.credit).toFixed(2) : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold border-t-2">
                    <TableCell colSpan={2}>Grand Total</TableCell>
                    <TableCell className="text-right">{totalDebit.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{totalCredit.toFixed(2)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
