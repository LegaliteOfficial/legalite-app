import { redirect } from 'next/navigation'

/** The firm subscription lives on Account and payment info. */
export default function FirmBillingPage() {
  redirect('/settings/account-info')
}
