import { redirect } from 'next/navigation'

/** The firm calendar is the shared calendar. */
export default function FirmCalendarPage() {
  redirect('/calendar')
}
