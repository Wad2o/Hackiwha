import { type FormEvent, useState } from 'react';
import { ApiError } from '../../lib/api';
import { createPost, videoCoach, type BrandOut, type PostOut, type VideoCoachResponse } from '../../lib/content';

interface ChatPanelProps {
  profileUserId: string | null;
  authUserId: string | null;
  brand: BrandOut | null;
  selectedPosts: PostOut[];
  token: string | null;
  onPostSaved: (post: PostOut) => void;
}

interface ChatTurn {
  id: string;
  prompt: string;
  response: VideoCoachResponse | null;
  error: string | null;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function ChatPanel({ profileUserId, authUserId, brand, selectedPosts, token, onPostSaved }: ChatPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [loading, setLoading] = useState(false);

  const canChat = !!brand && !!profileUserId && !!token;

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canChat || !prompt.trim()) return;

    const turnId = generateId();
    const currentPrompt = prompt.trim();
    setTurns((previous) => [...previous, { id: turnId, prompt: currentPrompt, response: null, error: null }]);
    setPrompt('');
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
      const response = await videoCoach(profileUserId!, brand!, posts, currentPrompt, token!);
      setTurns((previous) => previous.map((turn) => (turn.id === turnId ? { ...turn, response } : turn)));
    } catch (caughtError) {
      const message = caughtError instanceof ApiError ? caughtError.message : 'Something went wrong generating a response.';
      setTurns((previous) => previous.map((turn) => (turn.id === turnId ? { ...turn, error: message } : turn)));
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveToSources(turn: ChatTurn) {
    if (!authUserId || !token || !turn.response) return;

    const saved = await createPost(
      authUserId,
      {
        idea: turn.prompt,
        script: turn.response.script,
        hook: turn.response.hook,
        platform: turn.response.platform as PostOut['platform'],
        is_loop: turn.response.is_loop,
        suggested_vfx: turn.response.suggested_vfx,
        suggested_sfx: turn.response.suggested_sfx,
        design_direction: turn.response.design_direction,
        analysis: turn.response.analysis,
      },
      token,
    );
    onPostSaved(saved);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {turns.length === 0 ? (
          <p className="text-sm text-stone-400">
            {canChat ? 'Ask for a video strategy, hook idea, or script.' : 'Set up your brand identity in Sources before chatting.'}
          </p>
        ) : null}

        {turns.map((turn) => (
          <div key={turn.id} className="space-y-2">
            <div className="ml-auto max-w-[80%] rounded-2xl bg-amber-600 px-4 py-2 text-sm text-white">{turn.prompt}</div>
            {turn.error ? (
              <div role="alert" className="max-w-[80%] rounded-2xl bg-red-50 px-4 py-2 text-sm text-red-700">
                {turn.error}
              </div>
            ) : null}
            {turn.response ? (
              <div className="max-w-[80%] space-y-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800">
                <p>{turn.response.analysis}</p>
                <p>
                  <span className="font-medium">Hook:</span> {turn.response.hook}
                </p>
                <p>
                  <span className="font-medium">Script:</span> {turn.response.script}
                </p>
                <p className="text-xs text-stone-500">
                  {turn.response.platform} · {turn.response.is_loop ? 'loop' : 'no loop'} · VFX: {turn.response.suggested_vfx} · SFX:{' '}
                  {turn.response.suggested_sfx}
                </p>
                <button onClick={() => void handleSaveToSources(turn)} className="text-xs font-medium text-amber-700 hover:underline">
                  Save to sources
                </button>
              </div>
            ) : null}
            {!turn.response && !turn.error ? (
              <div className="max-w-[80%] rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-400">Thinking…</div>
            ) : null}
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="flex gap-2 border-t border-stone-200 p-4">
        <input
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={canChat ? 'Message the coach…' : 'Set up a brand identity first'}
          disabled={!canChat || loading}
          className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:bg-stone-100"
        />
        <button
          type="submit"
          disabled={!canChat || loading || !prompt.trim()}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}