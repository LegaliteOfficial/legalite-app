import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ConfirmHost } from '../ConfirmDialog'
import { confirmAction, promptText, useConfirmStore } from '@/stores/confirm.store'

afterEach(() => {
  cleanup()
  act(() => useConfirmStore.setState({ request: null, open: false }))
})

describe('confirmAction', () => {
  it('resolves true when confirmed and false when cancelled', async () => {
    render(<ConfirmHost />)
    let p!: Promise<boolean>
    act(() => {
      p = confirmAction({ title: 'Delete this task?', tone: 'danger' })
    })
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }))
    await expect(p).resolves.toBe(true)

    act(() => {
      p = confirmAction({ title: 'Delete again?', tone: 'danger' })
    })
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }))
    await expect(p).resolves.toBe(false)
  })

  it('keeps the confirm button disabled until the required text is typed', async () => {
    render(<ConfirmHost />)
    act(() => {
      void confirmAction({ title: 'Delete case?', tone: 'danger', requireText: 'LC-0001', confirmLabel: 'Delete case' })
    })
    const button = await screen.findByRole('button', { name: 'Delete case' })
    expect(button).toBeDisabled()
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'LC-0001' } })
    expect(button).not.toBeDisabled()
  })

  it('runs onConfirm inside the dialog and stays open with the error when it fails', async () => {
    render(<ConfirmHost />)
    const onConfirm = vi.fn().mockRejectedValueOnce(new Error('Server said no')).mockResolvedValueOnce(undefined)
    let p!: Promise<boolean>
    act(() => {
      p = confirmAction({ title: 'Delete?', tone: 'danger', onConfirm })
    })
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Server said no')
    expect(useConfirmStore.getState().open).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument())
    await expect(p).resolves.toBe(true)
    expect(onConfirm).toHaveBeenCalledTimes(2)
  })
})

describe('promptText', () => {
  it('returns the entered value, or null when cancelled, and enforces validation', async () => {
    render(<ConfirmHost />)
    let p!: Promise<string | null>
    act(() => {
      p = promptText({
        title: 'Add a link',
        inputLabel: 'URL',
        defaultValue: '',
        validate: (v) => (v.startsWith('https://') ? null : 'Enter a full address'),
      })
    })
    const input = await screen.findByLabelText('URL')
    fireEvent.change(input, { target: { value: 'example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a full address')

    fireEvent.change(input, { target: { value: 'https://example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await expect(p).resolves.toBe('https://example.com')

    act(() => {
      p = promptText({ title: 'Add a link' })
    })
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }))
    await expect(p).resolves.toBeNull()
  })
})
