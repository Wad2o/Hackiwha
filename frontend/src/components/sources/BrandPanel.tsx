import { type FormEvent, useState } from 'react';
import { ApiError } from '../../lib/api';
import { createBrand, type BrandImage, type BrandOut } from '../../lib/content';

interface BrandPanelProps {
  brand: BrandOut | null;
  authUserId: string | null;
  token: string | null;
  onSaved: (brand: BrandOut) => void;
}

const emptyBrand: BrandImage = {
  visual: { logo: '', typography: { titles: '', texts: '', extra: '', highlight: '' }, photography: '', color_palette: [] },
  tone: { vocabulary: 'natural', humor_level: 'none', formality: 'casual', sentence_rhythm: 'efficient' },
  positioning: { target_audience: '', problem_statement: '', flare: '' },
};

export function BrandPanel({ brand, authUserId, token, onSaved }: BrandPanelProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<BrandImage>(brand ?? emptyBrand);
  const [colorInput, setColorInput] = useState((brand?.visual.color_palette ?? []).join(', '));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function startEditing() {
    setForm(brand ?? emptyBrand);
    setColorInput((brand?.visual.color_palette ?? []).join(', '));
    setEditing(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!authUserId || !token) return;

    setError(null);
    setLoading(true);

    try {
      const payload: BrandImage = {
        ...form,
        visual: {
          ...form.visual,
          color_palette: colorInput
            .split(',')
            .map((entry) => entry.trim())
            .filter(Boolean),
        },
      };
      const saved = await createBrand(authUserId, payload, token);
      onSaved(saved);
      setEditing(false);
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'Could not save brand identity.');
    } finally {
      setLoading(false);
    }
  }

  if (!editing) {
    return (
      <div className="mb-4 rounded-xl border border-stone-200 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-400">Brand identity</h3>
          <button onClick={startEditing} className="text-xs font-medium text-amber-700 hover:underline">
            {brand ? 'Edit' : 'Set up'}
          </button>
        </div>
        {brand ? (
          <div className="space-y-1 text-sm text-stone-600">
            <p>
              <span className="font-medium text-stone-900">Tone:</span> {brand.tone.vocabulary}, {brand.tone.formality}
            </p>
            <p>
              <span className="font-medium text-stone-900">Audience:</span> {brand.positioning.target_audience || '—'}
            </p>
            <p>
              <span className="font-medium text-stone-900">Palette:</span> {brand.visual.color_palette.join(', ') || '—'}
            </p>
          </div>
        ) : (
          <p className="text-sm text-stone-500">No brand identity yet.</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 space-y-3 rounded-xl border border-stone-200 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-400">Brand identity</h3>
      <input
        placeholder="Logo (name or URL)"
        value={form.visual.logo}
        onChange={(event) => setForm({ ...form, visual: { ...form.visual, logo: event.target.value } })}
        className={fieldClass}
      />
      <input
        placeholder="Photography / visual direction"
        value={form.visual.photography}
        onChange={(event) => setForm({ ...form, visual: { ...form.visual, photography: event.target.value } })}
        className={fieldClass}
      />
      <input
        placeholder="Color palette (comma-separated)"
        value={colorInput}
        onChange={(event) => setColorInput(event.target.value)}
        className={fieldClass}
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          placeholder="Title typography"
          value={form.visual.typography.titles}
          onChange={(event) =>
            setForm({ ...form, visual: { ...form.visual, typography: { ...form.visual.typography, titles: event.target.value } } })
          }
          className={fieldClass}
        />
        <input
          placeholder="Text typography"
          value={form.visual.typography.texts}
          onChange={(event) =>
            setForm({ ...form, visual: { ...form.visual, typography: { ...form.visual.typography, texts: event.target.value } } })
          }
          className={fieldClass}
        />
        <input
          placeholder="Extras typography"
          value={form.visual.typography.extra}
          onChange={(event) =>
            setForm({ ...form, visual: { ...form.visual, typography: { ...form.visual.typography, extra: event.target.value } } })
          }
          className={fieldClass}
        />
        <input
          placeholder="Highlights typography"
          value={form.visual.typography.highlight}
          onChange={(event) =>
            setForm({ ...form, visual: { ...form.visual, typography: { ...form.visual.typography, highlight: event.target.value } } })
          }
          className={fieldClass}
        />
      </div>
      <select
        value={form.tone.vocabulary}
        onChange={(event) => setForm({ ...form, tone: { ...form.tone, vocabulary: event.target.value as BrandImage['tone']['vocabulary'] } })}
        className={fieldClass}
      >
        <option value="natural">Natural</option>
        <option value="academic">Academic</option>
        <option value="simplified">Simplified</option>
        <option value="sophisticated">Sophisticated</option>
      </select>
      <select
        value={form.tone.humor_level}
        onChange={(event) =>
          setForm({ ...form, tone: { ...form.tone, humor_level: event.target.value as BrandImage['tone']['humor_level'] } })
        }
        className={fieldClass}
      >
        <option value="none">No humor</option>
        <option value="occasional_pun">Occasional pun</option>
        <option value="humour_first">Humour first</option>
      </select>
      <select
        value={form.tone.formality}
        onChange={(event) => setForm({ ...form, tone: { ...form.tone, formality: event.target.value as BrandImage['tone']['formality'] } })}
        className={fieldClass}
      >
        <option value="casual">Casual</option>
        <option value="business_professional">Business professional</option>
        <option value="friendly">Friendly</option>
        <option value="hyper_formal">Hyper formal</option>
      </select>
      <select
        value={form.tone.sentence_rhythm}
        onChange={(event) =>
          setForm({ ...form, tone: { ...form.tone, sentence_rhythm: event.target.value as BrandImage['tone']['sentence_rhythm'] } })
        }
        className={fieldClass}
      >
        <option value="fast">Fast</option>
        <option value="slow">Slow</option>
        <option value="efficient">Efficient</option>
        <option value="repetitive">Repetitive</option>
      </select>
      <input
        placeholder="Target audience"
        value={form.positioning.target_audience}
        onChange={(event) => setForm({ ...form, positioning: { ...form.positioning, target_audience: event.target.value } })}
        className={fieldClass}
      />
      <input
        placeholder="Problem statement"
        value={form.positioning.problem_statement}
        onChange={(event) => setForm({ ...form, positioning: { ...form.positioning, problem_statement: event.target.value } })}
        className={fieldClass}
      />
      <input
        placeholder="Flare"
        value={form.positioning.flare}
        onChange={(event) => setForm({ ...form, positioning: { ...form.positioning, flare: event.target.value } })}
        className={fieldClass}
      />
      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setEditing(false)} className="text-sm font-medium text-stone-500">
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60"
        >
          {loading ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}

const fieldClass =
  'w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500';