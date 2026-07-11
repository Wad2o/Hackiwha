import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VideoCritiqueTool } from './VideoCritiqueTool';
import * as contentApi from '../../lib/content';
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

describe('VideoCritiqueTool', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uploads a video and prompt, and shows the result', async () => {
    vi.spyOn(contentApi, 'criticVideo').mockResolvedValue({
      analysis: 'Solid but late hook',
      pros: ['clear audio'],
      cons: ['late hook'],
      critics: 'Viewer drops off',
      solution: 'Open on the strongest moment',
    });

    render(<VideoCritiqueTool brand={brand} profileUserId="profile-1" selectedPosts={[]} token="tok-1" />);

    const file = new File(['data'], 'clip.mp4', { type: 'video/mp4' });
    const fileInput = screen.getByLabelText(/video/i) as HTMLInputElement;
    await userEvent.upload(fileInput, file);
    await userEvent.type(screen.getByPlaceholderText(/what should the coach focus on/i), 'pacing');
    await userEvent.click(screen.getByRole('button', { name: /critique video/i }));

    expect(contentApi.criticVideo).toHaveBeenCalledWith('profile-1', brand, [], 'pacing', file, 'tok-1');
    expect(await screen.findByText(/open on the strongest moment/i)).toBeInTheDocument();
  });
});