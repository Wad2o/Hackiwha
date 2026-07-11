import { useState } from 'react';
import { ApiError } from '../../lib/api';
import { deletePost, type PostOut } from '../../lib/content';

interface PostListProps {
  posts: PostOut[];
  selectedPostIds: string[];
  token: string | null;
  onToggleSelected: (postId: string) => void;
  onDeleted: (postId: string) => void;
}

export function PostList({ posts, selectedPostIds, token, onToggleSelected, onDeleted }: PostListProps) {
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(postId: string) {
    if (!token) return;

    setError(null);
    setDeletingId(postId);

    try {
      await deletePost(postId, token);
      onDeleted(postId);
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'Could not delete post.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="rounded-xl border border-stone-200 p-4">
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-400">Saved posts</h3>
      {error ? (
        <p role="alert" className="mb-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}
      {posts.length === 0 ? <p className="text-sm text-stone-500">No saved posts yet.</p> : null}
      <ul className="space-y-2">
        {posts.map((post) => (
          <li key={post.postId} className="flex items-start gap-2 rounded-lg border border-stone-100 p-2">
            <input
              type="checkbox"
              checked={selectedPostIds.includes(post.postId)}
              onChange={() => onToggleSelected(post.postId)}
              aria-label={`Select ${post.hook || post.idea || 'post'}`}
              className="mt-1"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-stone-900">{post.hook || post.idea || 'Untitled post'}</p>
              <p className="text-xs text-stone-500">{post.platform}</p>
            </div>
            <button
              onClick={() => handleDelete(post.postId)}
              disabled={deletingId === post.postId}
              className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}