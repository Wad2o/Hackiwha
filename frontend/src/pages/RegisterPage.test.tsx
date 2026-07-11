import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../context/AuthContext';
import * as authApi from '../lib/auth';
import { RegisterPage } from './RegisterPage';

describe('RegisterPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers and stores the token on submit', async () => {
    vi.spyOn(authApi, 'register').mockResolvedValue({ access_token: 'tok-2', token_type: 'bearer', userId: 'auth-2' });

    render(
      <MemoryRouter>
        <AuthProvider>
          <RegisterPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    await userEvent.type(screen.getByLabelText(/email/i), 'new@b.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));

    expect(authApi.register).toHaveBeenCalledWith('new@b.com', 'secret123');
    expect(localStorage.getItem('hackiwha_auth_token')).toBe('tok-2');
  });

  it('shows the backend error message on failed registration', async () => {
    const { ApiError } = await import('../lib/api');
    vi.spyOn(authApi, 'register').mockRejectedValue(new ApiError(409, 'Email déjà utilisé'));

    render(
      <MemoryRouter>
        <AuthProvider>
          <RegisterPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email déjà utilisé');
  });
});