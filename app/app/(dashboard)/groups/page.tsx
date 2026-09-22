import { getGroups, getCentresForOrg } from "@/app/actions/groups"
import { CreateGroupForm } from "./CreateGroupForm"
import Link from "next/link"

export default async function GroupsPage() {
  const [groups, centres] = await Promise.all([
    getGroups(),
    getCentresForOrg()
  ])

  return (
    <div className="flex flex-col gap-8 lg:gap-[48px]">
      <div className="flex flex-col gap-4">
        <h1 
          className="text-[44px] leading-[1.3] text-ink-black font-serif font-normal"
          style={{ letterSpacing: '-0.66px' }}
        >
          Groups Directory
        </h1>
        <p className="text-[17px] text-slate-gray max-w-[600px] leading-[1.35]">
          Manage member groups across all operational centres.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-[48px]">
        
        {/* Left column: Create Form */}
        <div className="lg:col-span-4 h-fit">
          <CreateGroupForm centres={centres} />
        </div>

        {/* Right column: List of groups */}
        <div className="lg:col-span-8">
          <div className="bg-mist-gray rounded-[24px] p-[32px] md:p-[40px]">
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/40">
                    <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal">Group No.</th>
                    <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal">Name</th>
                    <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal">Centre</th>
                    <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal">Schedule</th>
                    <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal">Members</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-[15px] text-slate-gray">
                        No groups found. Create one to get started.
                      </td>
                    </tr>
                  ) : (
                    groups.map((group) => (
                      <tr key={group.id} className="border-b border-border/40 last:border-0">
                        <td className="py-5 pr-4">
                          <Link href={`/app/groups/${group.id}`} className="text-[16px] font-sans text-ink-black hover:text-slate-gray transition-colors">
                            Group {group.groupNumber}
                          </Link>
                        </td>
                        <td className="py-5 pr-4 text-[16px] font-sans text-ink-black">
                          {group.name}
                        </td>
                        <td className="py-5 pr-4 text-[16px] font-sans text-slate-gray">
                          {group.centre?.name || '—'}
                        </td>
                        <td className="py-5 pr-4">
                          <span className="text-[14px] font-sans text-ash-gray font-normal">
                            {group.meetingDay ? `${group.meetingDay}${group.meetingTime ? ` at ${group.meetingTime}` : ''}` : '—'}
                          </span>
                        </td>
                        <td className="py-5 pr-4">
                          <span className="text-[14px] font-sans text-ash-gray font-normal">
                            {group.memberships?.length || 0}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
