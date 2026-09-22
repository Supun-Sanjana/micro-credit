"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { GroupMembershipRole, GroupStatus } from "@prisma/client"

async function getSession() {
  const session = await auth()
  if (!session?.user?.organizationId) throw new Error("Unauthorized")
  return session
}

export async function getGroups(centreId?: string) {
  const session = await getSession()
  const orgId = session.user.organizationId!
  return prisma.group.findMany({
    where: { organizationId: orgId, ...(centreId ? { centreId } : {}) },
    include: {
      centre: { include: { branch: true } },
      memberships: {
        where: { status: "ACTIVE" },
        include: { member: { select: { id: true, name: true, memberNumber: true } } },
      },
    },
    orderBy: [{ centreId: "asc" }, { groupNumber: "asc" }],
  })
}

export async function getGroup(groupId: string) {
  const session = await getSession()
  const orgId = session.user.organizationId!
  const group = await prisma.group.findFirst({
    where: { id: groupId, organizationId: orgId },
    include: {
      centre: { include: { branch: true } },
      memberships: {
        include: { member: { select: { id: true, name: true, memberNumber: true, contact1: true } } },
        orderBy: [{ status: "asc" }, { joinedAt: "asc" }],
      },
    },
  })
  if (!group) throw new Error("Group not found")
  return group
}

export async function createGroup(data: {
  centreId: string
  groupNumber: number
  name: string
  meetingDay?: string
  meetingTime?: string
}) {
  const session = await getSession()
  const orgId = session.user.organizationId!

  const centre = await prisma.centre.findFirst({
    where: { id: data.centreId },
    include: { branch: true },
  })
  if (!centre || centre.branch.organizationId !== orgId) {
    return { error: "Invalid centre" }
  }

  const existing = await prisma.group.findFirst({
    where: { organizationId: orgId, centreId: data.centreId, groupNumber: data.groupNumber },
  })
  if (existing) return { error: `Group number ${data.groupNumber} already exists in this centre` }

  const group = await prisma.group.create({
    data: {
      organizationId: orgId,
      branchId: centre.branchId,
      centreId: centre.id,
      groupNumber: data.groupNumber,
      name: data.name,
      meetingDay: data.meetingDay || null,
      meetingTime: data.meetingTime || null,
    },
  })

  await prisma.auditLog.create({
    data: { organizationId: orgId, userId: session.user.id, action: "CREATE", entityType: "Group", entityId: group.id, after: JSON.stringify(group) },
  })

  revalidatePath("/app/groups")
  return { success: true, group }
}

export async function updateGroup(groupId: string, data: {
  name?: string
  meetingDay?: string
  meetingTime?: string
  status?: GroupStatus
}) {
  const session = await getSession()
  const orgId = session.user.organizationId!

  const group = await prisma.group.findFirst({ where: { id: groupId, organizationId: orgId } })
  if (!group) return { error: "Group not found" }

  const updated = await prisma.group.update({
    where: { id: groupId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.meetingDay !== undefined && { meetingDay: data.meetingDay }),
      ...(data.meetingTime !== undefined && { meetingTime: data.meetingTime }),
      ...(data.status !== undefined && { status: data.status }),
    },
  })

  await prisma.auditLog.create({
    data: { organizationId: orgId, userId: session.user.id, action: "UPDATE", entityType: "Group", entityId: groupId, before: JSON.stringify(group), after: JSON.stringify(updated) },
  })

  revalidatePath("/app/groups")
  revalidatePath(`/app/groups/${groupId}`)
  return { success: true }
}

export async function addGroupMember(groupId: string, memberId: string, role: GroupMembershipRole = "MEMBER") {
  const session = await getSession()
  const orgId = session.user.organizationId!

  const group = await prisma.group.findFirst({ where: { id: groupId, organizationId: orgId } })
  if (!group) return { error: "Group not found" }

  const member = await prisma.member.findFirst({ where: { id: memberId, organizationId: orgId } })
  if (!member) return { error: "Member not found" }

  const existing = await prisma.groupMembership.findFirst({
    where: { groupId, memberId, status: "ACTIVE" },
  })
  if (existing) return { error: "Member is already in this group" }

  const membership = await prisma.groupMembership.create({
    data: { groupId, memberId, role, status: "ACTIVE" },
  })

  await prisma.auditLog.create({
    data: { organizationId: orgId, userId: session.user.id, action: "CREATE", entityType: "GroupMembership", entityId: membership.id, after: JSON.stringify({ groupId, memberId, role }) },
  })

  revalidatePath(`/app/groups/${groupId}`)
  return { success: true }
}

export async function removeGroupMember(membershipId: string) {
  const session = await getSession()
  const orgId = session.user.organizationId!

  const membership = await prisma.groupMembership.findFirst({
    where: { id: membershipId },
    include: { group: true },
  })
  if (!membership || membership.group.organizationId !== orgId) return { error: "Membership not found" }

  await prisma.groupMembership.update({
    where: { id: membershipId },
    data: { status: "LEFT", leftAt: new Date() },
  })

  await prisma.auditLog.create({
    data: { organizationId: orgId, userId: session.user.id, action: "UPDATE", entityType: "GroupMembership", entityId: membershipId, note: "Member removed from group" },
  })

  revalidatePath(`/app/groups/${membership.groupId}`)
  return { success: true }
}

export async function changeGroupMemberRole(membershipId: string, role: GroupMembershipRole) {
  const session = await getSession()
  const orgId = session.user.organizationId!

  const membership = await prisma.groupMembership.findFirst({
    where: { id: membershipId, status: "ACTIVE" },
    include: { group: true },
  })
  if (!membership || membership.group.organizationId !== orgId) return { error: "Membership not found" }

  await prisma.groupMembership.update({
    where: { id: membershipId },
    data: { role },
  })

  revalidatePath(`/app/groups/${membership.groupId}`)
  return { success: true }
}

export async function getAvailableMembers(centreId: string, groupId: string) {
  const session = await getSession()
  const orgId = session.user.organizationId!

  const activeInGroup = await prisma.groupMembership.findMany({
    where: { groupId, status: "ACTIVE" },
    select: { memberId: true },
  })
  const activeMemberIds = activeInGroup.map((m) => m.memberId)

  return prisma.member.findMany({
    where: {
      organizationId: orgId,
      centreId,
      id: { notIn: activeMemberIds },
    },
    select: { id: true, name: true, memberNumber: true },
    orderBy: { memberNumber: "asc" },
  })
}

export async function getCentresForOrg() {
  const session = await getSession()
  const orgId = session.user.organizationId!
  return prisma.centre.findMany({
    where: { branch: { organizationId: orgId } },
    include: { branch: { select: { name: true } } },
    orderBy: [{ branch: { name: "asc" } }, { name: "asc" }],
  })
}
