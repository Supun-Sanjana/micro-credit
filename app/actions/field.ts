"use server"

import { getScopedDal } from "@/lib/dal"
import { revalidatePath } from "next/cache"

export async function logFieldCheckIn(centreId: string, latitude: number, longitude: number, accuracy: number | null) {
  const dal = await getScopedDal()
  
  await dal.prisma.fieldCheckIn.create({
    data: {
      organizationId: dal.organizationId,
      officerId: dal.userId,
      centreId,
      latitude,
      longitude,
      accuracy
    }
  })

  revalidatePath(`/app/field/centres/${centreId}`)
  return { success: true }
}
