"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"

interface Centre {
  id: string
  name: string
  centreCode: string
}

interface CollectionItem {
  memberId: string
  memberName: string
  memberNumber: string
  groupNumber: number | null
  loanId: string
  scheduleId: string | null
  instalmentNumber: number | null
  scheduledAmount: number
  arrearsBF: number
  totalDue: number
  weeklyRental: number
  outstanding: number
  currentStatus: string
}

type EntryStatus = "FULL" | "PARTIAL" | "NP"

interface CollectionEntry {
  amount: number | ""
  status: EntryStatus
  note: string
}

export default function CollectionPage() {
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"))
  const [selectedCentre, setSelectedCentre] = useState<string>("")
  const [centres, setCentres] = useState<Centre[]>([])
  const [dueList, setDueList] = useState<CollectionItem[]>([])
  const [collections, setCollections] = useState<Record<string, CollectionEntry>>({})
  const [isLoadingCentres, setIsLoadingCentres] = useState(true)
  const [isLoadingDueList, setIsLoadingDueList] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetch("/api/centres")
      .then(res => res.json())
      .then(data => {
        setCentres(data)
        if (data.length > 0) {
          setSelectedCentre(data[0].id)
        }
      })
      .finally(() => setIsLoadingCentres(false))
  }, [])

  const fetchDueList = () => {
    if (!selectedCentre) return
    setIsLoadingDueList(true)
    fetch(`/api/collection?centreId=${selectedCentre}&date=${selectedDate}`)
      .then(res => res.json())
      .then((data: CollectionItem[]) => {
        setDueList(data)
        const initialCollections: Record<string, CollectionEntry> = {}
        data.forEach(item => {
          initialCollections[item.loanId] = {
            amount: item.totalDue,
            status: "FULL",
            note: ""
          }
        })
        setCollections(initialCollections)
      })
      .catch(err => {
        console.error(err)
        alert("Failed to fetch due list")
      })
      .finally(() => setIsLoadingDueList(false))
  }

  useEffect(() => {
    if (selectedCentre && selectedDate) {
      fetchDueList()
    }
  }, [selectedCentre, selectedDate])

  const handleAmountChange = (loanId: string, val: string) => {
    setCollections(prev => ({
      ...prev,
      [loanId]: { 
        ...prev[loanId], 
        amount: val === "" ? "" : Number(val),
        status: "PARTIAL"
      }
    }))
  }

  const handleStatusChange = (loanId: string, status: EntryStatus, totalDue: number) => {
    setCollections(prev => {
      if (status === "FULL") {
        return { ...prev, [loanId]: { amount: totalDue, status: "FULL", note: "" } }
      } else if (status === "NP") {
        return { ...prev, [loanId]: { amount: 0, status: "NP", note: "NP" } }
      } else {
        return { ...prev, [loanId]: { ...prev[loanId], status: "PARTIAL" } }
      }
    })
  }

  const markAllFullPay = () => {
    setCollections(prev => {
      const next = { ...prev }
      dueList.forEach(item => {
        next[item.loanId] = {
          amount: item.totalDue,
          status: "FULL",
          note: ""
        }
      })
      return next
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    const entries = dueList.map(item => {
      const col = collections[item.loanId]
      return {
        loanId: item.loanId,
        scheduleId: item.scheduleId,
        instalmentNumber: item.instalmentNumber,
        amount: col.amount === "" ? 0 : col.amount,
        status: col.status,
        note: col.note
      }
    })

    try {
      const res = await fetch("/api/collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          centreId: selectedCentre,
          entries
        })
      })

      if (!res.ok) {
        throw new Error("Save failed")
      }

      alert("Saved successfully!")
      fetchDueList()
    } catch (error) {
      console.error(error)
      alert("Failed to save")
    } finally {
      setIsSaving(false)
    }
  }

  const totalExpected = dueList.reduce((sum, item) => sum + item.totalDue, 0)
  const totalCollected = Object.values(collections).reduce((sum, col) => {
    if (col.status !== "NP" && typeof col.amount === "number") {
      return sum + col.amount
    }
    return sum
  }, 0)
  const shortfall = totalExpected - totalCollected
  const percentComplete = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0

  const groupedList = dueList.reduce((acc, item) => {
    const groupName = item.groupNumber ? `Group ${item.groupNumber}` : "Ungrouped"
    if (!acc[groupName]) acc[groupName] = []
    acc[groupName].push(item)
    return acc
  }, {} as Record<string, CollectionItem[]>)

  return (
    <div className="flex flex-col gap-[80px]">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div className="flex flex-col gap-4">
          <h1 
            className="text-[44px] leading-[1.3] text-ink-black font-serif font-normal"
            style={{ letterSpacing: '-0.66px' }}
          >
            Daily Collection
          </h1>
          <p className="text-[17px] text-slate-gray max-w-[600px] leading-[1.35]">
            Record center cash collections for the day.
          </p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving || dueList.length === 0}
          className="flex items-center justify-center bg-ink-black text-paper-white rounded-full px-[20px] py-[14px] text-[16px] font-sans transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Bulk Save"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-[80px]">
        
        <div className="lg:col-span-4 h-fit flex flex-col gap-8">
          <div className="bg-paper-white rounded-[20px] shadow-subtle-3 p-[32px]">
            <h2 className="text-[20px] font-sans font-medium text-ink-black mb-6">
              Collection Parameters
            </h2>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-[15px] text-ink-black font-sans ml-1">Date</label>
                <input 
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="bg-paper-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-ink-black outline-none focus:border-ink-black"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[15px] text-ink-black font-sans ml-1">Centre</label>
                <select 
                  value={selectedCentre}
                  onChange={e => setSelectedCentre(e.target.value)}
                  disabled={isLoadingCentres}
                  className="bg-paper-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-ink-black outline-none focus:border-ink-black appearance-none disabled:opacity-50"
                >
                  {centres.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.centreCode})</option>
                  ))}
                  {centres.length === 0 && !isLoadingCentres && (
                    <option value="" disabled>No centres found</option>
                  )}
                </select>
              </div>
            </div>
          </div>

          {dueList.length > 0 && (
            <div className="bg-mist-gray rounded-[20px] p-[32px] flex flex-col gap-4">
              <h2 className="text-[20px] font-sans font-medium text-ink-black">Summary</h2>
              <div className="flex justify-between items-center text-[16px]">
                <span className="text-slate-gray">Expected</span>
                <span className="text-ink-black font-medium">Rs. {totalExpected.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-[16px]">
                <span className="text-slate-gray">Collected</span>
                <span className="text-[#2e7d32] font-medium">Rs. {totalCollected.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-[16px] border-t border-[#ececec] pt-4">
                <span className="text-slate-gray">Shortfall</span>
                <span className="text-sienna-brown font-medium">Rs. {shortfall.toLocaleString()}</span>
              </div>
              <div className="mt-2 w-full bg-[#ececec] rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-[#2e7d32] h-full transition-all duration-300"
                  style={{ width: `${percentComplete}%` }}
                />
              </div>
              <span className="text-[14px] text-slate-gray text-right">{percentComplete}% Complete</span>
            </div>
          )}
        </div>

        <div className="lg:col-span-8">
          <div className="bg-mist-gray rounded-[24px] p-[32px] md:p-[40px]">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-[26px] font-sans font-medium text-ink-black tracking-[-0.23px]">
                Due List
              </h2>
              {dueList.length > 0 && (
                <button
                  onClick={markAllFullPay}
                  className="text-[14px] text-ink-black font-medium underline underline-offset-4 hover:text-slate-gray"
                >
                  Mark All Full Pay
                </button>
              )}
            </div>

            {isLoadingDueList ? (
              <div className="animate-pulse flex flex-col gap-6">
                {[1,2,3].map(i => (
                  <div key={i} className="h-20 bg-[#ececec] rounded-[16px]" />
                ))}
              </div>
            ) : dueList.length === 0 ? (
              <div className="text-center py-12 text-[15px] text-slate-gray">
                No active loans found for this centre today.
              </div>
            ) : (
              <div className="flex flex-col gap-8">
                {Object.entries(groupedList).map(([groupName, items]) => (
                  <div key={groupName} className="flex flex-col gap-4">
                    <h3 className="text-[18px] font-medium text-ink-black border-b border-[#ececec] pb-2">
                      {groupName}
                    </h3>
                    {items.map((item) => {
                      const loanId = item.loanId
                      const col = collections[loanId] || { amount: "", status: "FULL", note: "" }
                      
                      return (
                        <div key={loanId} className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-border/40 pb-4 last:border-0 last:pb-0 gap-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[18px] font-sans text-ink-black font-medium">{item.memberName}</span>
                            </div>
                            <span className="text-[14px] text-slate-gray font-sans">{item.memberNumber}</span>
                            <div className="text-[15px] font-sans text-ink-black mt-1">
                              Due: LKR {item.totalDue.toLocaleString()}
                              {item.arrearsBF > 0 && (
                                <span className="text-sienna-brown text-[13px] ml-2">
                                  (incl. Arrears: {item.arrearsBF.toLocaleString()})
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <div className="relative">
                              <span className="absolute left-[16px] top-[14px] text-[16px] text-smoke-gray font-sans">Rs</span>
                              <input 
                                type="number"
                                value={col.amount}
                                onChange={(e) => handleAmountChange(loanId, e.target.value)}
                                readOnly={col.status === 'FULL' || col.status === 'NP'}
                                placeholder="0.00"
                                className={`w-[140px] border border-[#ececec] rounded-[16px] pl-[40px] pr-[16px] py-[12px] text-[16px] outline-none transition-colors ${
                                  col.status === 'FULL' ? 'bg-[#e8f5e9] text-[#2e7d32] border-[#a5d6a7]' :
                                  col.status === 'NP' ? 'bg-[#ffebee] text-sienna-brown border-[#ffcdd2]' :
                                  col.status === 'PARTIAL' ? 'bg-[#fff8e1] text-[#f57f17] border-[#ffe082]' :
                                  'bg-paper-white text-ink-black focus:border-ink-black'
                                }`}
                              />
                            </div>

                            <div className="flex bg-paper-white border border-[#ececec] rounded-[16px] p-1 gap-1">
                              <button
                                onClick={() => handleStatusChange(loanId, 'FULL', item.totalDue)}
                                className={`px-3 py-2 rounded-[12px] text-sm font-medium transition-colors ${
                                  col.status === 'FULL' ? 'bg-[#e8f5e9] text-[#2e7d32]' : 'text-slate-gray hover:bg-mist-gray'
                                }`}
                              >
                                FULL
                              </button>
                              <button
                                onClick={() => handleStatusChange(loanId, 'PARTIAL', item.totalDue)}
                                className={`px-3 py-2 rounded-[12px] text-sm font-medium transition-colors ${
                                  col.status === 'PARTIAL' ? 'bg-[#fff8e1] text-[#f57f17]' : 'text-slate-gray hover:bg-mist-gray'
                                }`}
                              >
                                PARTIAL
                              </button>
                              <button
                                onClick={() => handleStatusChange(loanId, 'NP', item.totalDue)}
                                className={`px-3 py-2 rounded-[12px] text-sm font-medium transition-colors ${
                                  col.status === 'NP' ? 'bg-[#ffebee] text-sienna-brown' : 'text-slate-gray hover:bg-mist-gray'
                                }`}
                              >
                                NP
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  )
}
