import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PartnerEvaluationTool } from './PartnerEvaluationTool';
import * as contentApi from '../../lib/content';
import { setProfile } from '../../lib/storage';
import type { BrandOut } from '../../lib/content';

const brand: BrandOut = {
  brandId: 'b1',
  userId: 'auth-1',
  visual: { logo: '', typography: { titles: '', texts: '', extra: '', highlight: '' }, photography: '', color_palette: [] },
  tone: { vocabulary: 'natural', humor_level: 'none', formality: 'casual', sentence_rhythm: 'efficient' },
  positioning: { target_audience: '', problem_statement: '', flare: '' },
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
};

describe('PartnerEvaluationTool', () => {
  beforeEach(() => {
    localStorage.clear();
    setProfile({
      userId: 'profile-1',
      name: 'Sam',
      description: '',
      content_type: [],
      age: 0,
      gender: '',
      location: { country: '', city: '', timezone: '' },
      experience: { years: 0, months: 0, days: 0 },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('runs the evaluation and shows the result', async () => {
    vi.spyOn(contentApi, 'partnerEvaluation').mockResolvedValue({
      analysis: 'Good match',
      compatibility: 78,
      shared_interests: ['gaming'],
      conflict_interests: ['pricing'],
    });

    render(<PartnerEvaluationTool brand={brand} token="tok-1" />);

    await userEvent.type(screen.getByPlaceholderText(/partner brand description/i), 'GamerBrand');
    await userEvent.type(screen.getByPlaceholderText(/what do you want evaluated/i), 'fit check');
    await userEvent.click(screen.getByRole('button', { name: /evaluate/i }));

    expect(contentApi.partnerEvaluation).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'profile-1' }),
      brand,
      'GamerBrand',
      'fit check',
      'tok-1',
    );
    expect(await screen.findByText(/78\/100/)).toBeInTheDocument();
  });
});