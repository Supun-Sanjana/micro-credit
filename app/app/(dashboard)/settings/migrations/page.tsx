"use client"

import { useState, useTransition } from "react"
import { Upload, AlertCircle, CheckCircle2, FileText, Database } from "lucide-react"
import { 
  previewMemberMigration, 
  executeMemberMigration, 
  previewLoanMigration, 
  executeLoanMigration 
} from "@/app/actions/migrations"

export default function MigrationsPage() {
  const [activeTab, setActiveTab] = useState<"MEMBERS" | "LOANS">("MEMBERS")
  const [file, setFile] = useState<File | null>(null)
  const [csvText, setCsvText] = useState("")
  const [preview, setPreview] = useState<any>(null)
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<any>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(null)
    setResult(null)

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setCsvText(text)
    }
    reader.readAsText(f)
  }

  const handlePreview = () => {
    if (!csvText) return
    startTransition(async () => {
      try {
        if (activeTab === "MEMBERS") {
          const res = await previewMemberMigration(csvText)
          setPreview(res)
        } else {
          const res = await previewLoanMigration(csvText)
          setPreview(res)
        }
      } catch (err: any) {
        alert("Error previewing: " + err.message)
      }
    })
  }

  const handleExecute = () => {
    if (!preview || preview.valid === 0) return
    startTransition(async () => {
      try {
        const validRows = preview.rows.filter((r: any) => r.valid).map((r: any) => r.data)
        if (activeTab === "MEMBERS") {
          const res = await executeMemberMigration(validRows)
          setResult(res)
        } else {
          const res = await executeLoanMigration(validRows)
          setResult(res)
        }
      } catch (err: any) {
        alert("Execution failed: " + err.message)
      }
    })
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      
      <div className="flex flex-col gap-4">
        <h1 className="text-[32px] leading-[1.3] text-navy-900 font-serif font-normal" style={{ letterSpacing: '-0.66px' }}>
          Data Migrations
        </h1>
        <p className="text-[17px] text-slate-500 leading-[1.35]">
          Bulk import historical data and establish opening accounting balances.
        </p>
      </div>

      <div className="flex gap-4 border-b border-[#ececec] pb-4">
        <button 
          onClick={() => { setActiveTab("MEMBERS"); setFile(null); setPreview(null); setResult(null); setCsvText("") }}
          className={`px-4 py-2 rounded-xl text-[15px] font-medium transition-colors ${activeTab === "MEMBERS" ? "bg-navy-900 text-white" : "text-slate-500 hover:bg-slate-50"}`}
        >
          1. Import Members
        </button>
        <button 
          onClick={() => { setActiveTab("LOANS"); setFile(null); setPreview(null); setResult(null); setCsvText("") }}
          className={`px-4 py-2 rounded-xl text-[15px] font-medium transition-colors ${activeTab === "LOANS" ? "bg-navy-900 text-white" : "text-slate-500 hover:bg-slate-50"}`}
        >
          2. Import Active Loans
        </button>
      </div>

      <div className="bg-white rounded-[24px] border border-[#ececec] p-8 shadow-subtle-1">
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#ececec] rounded-xl p-12 bg-slate-50/30">
          <Database className="w-10 h-10 text-slate-500 mb-4" />
          <h3 className="text-[16px] font-medium text-navy-900 mb-2">Upload {activeTab === "MEMBERS" ? "Members" : "Loans"} CSV</h3>
          <p className="text-[14px] text-slate-500 mb-6 text-center">
            {activeTab === "MEMBERS" 
              ? "Expected columns: name, nic, contact, centreCode, address"
              : "Expected columns: memberNic, productName, loanAmount, outstanding, weeksRemaining, grantedDate"}
          </p>
          <label className="bg-navy-900 text-white px-6 py-3 rounded-xl text-[15px] font-medium cursor-pointer hover:bg-navy-900/90 transition-colors">
            Select CSV File
            <input type="file" accept=".csv" className="hidden" onChange={handleFile} />
          </label>
          {file && <p className="mt-4 text-[14px] font-medium text-navy-900">Selected: {file.name}</p>}
        </div>

        {csvText && !preview && !result && (
          <div className="mt-6 flex justify-end">
            <button 
              onClick={handlePreview}
              disabled={isPending}
              className="bg-navy-900 text-white px-6 py-3 rounded-xl text-[15px] font-medium disabled:opacity-50"
            >
              {isPending ? "Validating..." : "Preview Import"}
            </button>
          </div>
        )}

        {preview && !result && (
          <div className="mt-8 space-y-6">
            <div className="flex gap-4 p-4 rounded-xl border border-border/40 bg-slate-50/30">
              <div className="flex-1">
                <div className="text-[13px] text-slate-500 uppercase tracking-wider mb-1">Total Rows</div>
                <div className="text-[24px] font-medium text-navy-900">{preview.total}</div>
              </div>
              <div className="flex-1">
                <div className="text-[13px] text-slate-500 uppercase tracking-wider mb-1">Valid (Ready)</div>
                <div className="text-[24px] font-medium text-[#137333] flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> {preview.valid}
                </div>
              </div>
              <div className="flex-1">
                <div className="text-[13px] text-slate-500 uppercase tracking-wider mb-1">Errors (Will skip)</div>
                <div className="text-[24px] font-medium text-[#c5221f] flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" /> {preview.errors}
                </div>
              </div>
            </div>

            {preview.errors > 0 && (
              <div className="bg-[#fce8e6] border border-[#f5c6cb] rounded-xl p-4">
                <h4 className="text-[14px] font-medium text-[#c5221f] mb-2">Validation Errors Found:</h4>
                <ul className="text-[13px] text-[#c5221f] space-y-1 list-disc list-inside max-h-40 overflow-y-auto">
                  {preview.rows.filter((r: any) => !r.valid).map((r: any, idx: number) => (
                    <li key={idx}>Row {r.rowNumber}: {r.errors.join(", ")}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-[#ececec]">
              <button 
                onClick={handleExecute}
                disabled={isPending || preview.valid === 0}
                className="bg-navy-900 text-white px-6 py-3 rounded-xl text-[15px] font-medium disabled:opacity-50"
              >
                {isPending ? "Executing..." : `Import ${preview.valid} Valid Rows`}
              </button>
            </div>
          </div>
        )}

        {result && (
          <div className="mt-8 p-6 bg-[#e6f4ea] border border-[#c3e6cb] rounded-xl flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="w-12 h-12 text-[#137333] mb-4" />
            <h3 className="text-[20px] font-medium text-[#137333] mb-2">Import Successful!</h3>
            <p className="text-[15px] text-[#137333]">
              Successfully imported {result.imported} {activeTab === "MEMBERS" ? "members" : "loans"}.
            </p>
            {result.totalValue !== undefined && (
              <p className="text-[15px] font-medium text-[#137333] mt-2">
                Opening Portfolio Balance: LKR {result.totalValue.toLocaleString()}
              </p>
            )}
            <button 
              onClick={() => { setFile(null); setPreview(null); setResult(null); setCsvText("") }}
              className="mt-6 text-[#137333] font-medium hover:underline"
            >
              Start another import
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
