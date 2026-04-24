import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from '../../context/AuthContext'

function TestConsumer() {
  const { token, login, logout } = useAuth()
  return (
    <div>
      <span data-testid="token">{token ?? 'none'}</span>
      <button onClick={() => login('test-token')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => localStorage.clear())

  it('starts with no token', () => {
    render(<AuthProvider><TestConsumer /></AuthProvider>)
    expect(screen.getByTestId('token').textContent).toBe('none')
  })

  it('login stores token in localStorage and state', async () => {
    render(<AuthProvider><TestConsumer /></AuthProvider>)
    await userEvent.click(screen.getByText('Login'))
    expect(screen.getByTestId('token').textContent).toBe('test-token')
    expect(localStorage.getItem('token')).toBe('test-token')
  })

  it('logout clears token from localStorage and state', async () => {
    render(<AuthProvider><TestConsumer /></AuthProvider>)
    await userEvent.click(screen.getByText('Login'))
    await userEvent.click(screen.getByText('Logout'))
    expect(screen.getByTestId('token').textContent).toBe('none')
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('restores token from localStorage on mount', () => {
    localStorage.setItem('token', 'existing-token')
    render(<AuthProvider><TestConsumer /></AuthProvider>)
    expect(screen.getByTestId('token').textContent).toBe('existing-token')
  })
})
