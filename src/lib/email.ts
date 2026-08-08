type TaggedMemoryEmail = {
  recipientEmail: string;
  recipientName: string;
  authorName: string;
  memoryId: string;
  memoryText: string;
  idempotencyKey: string;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  })[character]!);
}

export async function sendTaggedMemoryEmail(input: TaggedMemoryEmail) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    console.info('Tagged-memory email skipped because RESEND_API_KEY or EMAIL_FROM is not configured.');
    return { skipped: true } as const;
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://amika.vercel.app').replace(/\/$/, '');
  const preview = input.memoryText.length > 180 ? `${input.memoryText.slice(0, 177)}…` : input.memoryText;
  const safeAuthorName = input.authorName.replace(/[\r\n]+/g, ' ').trim() || 'A friend';
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': input.idempotencyKey,
    },
    body: JSON.stringify({
      from,
      to: [input.recipientEmail],
      subject: `${safeAuthorName} tagged you in an Amika memory`,
      text: `Hi ${input.recipientName},\n\n${safeAuthorName} tagged you in a memory:\n\n“${preview}”\n\nOpen Amika: ${appUrl}/memories\n`,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#20201f;max-width:560px;margin:auto"><h1 style="font-size:24px">You’re part of a memory</h1><p>Hi ${escapeHtml(input.recipientName)},</p><p><strong>${escapeHtml(safeAuthorName)}</strong> tagged you in a memory on Amika.</p><blockquote style="margin:24px 0;padding:16px;background:#f7f2e8;border-radius:12px">${escapeHtml(preview)}</blockquote><p><a href="${appUrl}/memories" style="display:inline-block;background:#20201f;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700">Open the memory</a></p></div>`,
    }),
  });
  if (!response.ok) throw new Error(`Email provider returned ${response.status}`);
  return { skipped: false } as const;
}
