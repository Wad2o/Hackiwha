import { type ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { submitUserForm } from '../lib/content';
import { setOnboarded, setProfile } from '../lib/storage';

interface OnboardingData {
  name: string;
  description: string;
  contentTypeInput: string;
  age: string;
  gender: string;
  country: string;
  city: string;
  years: string;
  months: string;
  days: string;
}

const TOTAL_STEPS = 6;

const initialData: OnboardingData = {
  name: '',
  description: '',
  contentTypeInput: '',
  age: '',
  gender: '',
  country: '',
  city: '',
  years: '0',
  months: '0',
  days: '0',
};

export function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(initialData);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();
  const navigate = useNavigate();

  function update<K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) {
    setData((previous) => ({ ...previous, [key]: value }));
  }

  async function finish() {
    if (!token) return;

    setError(null);
    setLoading(true);

    try {
      const profile = await submitUserForm(
        {
          name: data.name,
          description: data.description,
          content_type: data.contentTypeInput
            .split(',')
            .map((entry) => entry.trim())
            .filter(Boolean),
          age: Number(data.age) || 0,
          gender: data.gender,
          country: data.country,
          city: data.city,
          years: Number(data.years) || 0,
          months: Number(data.months) || 0,
          days: Number(data.days) || 0,
        },
        token,
      );
      setProfile(profile);
      setOnboarded();
      navigate('/app');
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  function next() {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
      return;
    }

    void finish();
  }

  function back() {
    if (step > 0) {
      setStep(step - 1);
    }
  }

  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="mb-6 h-1.5 w-full rounded-full bg-stone-100">
          <div className="h-1.5 rounded-full bg-amber-600 transition-all" style={{ width: `${progress}%` }} />
        </div>

        {step === 0 && (
          <Question label="What's your name?">
            <input
              autoFocus
              aria-label="What's your name?"
              value={data.name}
              onChange={(event) => update('name', event.target.value)}
              className={inputClass}
            />
          </Question>
        )}

        {step === 1 && (
          <Question label="Tell us about your content">
            <textarea
              autoFocus
              aria-label="Tell us about your content"
              value={data.description}
              onChange={(event) => update('description', event.target.value)}
              rows={4}
              className={inputClass}
            />
          </Question>
        )}

        {step === 2 && (
          <Question label="What type of content do you make?" hint="Comma-separated, e.g. Tech, Reviews, Comedy">
            <input
              autoFocus
              aria-label="What type of content do you make?"
              value={data.contentTypeInput}
              onChange={(event) => update('contentTypeInput', event.target.value)}
              className={inputClass}
            />
          </Question>
        )}

        {step === 3 && (
          <Question label="A bit about you">
            <div className="space-y-3">
              <input
                autoFocus
                type="number"
                min={0}
                placeholder="Age"
                aria-label="Age"
                value={data.age}
                onChange={(event) => update('age', event.target.value)}
                className={inputClass}
              />
              <input
                placeholder="Gender"
                aria-label="Gender"
                value={data.gender}
                onChange={(event) => update('gender', event.target.value)}
                className={inputClass}
              />
            </div>
          </Question>
        )}

        {step === 4 && (
          <Question label="Where are you based?">
            <div className="space-y-3">
              <input
                autoFocus
                placeholder="Country"
                aria-label="Country"
                value={data.country}
                onChange={(event) => update('country', event.target.value)}
                className={inputClass}
              />
              <input
                placeholder="City"
                aria-label="City"
                value={data.city}
                onChange={(event) => update('city', event.target.value)}
                className={inputClass}
              />
            </div>
          </Question>
        )}

        {step === 5 && (
          <Question label="How long have you been creating content?">
            <div className="grid grid-cols-3 gap-3">
              <input
                type="number"
                min={0}
                placeholder="Years"
                aria-label="Years"
                value={data.years}
                onChange={(event) => update('years', event.target.value)}
                className={inputClass}
              />
              <input
                type="number"
                min={0}
                max={11}
                placeholder="Months"
                aria-label="Months"
                value={data.months}
                onChange={(event) => update('months', event.target.value)}
                className={inputClass}
              />
              <input
                type="number"
                min={0}
                max={30}
                placeholder="Days"
                aria-label="Days"
                value={data.days}
                onChange={(event) => update('days', event.target.value)}
                className={inputClass}
              />
            </div>
          </Question>
        )}

        {error ? (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {error}
          </p>
        ) : null}

        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={back}
            disabled={step === 0}
            className="text-sm font-medium text-stone-500 disabled:opacity-0"
          >
            Back
          </button>
          <button
            type="button"
            onClick={next}
            disabled={loading}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60"
          >
            {step === TOTAL_STEPS - 1 ? (loading ? 'Finishing…' : 'Finish') : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500';

function Question({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-stone-900">{label}</h2>
      <p className="mb-3 text-sm text-stone-500">{hint ?? ' '}</p>
      {children}
    </div>
  );
}
