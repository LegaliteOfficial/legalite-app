// Deadline push notification utilities

const SW_PATH = '/sw.js'
const STORAGE_KEY = 'll:notifications-enabled'
const NOTIFIED_KEY = 'll:notified-deadlines'

/**
 * Check if notifications are supported and enabled.
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator
}

/**
 * Get the user's notification preference from localStorage.
 */
export function getNotificationPreference(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(STORAGE_KEY) === 'true'
}

/**
 * Save the user's notification preference.
 */
export function setNotificationPreference(enabled: boolean): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, String(enabled))
}

/**
 * Request notification permission and register the service worker.
 * Returns true if permission was granted.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return false

  // Register service worker
  try {
    await navigator.serviceWorker.register(SW_PATH)
  } catch {
    // SW registration failed but we can still use basic notifications
  }

  setNotificationPreference(true)
  return true
}

/**
 * Disable notifications.
 */
export function disableNotifications(): void {
  setNotificationPreference(false)
}

/**
 * Get the set of already-notified deadline IDs to avoid duplicates.
 */
function getNotifiedIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(NOTIFIED_KEY)
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

/**
 * Mark a deadline as notified.
 */
function markNotified(id: string): void {
  const ids = getNotifiedIds()
  ids.add(id)
  // Keep only the last 200 IDs to prevent unbounded growth
  const arr = Array.from(ids).slice(-200)
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify(arr))
}

/**
 * Send a notification for a deadline.
 */
export function notifyDeadline(deadline: {
  id: string
  title: string
  due_date: string
  priority: string
}): void {
  if (!getNotificationPreference()) return
  if (Notification.permission !== 'granted') return

  const notified = getNotifiedIds()
  if (notified.has(deadline.id)) return

  const dueDate = new Date(deadline.due_date)
  const now = new Date()
  const diffMs = dueDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  let urgency = ''
  if (diffDays < 0) urgency = 'OVERDUE'
  else if (diffDays === 0) urgency = 'Due today'
  else if (diffDays === 1) urgency = 'Due tomorrow'
  else urgency = `Due in ${diffDays} days`

  const notification = new Notification('LegaLite — Deadline Reminder', {
    body: `${deadline.title}\n${urgency} (${deadline.priority} priority)`,
    icon: '/favicon.ico',
    tag: `deadline-${deadline.id}`,
    requireInteraction: diffDays <= 1,
  })

  notification.onclick = () => {
    window.focus()
    notification.close()
  }

  markNotified(deadline.id)
}

/**
 * Check all deadlines and send notifications for upcoming ones.
 * Called periodically from the deadline page.
 */
export function checkAndNotifyDeadlines(deadlines: Array<{
  id: string
  title: string
  due_date: string
  priority: string
  status: string
  reminder_days: number | null
}>): void {
  if (!getNotificationPreference()) return
  if (Notification.permission !== 'granted') return

  const now = new Date()

  for (const d of deadlines) {
    if (d.status !== 'Pending') continue

    const dueDate = new Date(d.due_date)
    const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const reminderWindow = d.reminder_days ?? 3

    // Notify if within reminder window or overdue
    if (diffDays <= reminderWindow) {
      notifyDeadline(d)
    }
  }
}
