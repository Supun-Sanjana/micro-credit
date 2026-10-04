"use server";

import { Resend } from "resend";
import { headers } from "next/headers";
import { checkMemoryRateLimit } from "@/lib/rate-limit";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function submitContactForm(formData: FormData) {
  try {
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || "unknown";
    checkMemoryRateLimit(`contact-${ip}`, 5, 10);
  } catch (error: any) {
    return { error: error.message };
  }

  const name = formData.get("name") as string;
  const org = formData.get("org") as string;
  const email = formData.get("email") as string;
  const message = formData.get("message") as string;

  if (!name || !org || !email || !message) {
    return { error: "All fields are required" };
  }

  try {
    const data = await resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL || 'onboarding@resend.dev',
      to: [process.env.CONTACT_NOTIFICATION_EMAIL || 'admin@solida.com'],
      subject: `New Walkthrough Request: ${name} (${org})`,
      replyTo: email,
      text: `New Walkthrough Request

Name: ${name}
Institution: ${org}
Email: ${email}

How they collect today:
${message}
`,
    });

    return { success: true, data };
  } catch (error: any) {
    console.error("Failed to send email:", error);
    return { error: error.message || "Failed to send email" };
  }
}