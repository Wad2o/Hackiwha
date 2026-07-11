import { type FormEvent, useState } from 'react';
import { ApiError } from '../../lib/api';
import { criticVideo, type BrandOut, type CriticVideoResponse, type PostOut } from '../../lib/content';

interface VideoCritiqueToolProps {
  brand: BrandOut | null;
  profileUserId: string | null;
  selectedPosts: PostOut[];
  token: string | null;
}

export function VideoCritiqueTool({ brand, profileUserId, selectedPosts, token }: VideoCritiqueToolProps) {
  const [video, setVideo] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<CriticVideoResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canRun = !!brand && !!profileUserId && !!token && !!video;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canRun) return;

    setError(null);
    setLoading(true);

    try {
      const posts = selectedPosts.map((post) => ({
        idea: post.idea ?? '',
        script: post.script ?? '',
        hook: post.hook ?? '',
        platform: post.platform,
        is_loop: post.is_loop,
        confidence_score: post.confidence_score,
        suggested_vfx: post.suggested_vfx ?? '',
        suggested_sfx: post.suggested_sfx ?? '',
      }));
      const response = await criticVideo(profileUserId!, brand!, posts, prompt, video!, token!);
      setResult(response);
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'Could not critique video.');
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="space-y-2 text-sm">
        <p className="text-stone-600">{result.analysis}</p>
        <p>
          <span className="font-medium">Pros:</span> {result.pros.join(', ') || '—'}
        </p>
        <p>
          <span className="font-medium">Cons:</span> {result.cons.join(', ') || '—'}
        </p>
        <p>
          <span className="font-medium">Fix:</span> {result.solution}
        </p>
        <button onClick={() => setResult(null)} className="text-xs font-medium text-amber-700 hover:underline">
          Run again
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {!brand || !profileUserId ? <p className="text-xs text-stone-500">Complete onboarding and set up a brand identity first.</p> : null}
      <label htmlFor="critique-video-input" className="block text-xs font-medium text-stone-500">
        Video
      </label>
      <input
        id="critique-video-input"
        type="file"
        accept="video/*"
        aria-label="Video"
        onChange={(event) => setVideo(event.target.files?.[0] ?? null)}
        className="w-full text-sm"
      />
      <textarea
        placeholder="What should the coach focus on?"
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        rows={3}
        className={fieldClass}
      />
      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={!canRun || loading}
        className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
      >
        {loading ? 'Analyzing…' : 'Critique video'}
      </button>
    </form>
  );
}

const fieldClass =
  'w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500';