import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../context/AuthContext';
import * as authApi from '../lib/auth';
import { LoginPage } from './LoginPage';

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs in and stores the token on submit', async () => {
    vi.spyOn(authApi, 'login').mockResolvedValue({ access_token: 'tok-1', token_type: 'bearer', userId: 'auth-1' });

    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(authApi.login).toHaveBeenCalledWith('a@b.com', 'secret123');
    expect(localStorage.getItem('hackiwha_auth_token')).toBe('tok-1');
  });

  it('shows the backend error message on failed login', async () => {
    const { ApiError } = await import('../lib/api');
    vi.spyOn(authApi, 'login').mockRejectedValue(new ApiError(401, 'Email ou mot de passe incorrect'));

    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email ou mot de passe incorrect');
  });
});