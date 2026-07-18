import { Resend } from 'resend'

const FROM = 'HuntScouts <notifications@huntscouts.com>'
const SCOUT_FROM = 'Scout AI <scout@huntscouts.com>'
function getResend() { return new Resend(process.env.RESEND_API_KEY) }

export async function sendBookingRequest({
  outfitterEmail, outfitterName, hunterName, listingTitle, startDate, endDate, partySize, bookingId,
}: {
  outfitterEmail: string; outfitterName: string; hunterName: string
  listingTitle: string; startDate: string; endDate: string; partySize: number; bookingId: string
}) {
  await getResend().emails.send({
    from: FROM,
    to: outfitterEmail,
    subject: `New booking request: ${listingTitle}`,
    html: `
      <p>Hi ${outfitterName},</p>
      <p><strong>${hunterName}</strong> has requested to book <strong>${listingTitle}</strong>.</p>
      <ul>
        <li>Dates: ${startDate} – ${endDate}</li>
        <li>Party size: ${partySize}</li>
      </ul>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/outfitter/bookings">Review and respond to this request →</a></p>
      <p>You have 48 hours to respond.</p>
      <p>— HuntScouts</p>
    `,
  })
}

export async function sendBookingRequestConfirmation({
  hunterEmail, hunterName, listingTitle, startDate, endDate,
}: {
  hunterEmail: string; hunterName: string; listingTitle: string; startDate: string; endDate: string
}) {
  await getResend().emails.send({
    from: FROM,
    to: hunterEmail,
    subject: `Booking request sent — ${listingTitle}`,
    html: `
      <p>Hi ${hunterName},</p>
      <p>Your booking request for <strong>${listingTitle}</strong> has been sent.</p>
      <ul>
        <li>Dates: ${startDate} – ${endDate}</li>
      </ul>
      <p>The outfitter will respond within 48 hours. We'll email you when they do.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bookings">View your bookings →</a></p>
      <p>— HuntScouts</p>
    `,
  })
}

export async function sendBookingConfirmed({
  hunterEmail, hunterName, listingTitle, startDate, endDate, depositAmount, paymentUrl,
}: {
  hunterEmail: string; hunterName: string; listingTitle: string
  startDate: string; endDate: string; depositAmount: number | null; paymentUrl: string | null
}) {
  await getResend().emails.send({
    from: FROM,
    to: hunterEmail,
    subject: `Your hunt is confirmed! ${listingTitle}`,
    html: `
      <p>Hi ${hunterName},</p>
      <p>Great news — your booking for <strong>${listingTitle}</strong> has been confirmed!</p>
      <ul>
        <li>Dates: ${startDate} – ${endDate}</li>
        ${depositAmount ? `<li>Deposit due: $${depositAmount.toLocaleString()}</li>` : ''}
      </ul>
      ${paymentUrl ? `<p><a href="${paymentUrl}"><strong>Pay deposit to secure your spot →</strong></a></p>` : ''}
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bookings">View your bookings →</a></p>
      <p>— HuntScouts</p>
    `,
  })
}

export async function sendBookingDeclined({
  hunterEmail, hunterName, listingTitle,
}: {
  hunterEmail: string; hunterName: string; listingTitle: string
}) {
  await getResend().emails.send({
    from: FROM,
    to: hunterEmail,
    subject: `Booking request update — ${listingTitle}`,
    html: `
      <p>Hi ${hunterName},</p>
      <p>Unfortunately, the outfitter was unable to accommodate your booking request for <strong>${listingTitle}</strong>.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/listings">Browse other available hunts →</a></p>
      <p>— HuntScouts</p>
    `,
  })
}

