/**
 * Client comms moved onto the Contacts page as a tab, so one nav entry
 * covers everything about the people a firm deals with. This keeps any
 * bookmarked or linked /comms URL working.
 */
import { redirect } from 'next/navigation'

export default function CommsRedirectPage(): never {
  redirect('/contacts?tab=comms')
}
