import { Resend } from "resend";
export const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
export const resendFrom = process.env.RESEND_FROM_EMAIL ?? "Northstar Loop <notifications@example.com>";