export async function sendDepositConfirmed({
  hunterEmail, outfitterEmail, hunterName, outfitterName, listingTitle, startDate, endDate,
}: {
  hunterEmail: string; outfitterEmail: string; hunterName: string; outfitterName: string
  listingTitle: string; startDate: string; endDate: string
}) {
  await Promise.all([
    getResend().emails.send({
      from: FROM,
      to: hunterEmail,
      subject: `Deposit received — you're locked in! ${listingTitle}`,
      html: `
        <p>Hi ${hunterName},</p>
        <p>Your deposit has been received. Your spot for <strong>${listingTitle}</strong> is secured!</p>
        <ul><li>Dates: ${startDate} – ${endDate}</li></ul>
        <p>The outfitter will reach out with detailed preparation info.</p>
        <p>— HuntScouts</p>
      `,
    }),
    getResend().emails.send({
      from: FROM,
      to: outfitterEmail,
      subject: `Deposit received for ${listingTitle}`,
      html: `
        <p>Hi ${outfitterName},</p>
        <p><strong>${hunterName}</strong> has paid their deposit for <strong>${listingTitle}</strong> (${startDate} – ${endDate}).</p>
        <p>This booking is now fully confirmed.</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/outfitter/bookings">View your bookings →</a></p>
        <p>— HuntScouts</p>
      `,
    }),
  ])
}

export async function sendReviewRequest({
  hunterEmail, hunterName, listingTitle, listingId, bookingId,
}: {
  hunterEmail: string; hunterName: string; listingTitle: string; listingId: string; bookingId: string
}) {
  await getResend().emails.send({
    from: FROM,
    to: hunterEmail,
    subject: `How was your hunt? Leave a review for ${listingTitle}`,
    html: `
      <p>Hi ${hunterName},</p>
      <p>We hope your hunt was incredible! How was <strong>${listingTitle}</strong>?</p>
      <p>Your review helps other hunters find great outfitters.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/listings/${listingId}/review?booking=${bookingId}"><strong>Leave a review (takes 1 minute) →</strong></a></p>
      <p>— HuntScouts</p>
    `,
  })
}

function unsubscribeFooter(userId: string) {
  return `<p style="margin-top:32px;font-size:12px;color:#999;text-align:center">
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/api/email/unsubscribe?uid=${userId}" style="color:#999">Unsubscribe</a>
  </p>`
}

