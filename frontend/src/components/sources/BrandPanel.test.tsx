import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BrandPanel } from './BrandPanel';
import * as contentApi from '../../lib/content';
import type { BrandOut } from '../../lib/content';

describe('BrandPanel', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows an empty state and a Set up action when there is no brand', () => {
    render(<BrandPanel brand={null} authUserId="auth-1" token="tok-1" onSaved={vi.fn()} />);
    expect(screen.getByText(/no brand identity yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /set up/i })).toBeInTheDocument();
  });

  it('submits the form and calls onSaved with the created brand', async () => {
    const saved: BrandOut = {
      brandId: 'b1',
      userId: 'auth-1',
      visual: { logo: '', typography: { titles: '', texts: '', extra: '', highlight: '' }, photography: '', color_palette: [] },
      tone: { vocabulary: 'natural', humor_level: 'none', formality: 'casual', sentence_rhythm: 'efficient' },
      positioning: { target_audience: 'Gamers', problem_statement: '', flare: '' },
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    };
    vi.spyOn(contentApi, 'createBrand').mockResolvedValue(saved);
    const onSaved = vi.fn();

    render(<BrandPanel brand={null} authUserId="auth-1" token="tok-1" onSaved={onSaved} />);

    await userEvent.click(screen.getByRole('button', { name: /set up/i }));
    await userEvent.type(screen.getByPlaceholderText(/target audience/i), 'Gamers');
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));

    expect(contentApi.createBrand).toHaveBeenCalledWith(
      'auth-1',
      expect.objectContaining({ positioning: expect.objectContaining({ target_audience: 'Gamers' }) }),
      'tok-1',
    );
    expect(onSaved).toHaveBeenCalledWith(saved);
  });
});