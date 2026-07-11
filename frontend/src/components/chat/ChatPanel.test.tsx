import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChatPanel } from './ChatPanel';
import * as contentApi from '../../lib/content';
import type { BrandOut, PostOut } from '../../lib/content';

const brand: BrandOut = {
  brandId: 'b1',
  userId: 'auth-1',
  visual: { logo: '', typography: { titles: '', texts: '', extra: '', highlight: '' }, photography: '', color_palette: [] },
  tone: { vocabulary: 'natural', humor_level: 'none', formality: 'casual', sentence_rhythm: 'efficient' },
  positioning: { target_audience: '', problem_statement: '', flare: '' },
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
};

describe('ChatPanel', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('disables the composer until a brand identity exists', () => {
    render(
      <ChatPanel
        profileUserId="profile-1"
        authUserId="auth-1"
        brand={null}
        selectedPosts={[]}
        token="tok-1"
        onPostSaved={vi.fn()}
      />,
    );
    expect(screen.getByPlaceholderText(/set up a brand identity first/i)).toBeDisabled();
  });

  it('sends a prompt to videoCoach and renders the response', async () => {
    vi.spyOn(contentApi, 'videoCoach').mockResolvedValue({
      analysis: 'Strong hook potential',
      script: 'Intro -> demo -> CTA',
      hook: 'POV: you found the glitch',
      platform: 'tiktok',
      is_loop: true,
      suggested_vfx: 'zoom',
      suggested_sfx: 'trending sound',
      design_direction: { logo: '', typography: { titles: '', texts: '', extra: '', highlight: '' }, photography: '', color_palette: [] },
    });

    render(
      <ChatPanel
        profileUserId="profile-1"
        authUserId="auth-1"
        brand={brand}
        selectedPosts={[]}
        token="tok-1"
        onPostSaved={vi.fn()}
      />,
    );

    await userEvent.type(screen.getByPlaceholderText(/message the coach/i), 'promote my new app');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    expect(contentApi.videoCoach).toHaveBeenCalledWith('profile-1', brand, [], 'promote my new app', 'tok-1');
    expect(screen.getByText('promote my new app')).toBeInTheDocument();
    expect(await screen.findByText(/POV: you found the glitch/)).toBeInTheDocument();
  });

  it('saves an assistant response to sources', async () => {
    vi.spyOn(contentApi, 'videoCoach').mockResolvedValue({
      analysis: 'a',
      script: 's',
      hook: 'h',
      platform: 'tiktok',
      is_loop: false,
      suggested_vfx: '',
      suggested_sfx: '',
      design_direction: { logo: '', typography: { titles: '', texts: '', extra: '', highlight: '' }, photography: '', color_palette: [] },
    });
    const savedPost: PostOut = {
      postId: 'p1',
      userId: 'auth-1',
      idea: 'promote',
      script: 's',
      hook: 'h',
      platform: 'tiktok',
      is_loop: false,
      confidence_score: null,
      suggested_vfx: '',
      suggested_sfx: '',
      design_direction: null,
      analysis: 'a',
      created_at: '2026-01-01',
    };
    vi.spyOn(contentApi, 'createPost').mockResolvedValue(savedPost);
    const onPostSaved = vi.fn();

    render(
      <ChatPanel
        profileUserId="profile-1"
        authUserId="auth-1"
        brand={brand}
        selectedPosts={[]}
        token="tok-1"
        onPostSaved={onPostSaved}
      />,
    );

    await userEvent.type(screen.getByPlaceholderText(/message the coach/i), 'promote');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));
    await userEvent.click(await screen.findByRole('button', { name: /save to sources/i }));

    expect(contentApi.createPost).toHaveBeenCalledWith('auth-1', expect.objectContaining({ hook: 'h', script: 's' }), 'tok-1');
    expect(onPostSaved).toHaveBeenCalledWith(savedPost);
  });
});