function emailWrapper(content: string) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f0;font-family:system-ui,sans-serif">
    <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;padding:40px;box-sizing:border-box">
      <div style="color:#1B4332;font-size:20px;font-weight:900;letter-spacing:-0.5px;margin-bottom:32px">HuntScouts</div>
      ${content}
    </div>
  </body></html>`
}

export async function sendWelcomeEmail({
  to, name, userId,
}: { to: string; name: string; userId: string }) {
  if (!process.env.RESEND_API_KEY) { console.warn('RESEND_API_KEY not set — skipping welcome email'); return }

  await getResend().emails.send({
    from: SCOUT_FROM,
    to,
    subject: 'Your AI Draw Strategy (And a warning about your points)',
    html: emailWrapper(`
      <p style="color:#333;font-size:16px;line-height:1.6">Hi ${name},</p>
      <p style="color:#333;font-size:16px;line-height:1.6">You just joined HuntScouts — here's the thing most hunters get wrong about preference points:</p>
      <p style="background:#f0f7f4;border-left:4px solid #1B4332;padding:16px 20px;border-radius:6px;color:#1B4332;font-size:16px;font-weight:700;line-height:1.5">
        Most hunters wait too long. Point creep is real — units that required 4 points in 2018 require 9 in 2026.
      </p>
      <p style="color:#333;font-size:16px;line-height:1.6">Scout AI analyzes your specific point total against 15+ years of draw data to tell you exactly which units are still reachable — and which ones have become a dead zone.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/account" style="display:inline-block;background:#1B4332;color:#fff;font-size:15px;font-weight:700;padding:14px 28px;border-radius:8px;text-decoration:none">
          Build your Scout profile →
        </a>
      </div>
      <p style="color:#888;font-size:14px;text-align:center;margin-top:-16px">It takes 2 minutes and unlocks your personalized draw strategy.</p>
      ${unsubscribeFooter(userId)}
    `),
  })
}

export async function sendNurtureDay3({
  to, name, userId,
}: { to: string; name: string; userId: string }) {
  if (!process.env.RESEND_API_KEY) { console.warn('RESEND_API_KEY not set — skipping nurture day 3 email'); return }

  await getResend().emails.send({
    from: SCOUT_FROM,
    to,
    subject: "The 'Unsuccessful' backup plan you don't have to stress about",
    html: emailWrapper(`
      <p style="color:#333;font-size:16px;line-height:1.6">Hi ${name},</p>
      <p style="color:#333;font-size:16px;line-height:1.6">Most hunters who don't draw their tag spend the season watching YouTube hunts. Here's a better plan:</p>
      <p style="color:#333;font-size:16px;line-height:1.6">HuntScouts has private land trespass fee hunts — no outfitter, no broker markup, no draw required. You pay the landowner directly for access to their property.</p>
      <ul style="color:#333;font-size:16px;line-height:2;padding-left:20px">
        <li>No draw application required</li>
        <li>Often 50–70% cheaper than guided hunts</li>
        <li>Book directly — no agency taking 15%</li>
      </ul>
      <div style="text-align:center;margin:32px 0">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/listings?listing_type=trespass_fee" style="display:inline-block;background:#1B4332;color:#fff;font-size:15px;font-weight:700;padding:14px 28px;border-radius:8px;text-decoration:none">
          Browse private land hunts →
        </a>
      </div>
      ${unsubscribeFooter(userId)}
    `),
  })
}

export async function sendNurtureDay7({
  to, name, userId,
}: { to: string; name: string; userId: string }) {
  if (!process.env.RESEND_API_KEY) { console.warn('RESEND_API_KEY not set — skipping nurture day 7 email'); return }

  await getResend().emails.send({
    from: SCOUT_FROM,
    to,
    subject: "Vetted ranches are booking up. Here's what's available.",
    html: emailWrapper(`
      <p style="color:#333;font-size:16px;line-height:1.6">Hi ${name},</p>
      <p style="color:#333;font-size:16px;line-height:1.6">A quick update on what's available in the HuntScouts marketplace this week:</p>
      <p style="color:#333;font-size:16px;line-height:1.6">We've been vetting outfitters and landowners across CO, WY, MT, UT, ID, AZ, and NV. Every listing goes through a license verification before going live.</p>
      <p style="background:#f0f7f4;border-left:4px solid #1B4332;padding:16px 20px;border-radius:6px;color:#1B4332;font-size:16px;font-weight:700;line-height:1.5">
        Hunters on HuntScouts save an average of $800 vs. traditional booking agents (no agency fee).
      </p>
      <div style="text-align:center;margin:32px 0">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/listings" style="display:inline-block;background:#1B4332;color:#fff;font-size:15px;font-weight:700;padding:14px 28px;border-radius:8px;text-decoration:none">
          View available hunts →
        </a>
      </div>
      <p style="color:#555;font-size:15px;line-height:1.6;text-align:center">Most outfitters fill their dates 6–8 months out. Don't wait until your draw results come back.</p>
      ${unsubscribeFooter(userId)}
    `),
  })
}

export async function sendDeadlineChangeDetected({
  adminEmail, state, agencyName, pendingCount,
}: {
  adminEmail: string; state: string; agencyName: string; pendingCount: number
}) {
  await getResend().emails.send({
    from: FROM,
    to: adminEmail,
    subject: `Deadline change detected: ${state}`,
    html: `
      <p>The deadline monitor detected a content change on ${agencyName}'s (${state}) deadline page.</p>
      <p><strong>${pendingCount}</strong> row(s) are now pending review.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/deadlines">Review in the admin dashboard →</a></p>
      <p>— Hunt Atlas deadline monitor</p>
    `,
  })
}
