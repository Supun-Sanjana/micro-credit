import { getGroup, getAvailableMembers } from "@/app/actions/groups"
import { AddGroupMemberForm } from "./AddGroupMemberForm"
import { GroupMemberRow } from "./GroupMemberRow"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function GroupDetailPage({ params }: { params: Promise<any> }) {
  const { id, repaymentId } = await params;
  try {
    const group = await getGroup(id)
    const availableMembers = await getAvailableMembers(group.centreId, group.id)

    return (
      <div className="flex flex-col gap-8 lg:gap-[48px]">
        {/* Breadcrumb / Hero Section */}
        <div className="flex flex-col gap-4">
          <Link href="/app/groups" className="text-[15px] text-slate-500 hover:text-navy-900 transition-colors w-fit">
            &larr; Back to Groups
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-2">
            <div>
              <h1 
                className="text-[44px] leading-[1.3] text-navy-900 font-serif font-normal flex items-center gap-4"
                style={{ letterSpacing: '-0.66px' }}
              >
                Group {group.groupNumber}: {group.name}
              </h1>
              <p className="text-[17px] text-slate-500 max-w-[600px] leading-[1.35] mt-2">
                Centre: {group.centre.name} {group.centre.branch?.name ? `(${group.centre.branch.name})` : ''}
              </p>
            </div>
            <div className="flex items-center gap-4 bg-white px-[20px] py-[12px] rounded-full shadow-subtle-3 border border-[#ececec]">
              <div className="flex flex-col">
                <span className="text-[12px] text-slate-500 uppercase font-medium">Status</span>
                <span className={`text-[15px] font-medium ${group.status === 'ACTIVE' ? 'text-green-600' : 'text-slate-500'}`}>
                  {group.status}
                </span>
              </div>
              <div className="w-[1px] h-[32px] bg-[#ececec]"></div>
              <div className="flex flex-col">
                <span className="text-[12px] text-slate-500 uppercase font-medium">Schedule</span>
                <span className="text-[15px] font-medium text-navy-900">
                  {group.meetingDay ? `${group.meetingDay} ${group.meetingTime || ''}` : 'Not scheduled'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-[48px]">
          
          {/* Main Area: Group Members Table */}
          <div className="lg:col-span-8">
            <div className="bg-slate-50 rounded-[24px] p-[32px] md:p-[40px]">
              <h2 className="text-[20px] font-sans font-medium text-navy-900 mb-6">
                Group Members ({group.memberships.length})
              </h2>
              
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/40">
                      <th className="pb-4 font-sans text-[15px] text-slate-500 font-normal">Member No.</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-500 font-normal">Name</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-500 font-normal">Contact</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-500 font-normal">Joined</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-500 font-normal">Role</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-500 font-normal">Status</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-500 font-normal">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.memberships.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-[15px] text-slate-500">
                          No members in this group yet.
                        </td>
                      </tr>
                    ) : (
                      group.memberships.map(membership => (
                        <GroupMemberRow key={membership.id} membership={membership} />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar / Form Area: Add Member */}
          <div className="lg:col-span-4 h-fit">
            <AddGroupMemberForm groupId={group.id} availableMembers={availableMembers} />
          </div>

        </div>
      </div>
    )
  } catch (error) {
    notFound()
  }
}



