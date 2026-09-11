import { prisma } from '../lib/prisma';

export interface SendEmailInput {
  to: string;
  subject: string;
  body: string;
  projectId?: string;
}

/**
 * Email service stub.
 *
 * In development this logs the email to the console and records an EmailLog
 * row. Swap the implementation with Nodemailer / SendGrid for production by
 * replacing the body of `deliver`.
 */
async function deliver(input: SendEmailInput): Promise<void> {
  // eslint-disable-next-line no-console
  console.log(`[email] -> ${input.to} | ${input.subject}\n${input.body}\n`);
}

export async function sendEmail(input: SendEmailInput): Promise<boolean> {
  try {
    await deliver(input);
    await prisma.emailLog.create({
      data: {
        projectId: input.projectId ?? null,
        recipient: input.to,
        subject: input.subject,
        status: 'SENT',
      },
    });
    return true;
  } catch (err) {
    await prisma.emailLog.create({
      data: {
        projectId: input.projectId ?? null,
        recipient: input.to,
        subject: input.subject,
        status: 'FAILED',
        error: err instanceof Error ? err.message : String(err),
      },
    });
    return false;
  }
}

export function orderConfirmationEmail(
  email: string,
  projectId: string,
  fileName: string,
  cost: number
): SendEmailInput {
  return {
    to: email,
    projectId,
    subject: `Remaker.work — Order received (${fileName})`,
    body:
      `Thank you for your order!\n\n` +
      `Project: ${projectId}\n` +
      `File: ${fileName}\n` +
      `Estimated cost: ${cost} THB\n\n` +
      `We will update you as your print progresses.`,
  };
}
