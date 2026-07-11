import { getProfile } from '../../lib/storage';

interface StoredProfile {
  name: string;
  description: string;
  content_type?: string[];
  age: number;
  gender: string;
  location?: { country?: string; city?: string };
  experience?: { years?: number; months?: number; days?: number };
}

export function ProfileCard() {
  const profile = getProfile<StoredProfile>();

  if (!profile) {
    return <div className="mb-4 rounded-xl border border-stone-200 p-4 text-sm text-stone-500">No profile yet.</div>;
  }

  return (
    <div className="mb-4 rounded-xl border border-stone-200 p-4">
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-400">Profile</h3>
      <p className="text-base font-medium text-stone-900">{profile.name}</p>
      <p className="mt-1 text-sm text-stone-600">{profile.description}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {(profile.content_type ?? []).map((tag) => (
          <span key={tag} className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
            {tag}
          </span>
        ))}
      </div>
      <p className="mt-2 text-xs text-stone-500">
        {profile.age > 0 ? `${profile.age} y/o ` : ''}
        {profile.gender ? `${profile.gender} · ` : ''}
        {profile.location?.city ?? ''}
        {profile.location?.city && profile.location?.country ? ', ' : ''}
        {profile.location?.country ?? ''}
      </p>
      <p className="mt-1 text-xs text-stone-500">
        {profile.experience?.years ?? 0}y {profile.experience?.months ?? 0}m {profile.experience?.days ?? 0}d experience
      </p>
    </div>
  );
}