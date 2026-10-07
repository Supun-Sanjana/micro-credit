import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { EXPORT_ENTITIES, createEntityCsvStream } from "@/lib/org-export"
import { logAudit } from "@/lib/audit"
import { AuditAction } from "@prisma/client"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    // Auth Check
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Load User Fresh (to ensure role/status are not stale, and not scoped by dal)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isActive: true, role: true, organizationId: true },
    })

    if (!user || !user.isActive) {
      return NextResponse.json({ error: "Forbidden: Account inactive" }, { status: 403 })
    }

    if (user.role !== "HEAD_OFFICE" && user.role !== "SYSTEM_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Insufficient privileges" }, { status: 403 })
    }

    const organizationId = user.organizationId
    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized: Missing organization" }, { status: 401 })
    }

    // Entity validation
    const entity = req.nextUrl.searchParams.get("entity")
    if (!entity || !EXPORT_ENTITIES[entity]) {
      return NextResponse.json({ error: "Bad Request: Invalid entity" }, { status: 400 })
    }

    // Rate Limiting
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
    const recentExports = await prisma.auditLog.count({
      where: {
        organizationId,
        action: "EXPORT" as AuditAction,
        createdAt: { gte: tenMinutesAgo },
      },
    })

    if (recentExports >= 30) {
      return NextResponse.json({ error: "Too Many Requests" }, { status: 429 })
    }

    // Audit Log before streaming
    try {
      await logAudit({
        dal: { prisma, organizationId, userId: session.user.id },
        action: "EXPORT" as AuditAction,
        entityType: "OrgExport",
        entityId: entity,
        note: "CSV export: " + entity,
      })
    } catch (auditError) {
      console.error("Failed to write audit log for export:", auditError)
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }

    // Stream out CSV
    const stream = createEntityCsvStream(entity, organizationId)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "")
    const filename = `solida-${entity}-${dateStr}.csv`

    const headers = new Headers({
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    })

    return new Response(stream, { headers })
  } catch (error: any) {
    console.error("Export API Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
