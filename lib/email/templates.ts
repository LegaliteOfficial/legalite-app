/**
 * Transactional email bodies for the public demo request flow.
 *
 * These are plain template strings rather than a component library so the
 * markup stays inline-styled and table-free where it matters. Email clients
 * (Outlook especially) ignore <style> blocks and most modern CSS, so every
 * rule that matters is set as a style attribute on the element itself.
 *
 * Brand: gold #C9972B on navy #0D1B2A, Literata-style serif headings with a
 * web-safe serif fallback, since custom fonts do not load in most clients.
 */

const GOLD = '#C9972B'
const NAVY = '#0D1B2A'
const SLATE = '#1F2937'

/** Escapes user supplied values so a submitted name cannot inject markup. */
function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export interface DemoRequestDetails {
  name: string
  email: string
  company: string
  phone: string
  message?: string
}

/**
 * Sent to the firm or solo practitioner who submitted the form. Invites them
 * to a session with the LegaLite team, online or in person, and carries the
 * button that starts account setup.
 */
export function prospectEmail(
  details: DemoRequestDetails,
  loginUrl: string,
): { subject: string; html: string; text: string } {
  const firstName = esc(details.name.trim().split(/\s+/)[0] || 'there')
  const firm = esc(details.company)

  const subject = `The LegaLite team would like to meet ${details.company}`

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:${SLATE};font-family:Helvetica,Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      We would like to walk your team through LegaLite, online or in person.
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SLATE};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:14px;overflow:hidden;">

            <tr>
              <td style="background:${NAVY};padding:26px 34px;">
                <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:bold;font-style:italic;color:#FFFFFF;">LegaLite</span>
              </td>
            </tr>
            <tr><td style="height:3px;background:${GOLD};font-size:0;line-height:0;">&nbsp;</td></tr>

            <tr>
              <td style="padding:38px 34px 12px;">
                <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;color:${NAVY};font-weight:600;">
                  We would like to meet ${firm}
                </h1>
              </td>
            </tr>

            <tr>
              <td style="padding:0 34px 8px;">
                <p style="margin:16px 0;font-size:15px;line-height:1.65;color:#3F4855;">
                  Hello ${firstName}, thank you for asking to see LegaLite.
                </p>
                <p style="margin:16px 0;font-size:15px;line-height:1.65;color:#3F4855;">
                  We would like to sit down with your practice, either online or in
                  person at your offices, and walk through how LegaLite fits the way
                  you already work. We are happy to meet your IT team to cover setup,
                  data handling, and security, or to take the whole firm through the
                  day to day: opening cases, managing documents, billing, deadlines,
                  and our legal research assistant.
                </p>
                <p style="margin:16px 0;font-size:15px;line-height:1.65;color:#3F4855;">
                  The goal is simple. By the end of the session your team should know
                  exactly how to use LegaLite to get more done in less time.
                </p>
                <p style="margin:16px 0;font-size:15px;line-height:1.65;color:#3F4855;">
                  Reply to this email with a few dates that suit you and we will
                  confirm. In the meantime you can set up your account below.
                </p>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:14px 34px 6px;">
                <a href="${loginUrl}"
                   style="display:inline-block;background:${GOLD};color:#FFFFFF;text-decoration:none;font-size:15px;font-weight:bold;padding:15px 38px;border-radius:7px;">
                  Log in to the application
                </a>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:6px 34px 30px;">
                <p style="margin:10px 0 0;font-size:12px;line-height:1.6;color:#8A93A0;">
                  You will confirm your firm name and email, then choose a password.
                </p>
              </td>
            </tr>

            <tr><td style="height:1px;background:#E7E9EE;font-size:0;line-height:0;">&nbsp;</td></tr>
            <tr>
              <td style="padding:22px 34px 30px;">
                <p style="margin:0;font-size:12px;line-height:1.7;color:#8A93A0;">
                  Sent because ${esc(details.email)} requested a demo of LegaLite.
                  If that was not you, simply ignore this email and no account will be
                  created.
                </p>
                <p style="margin:12px 0 0;font-size:12px;line-height:1.7;color:#8A93A0;">
                  LegaLite &middot; Accra, Ghana
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

  const text = `We would like to meet ${details.company}

Hello ${details.name.trim().split(/\s+/)[0] || 'there'}, thank you for asking to see LegaLite.

We would like to sit down with your practice, either online or in person at your offices, and walk through how LegaLite fits the way you already work. We are happy to meet your IT team to cover setup, data handling, and security, or to take the whole firm through the day to day: opening cases, managing documents, billing, deadlines, and our legal research assistant.

The goal is simple. By the end of the session your team should know exactly how to use LegaLite to get more done in less time.

Reply to this email with a few dates that suit you and we will confirm. In the meantime you can set up your account here:

${loginUrl}

You will confirm your firm name and email, then choose a password.

Sent because ${details.email} requested a demo of LegaLite. If that was not you, simply ignore this email and no account will be created.

LegaLite, Accra, Ghana`

  return { subject, html, text }
}

/**
 * Sent to the LegaLite team so a new request is visible without checking a
 * dashboard. Plain and scannable on purpose.
 */
export function teamNotificationEmail(details: DemoRequestDetails): {
  subject: string
  html: string
  text: string
} {
  const rows: [string, string][] = [
    ['Name', details.name],
    ['Firm or practice', details.company],
    ['Email', details.email],
    ['Phone', details.phone],
  ]
  if (details.message?.trim()) rows.push(['Message', details.message.trim()])

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#F4F5F7;font-family:Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#FFFFFF;border-radius:12px;">
      <tr>
        <td style="padding:26px 28px 8px;">
          <h2 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:19px;color:${NAVY};">
            New demo request
          </h2>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 28px 26px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${rows
              .map(
                ([label, value]) => `<tr>
              <td style="padding:9px 0;font-size:12px;color:#8A93A0;width:130px;vertical-align:top;text-transform:uppercase;letter-spacing:0.5px;">${esc(label)}</td>
              <td style="padding:9px 0;font-size:14px;color:#1B2430;vertical-align:top;">${esc(value)}</td>
            </tr>`,
              )
              .join('')}
          </table>
          <p style="margin:22px 0 0;font-size:13px;color:#3F4855;">
            Reply directly to this email to reach ${esc(details.name)}.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`

  const text = `New demo request

${rows.map(([l, v]) => `${l}: ${v}`).join('\n')}

Reply directly to this email to reach ${details.name}.`

  return { subject: `New demo request: ${details.company}`, html, text }
}
