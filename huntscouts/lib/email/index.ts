import { Resend } from 'resend'

const FROM = 'HuntScouts <notifications@huntscouts.com>'
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
