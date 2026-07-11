import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as contentApi from '../../lib/content';
import { PostList } from './PostList';
import type { PostOut } from '../../lib/content';

const posts: PostOut[] = [
  {
    postId: 'p1',
    userId: 'auth-1',
    idea: 'idea 1',
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

describe('PostList', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows an empty state with no posts', () => {
    render(<PostList posts={[]} selectedPostIds={[]} token="tok-1" onToggleSelected={vi.fn()} onDeleted={vi.fn()} />);
    expect(screen.getByText(/no saved posts yet/i)).toBeInTheDocument();
  });

  it('toggles selection via the checkbox', async () => {
    const onToggleSelected = vi.fn();
    render(
      <PostList posts={posts} selectedPostIds={[]} token="tok-1" onToggleSelected={onToggleSelected} onDeleted={vi.fn()} />,
    );
    await userEvent.click(screen.getByRole('checkbox'));
    expect(onToggleSelected).toHaveBeenCalledWith('p1');
  });

  it('deletes a post and calls onDeleted', async () => {
    vi.spyOn(contentApi, 'deletePost').mockResolvedValue({ deleted: true });
    const onDeleted = vi.fn();
    render(
      <PostList posts={posts} selectedPostIds={[]} token="tok-1" onToggleSelected={vi.fn()} onDeleted={onDeleted} />,
    );
    await userEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(contentApi.deletePost).toHaveBeenCalledWith('p1', 'tok-1');
    expect(onDeleted).toHaveBeenCalledWith('p1');
  });
});