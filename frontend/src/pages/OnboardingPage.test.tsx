import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../context/AuthContext';
import * as contentApi from '../lib/content';
import { OnboardingPage } from './OnboardingPage';

describe('OnboardingPage', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('hackiwha_auth_token', 'tok-1');
    localStorage.setItem('hackiwha_auth_user_id', 'auth-1');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('walks through all steps and submits the profile form on finish', async () => {
    vi.spyOn(contentApi, 'submitUserForm').mockResolvedValue({
      userId: 'profile-1',
      name: 'Sam',
      description: '',
      content_type: [],
      age: 0,
      gender: '',
      location: { country: '', city: '', timezone: '' },
      experience: { years: 0, months: 0, days: 0 },
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <OnboardingPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    await userEvent.type(screen.getByRole('textbox', { name: /what's your name/i }), 'Sam');

    for (let index = 0; index < 6; index += 1) {
      await userEvent.click(screen.getByRole('button', { name: /continue|finish/i }));
    }

    await waitFor(() => {
      expect(contentApi.submitUserForm).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Sam', years: 0, months: 0, days: 0 }),
        'tok-1',
      );
    });
    expect(localStorage.getItem('hackiwha_onboarded')).toBe('true');
  });
});