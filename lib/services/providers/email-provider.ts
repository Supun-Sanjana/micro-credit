import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    await resend.emails.send({
      from: 'Solida MFI <notifications@solidamfi.com>',
      to,
      subject,
      html,
    })
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
