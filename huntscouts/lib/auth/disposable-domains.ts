const DISPOSABLE_DOMAINS = [
  'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwaway.email',
  'yopmail.com', 'sharklasers.com', 'guerrillamailblock.com', 'grr.la',
  'guerrillamail.info', 'guerrillamail.biz', 'guerrillamail.de',
  'guerrillamail.net', 'guerrillamail.org', 'spam4.me', 'trashmail.com',
  'trashmail.me', 'trashmail.net', 'maildrop.cc', 'dispostable.com',
  'spamgourmet.com', 'getonemail.com', 'fakeinbox.com', 'mailnull.com',
  'spamevader.com', 'tempr.email', 'discard.email', 'spamhereplease.com',
  'spamoff.de', 'wetrash.com', 'mytemp.email', 'tempinbox.com',
  'emailondeck.com', 'burnermail.io', 'temp-mail.org', 'throwam.com',
  'getnada.com', 'mailtemp.net', 'minute.email', 'meltmail.com',
  'spamfree24.org', 'deadaddress.com', 'mytrashmail.com', 'mailexpire.com',
  'mailscrap.com', 'spamstack.net', 'rejectmail.com', 'spaml.de',
  'temporaryemail.net', 'throwamassage.com', 'binkmail.com',
]

export function isDisposableEmail(email: string): boolean {
  const domain = email.toLowerCase().split('@')[1]
  return !!domain && DISPOSABLE_DOMAINS.includes(domain)
}
