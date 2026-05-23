export async function sendSMS(to: string, body: string): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_FROM_NUMBER

  if (!sid || !token || !from) {
    console.warn('Twilio env vars not set — skipping SMS send')
    return
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`
  const body_params = new URLSearchParams({ To: to, From: from, Body: body })

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body_params.toString(),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Twilio SMS error:', err)
  }
}
