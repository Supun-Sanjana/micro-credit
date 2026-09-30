import { NextResponse } from "next/server"
import { getNotifications } from "@/app/actions/notifications"

export async function GET() {
  try {
    const data = await getNotifications()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Failed to fetch notifications:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to fetch notifications", notifications: [] },
      { status: 500 }
    )
  }
}
