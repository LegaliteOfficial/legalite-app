'use client'

/**
 * Reusable side-drawer primitive for create/edit forms.
 *
 * Wraps Base UI's Dialog so we get focus management, scroll lock, ESC
 * to close, and click-outside out of the box. Slides in from the right
 * with `tw-animate-css` keyframes; tokens drive every color so this
 * matches the rest of the app without per-call overrides.
 *
 *   <FormDrawer open={isOpen} onOpenChange={setOpen}>
 *     <form onSubmit={onSubmit} className="flex flex-col h-full">
 *       <FormDrawerHeader
 *         title="Open New Case"
 *         description="Fill in the details below."
 *         onClose={closeModal}
 *       />
 *       <FormDrawerBody>
 *         <FormDrawerSection title="Basic info">…</FormDrawerSection>
 *       </FormDrawerBody>
 *       <FormDrawerFooter>
 *         <Button variant="outline" onClick={closeModal}>Cancel</Button>
 *         <Button type="submit">Save</Button>
 *       </FormDrawerFooter>
 *     </form>
 *   </FormDrawer>
 */

import * as React from 'react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { X } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

const SIZE_WIDTH: Record<FormDrawerSize, string> = {
  sm: 'w-[400px]',
  md: 'w-[520px]',
  lg: 'w-[640px]',
  xl: 'w-[760px]',
}

type FormDrawerSize = 'sm' | 'md' | 'lg' | 'xl'

interface FormDrawerProps extends DialogPrimitive.Root.Props {
  /** Drawer width preset. Use `lg` or `xl` for two-column field grids. */
  size?: FormDrawerSize
  /** Optional className override on the popup. Merge-friendly. */
  popupClassName?: string
  children: React.ReactNode
}

/**
 * The drawer root. Renders the backdrop + sliding popup. Children
 * are responsible for the inner layout (typically a flex column with
 * a sticky header, scrolling body, and sticky footer).
 */
export function FormDrawer({
  open,
  onOpenChange,
  size = 'md',
  popupClassName,
  children,
  ...rest
}: FormDrawerProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} {...rest}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className="fixed inset-0 z-40 data-[open]:animate-in data-[open]:fade-in-0 data-[closed]:animate-out data-[closed]:fade-out-0"
          style={{ background: 'rgba(13,27,42,0.24)' }}
        />
        <DialogPrimitive.Popup
          className={cn(
            'fixed top-3 right-3 bottom-3 z-50 flex flex-col outline-none border rounded-2xl overflow-hidden',
            'max-w-[calc(100vw-1.5rem)]',
            'data-[open]:animate-in data-[open]:slide-in-from-right-4',
            'data-[closed]:animate-out data-[closed]:slide-out-to-right-4',
            'duration-300',
            SIZE_WIDTH[size],
            popupClassName,
          )}
          style={{
            background: 'var(--surface-card)',
            borderColor: 'var(--border-soft)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {children}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

// ── Header ─────────────────────────────────────────────────────────────────

interface FormDrawerHeaderProps {
  title: string
  description?: string
  onClose?: () => void
  /** Optional content rendered after the title — useful for a status pill. */
  trailing?: React.ReactNode
}

/**
 * Drawer header with title, optional description, and a close button on
 * the right. The close button is wired to `onClose` rather than the
 * Base UI Close primitive so consumers can run cleanup (form reset, etc.)
 * before the dialog disappears.
 */
export function FormDrawerHeader({
  title,
  description,
  onClose,
  trailing,
}: FormDrawerHeaderProps) {
  return (
    <div
      className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b shrink-0"
      style={{ borderColor: 'var(--border-soft)' }}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2.5">
          <DialogPrimitive.Title
            className="font-heading text-[17px] font-semibold leading-tight tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            {title}
          </DialogPrimitive.Title>
          {trailing}
        </div>
        {description && (
          <p
            className="mt-1 text-[12.5px] leading-relaxed"
            style={{ color: 'var(--text-muted)' }}
          >
            {description}
          </p>
        )}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="shrink-0 p-1.5 rounded-md transition-colors cursor-pointer -mt-0.5 -mr-1"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--surface-sunken)'
            e.currentTarget.style.color = 'var(--text-primary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--text-muted)'
          }}
        >
          <X size={16} strokeWidth={1.75} />
        </button>
      )}
    </div>
  )
}

// ── Body ───────────────────────────────────────────────────────────────────

/** Scrollable form body. Children are typically Sections or raw fields. */
export function FormDrawerBody({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5',
        className,
      )}
    >
      {children}
    </div>
  )
}

// ── Section ────────────────────────────────────────────────────────────────

/**
 * Optional field grouping with a small uppercase header. Use to break
 * long forms into scannable chunks (e.g. "Basic info" / "Schedule" /
 * "Notes") without a heavy visual divider.
 */
export function FormDrawerSection({
  title,
  description,
  children,
  className,
}: {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('space-y-3', className)}>
      {(title || description) && (
        <div>
          {title && (
            <h3
              className="text-[10.5px] font-medium uppercase tracking-[0.12em]"
              style={{ color: 'var(--text-muted)' }}
            >
              {title}
            </h3>
          )}
          {description && (
            <p
              className="mt-1 text-[12px] leading-relaxed"
              style={{ color: 'var(--text-muted)' }}
            >
              {description}
            </p>
          )}
        </div>
      )}
      <div className="space-y-3">{children}</div>
    </section>
  )
}

// ── Footer ─────────────────────────────────────────────────────────────────

interface FormDrawerFooterProps {
  children: React.ReactNode
  /** When true, justifies children with `space-between` instead of `flex-end`.
   *  Useful for a Delete button on the left + Save/Cancel on the right. */
  split?: boolean
}

/**
 * Sticky footer for action buttons. Sits at the bottom of the flex
 * column, has a subtle background tint to separate from the body.
 */
export function FormDrawerFooter({ children, split }: FormDrawerFooterProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-6 py-3.5 border-t shrink-0',
        split ? 'justify-between' : 'justify-end',
      )}
      style={{
        borderColor: 'var(--border-soft)',
        background: 'var(--surface-sunken)',
      }}
    >
      {children}
    </div>
  )
}
