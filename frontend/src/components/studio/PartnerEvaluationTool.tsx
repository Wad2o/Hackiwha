import { type FormEvent, useState } from 'react';
import { ApiError } from '../../lib/api';
import { partnerEvaluation, type BrandOut, type PartnerEvaluationResponse, type UserProfile } from '../../lib/content';
import { getProfile } from '../../lib/storage';

interface PartnerEvaluationToolProps {
  brand: BrandOut | null;
  token: string | null;
}

export function PartnerEvaluationTool({ brand, token }: PartnerEvaluationToolProps) {
  const [partnerBrand, setPartnerBrand] = useState('');
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<PartnerEvaluationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const profile = getProfile<UserProfile>();
  const canRun = !!brand && !!profile && !!token;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canRun) return;

    setError(null);
    setLoading(true);

    try {
      const response = await partnerEvaluation(profile!, brand!, partnerBrand, prompt, token!);
      setResult(response);
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'Could not evaluate partner.');
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="space-y-2 text-sm">
        <p className="font-medium text-stone-900">Compatibility: {result.compatibility}/100</p>
        <p className="text-stone-600">{result.analysis}</p>
        <p>
          <span className="font-medium">Shared:</span> {result.shared_interests.join(', ') || '—'}
        </p>
        <p>
          <span className="font-medium">Conflicts:</span> {result.conflict_interests.join(', ') || '—'}
        </p>
        <button onClick={() => setResult(null)} className="text-xs font-medium text-amber-700 hover:underline">
          Run again
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {!canRun ? <p className="text-xs text-stone-500">Set up your brand identity first.</p> : null}
      <input
        placeholder="Partner brand description"
        value={partnerBrand}
        onChange={(event) => setPartnerBrand(event.target.value)}
        className={fieldClass}
      />
      <textarea
        placeholder="What do you want evaluated?"
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
        {loading ? 'Evaluating…' : 'Evaluate'}
      </button>
    </form>
  );
}

const fieldClass =
  'w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500';