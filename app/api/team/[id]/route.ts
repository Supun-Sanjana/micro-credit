import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import bcrypt from "bcrypt"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: userIdToUpdate } = await params
    const session = await auth()
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const organizationId = (session.user as any)?.organizationId

    const userRole = (session.user as any).role
    if (!organizationId || (userRole !== "SYSTEM_ADMIN" && userRole !== "HEAD_OFFICE")) {
      return NextResponse.json(
        { error: "Unauthorized. Only organization admins can edit team members." },
        { status: 401 }
      )
    }

    const { name, email, password, branchId, role, status } = await req.json()

    // Verify user belongs to same org
    const userToUpdate = await prisma.user.findFirst({
      where: { id: userIdToUpdate, organizationId }
    })

    if (!userToUpdate) {
      return NextResponse.json({ error: "User not found or unauthorized." }, { status: 404 })
    }

    if (email && email !== userToUpdate.email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } })
      if (existingEmail) {
        return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 })
      }
    }

    const dataToUpdate: any = {}
    if (name) dataToUpdate.name = name
    if (email) dataToUpdate.email = email
    
    if (password && password.trim() !== "") {
      dataToUpdate.password = await bcrypt.hash(password, 10)
    }

    if (role) {
      const validRoles = ["SYSTEM_ADMIN", "HEAD_OFFICE", "ACCOUNTANT", "BRANCH_MANAGER", "FIELD_OFFICER"]
      if (validRoles.includes(role)) {
        dataToUpdate.role = role
      }
    }

    if (branchId !== undefined) {
      dataToUpdate.branchId = branchId || null
    }

    if (status !== undefined) {
      dataToUpdate.isActive = status === 'ACTIVE'
    }

    const updatedUser = await prisma.user.update({
      where: { id: userIdToUpdate },
      data: dataToUpdate
    })

    return NextResponse.json({ success: true, user: { id: updatedUser.id } })
  } catch (error: any) {
    console.error("Team update error:", error)
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: userIdToDelete } = await params
    const session = await auth()
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const organizationId = (session.user as any)?.organizationId
    const userRole = (session.user as any).role
    
    if (!organizationId || (userRole !== "SYSTEM_ADMIN" && userRole !== "HEAD_OFFICE")) {
      return NextResponse.json(
        { error: "Unauthorized. Only organization admins can delete team members." },
        { status: 401 }
      )
    }

    // Verify user belongs to same org
    const userToDelete = await prisma.user.findFirst({
      where: { id: userIdToDelete, organizationId }
    })

    if (!userToDelete) {
      return NextResponse.json({ error: "User not found or unauthorized." }, { status: 404 })
    }

    await prisma.user.delete({
      where: { id: userIdToDelete }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Team delete error:", error)
    // If it's a foreign key constraint error from Prisma
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: "Cannot delete user because they are referenced in other records (e.g. loans, collections)." }, 
        { status: 400 }
      )
    }
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 })
  }
}

