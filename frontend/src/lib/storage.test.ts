import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearAuth,
  getAuthToken,
  getAuthUserId,
  getProfile,
  getProfileUserId,
  isOnboarded,
  setAuthToken,
  setAuthUserId,
  setOnboarded,
  setProfile,
} from './storage';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('round-trips the auth token and auth user id', () => {
    expect(getAuthToken()).toBeNull();
    setAuthToken('tok-123');
    setAuthUserId('user-abc');
    expect(getAuthToken()).toBe('tok-123');
    expect(getAuthUserId()).toBe('user-abc');
  });

  it('round-trips the profile and derives the profile user id', () => {
    expect(getProfile()).toBeNull();
    expect(getProfileUserId()).toBeNull();
    setProfile({ userId: 'profile-1', name: 'Sam' });
    expect(getProfile<{ userId: string; name: string }>()).toEqual({ userId: 'profile-1', name: 'Sam' });
    expect(getProfileUserId()).toBe('profile-1');
  });

  it('tracks onboarding completion', () => {
    expect(isOnboarded()).toBe(false);
    setOnboarded();
    expect(isOnboarded()).toBe(true);
  });

  it('clears everything on clearAuth', () => {
    setAuthToken('tok-123');
    setAuthUserId('user-abc');
    setProfile({ userId: 'profile-1' });
    setOnboarded();
    clearAuth();
    expect(getAuthToken()).toBeNull();
    expect(getAuthUserId()).toBeNull();
    expect(getProfile()).toBeNull();
    expect(isOnboarded()).toBe(false);
  });
});
