import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { StudioPanel } from './StudioPanel';

describe('StudioPanel', () => {
  it('expands a tool card when clicked', async () => {
    render(<StudioPanel brand={null} profileUserId={null} authUserId={null} selectedPosts={[]} token={null} />);
    expect(screen.queryByPlaceholderText(/partner brand description/i)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /partner evaluation/i }));
    expect(screen.getByPlaceholderText(/partner brand description/i)).toBeInTheDocument();
  });
});