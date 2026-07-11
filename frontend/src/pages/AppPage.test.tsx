import { useEffect } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppPage } from './AppPage';
import { AuthProvider, useAuth } from '../context/AuthContext';
import * as contentApi from '../lib/content';
import type { BrandOut, PostOut } from '../lib/content';

const brand: BrandOut = {
  brandId: 'b1',
  userId: 'auth-1',
  visual: { logo: '', typography: { titles: '', texts: '', extra: '', highlight: '' }, photography: '', color_palette: [] },
  tone: { vocabulary: 'natural', humor_level: 'none', formality: 'casual', sentence_rhythm: 'efficient' },
  positioning: { target_audience: 'Gamers', problem_statement: '', flare: '' },
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
};

const posts: PostOut[] = [
  {
    postId: 'p1',
    userId: 'auth-1',
    idea: 'idea',
    script: '',
    hook: 'Wait for it',
    platform: 'tiktok',
    is_loop: false,
    confidence_score: null,
    suggested_vfx: '',
    suggested_sfx: '',
    design_direction: null,
    analysis: null,
    created_at: '2026-01-01',
  },
];

function Wrapper() {
  const { setAuth } = useAuth();
  useEffect(() => {
    setAuth('tok-1', 'auth-1');
  }, [setAuth]);
  return <AppPage />;
}

describe('AppPage', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('hackiwha_profile', JSON.stringify({ userId: 'profile-1' }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads and renders the brand and posts panels', async () => {
    vi.spyOn(contentApi, 'getBrand').mockResolvedValue(brand);
    vi.spyOn(contentApi, 'getPosts').mockResolvedValue(posts);

    render(
      <MemoryRouter>
        <AuthProvider>
          <Wrapper />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Gamers')).toBeInTheDocument();
    expect(await screen.findByText('Wait for it')).toBeInTheDocument();
    expect(screen.getByText('Hackiwha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });

  it('treats a 404 brand lookup as no brand yet without an error banner', async () => {
    const { ApiError } = await import('../lib/api');
    vi.spyOn(contentApi, 'getBrand').mockRejectedValue(new ApiError(404, 'Brand not found'));
    vi.spyOn(contentApi, 'getPosts').mockResolvedValue([]);

    render(
      <MemoryRouter>
        <AuthProvider>
          <Wrapper />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/no brand identity yet/i)).toBeInTheDocument();
  });
});