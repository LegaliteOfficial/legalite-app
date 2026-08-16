/**
 * Admin password reset for a single locked-out user.
 *
 * Passwords live in Supabase Auth (auth.users), so this SETS a new one
 * via the admin API — it never reads the existing hash (you can't, and
 * shouldn't). Use it to get a user back in until a self-serve
 * "forgot password" flow exists.
 *
 * Usage (service key is admin-only — run locally, never commit it):
 *
 *   SUPABASE_URL=https://<project>.supabase.co \
 *   SUPABASE_SERVICE_KEY=<service_role secret> \
 *   node scripts/reset-user-password.mjs user@example.com 'TempPass_123!'
 *
 * Then share the temp password with the user over a secure channel and
 * have them change it.
 */

import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_KEY
const [, , email, newPassword] = process.argv

if (!url || !serviceKey) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY (service_role secret).')
  process.exit(1)
}
if (!email || !newPassword) {
  console.error("Usage: node scripts/reset-user-password.mjs <email> '<newPassword>'")
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

// The admin API lists users rather than looking one up by email, so
// page through and match. Fine for a small user base.
let target = null
for (let page = 1; page <= 20 && !target; page++) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
  if (error) {
    console.error('listUsers failed:', error.message)
    process.exit(1)
  }
  target = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
  if (data.users.length < 200) break
}

if (!target) {
  console.error(`No auth user found with email ${email}.`)
  process.exit(1)
}

const { error } = await supabase.auth.admin.updateUserById(target.id, {
  password: newPassword,
})
if (error) {
  console.error('Password update failed:', error.message)
  process.exit(1)
}

console.log(`Password reset for ${email} (id ${target.id}).`)
