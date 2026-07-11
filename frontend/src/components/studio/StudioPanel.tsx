import { type ReactNode, useState } from 'react';
import type { BrandOut, PostOut } from '../../lib/content';
import { PartnerEvaluationTool } from './PartnerEvaluationTool';
import { VideoCritiqueTool } from './VideoCritiqueTool';

interface StudioPanelProps {
  brand: BrandOut | null;
  profileUserId: string | null;
  authUserId: string | null;
  selectedPosts: PostOut[];
  token: string | null;
}

export function StudioPanel({ brand, profileUserId, selectedPosts, token }: StudioPanelProps) {
  const [open, setOpen] = useState<'partner' | 'critique' | null>(null);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-400">Studio</h3>
      <ToolCard title="Partner evaluation" isOpen={open === 'partner'} onToggle={() => setOpen(open === 'partner' ? null : 'partner')}>
        <PartnerEvaluationTool brand={brand} token={token} />
      </ToolCard>
      <ToolCard title="Video critique" isOpen={open === 'critique'} onToggle={() => setOpen(open === 'critique' ? null : 'critique')}>
        <VideoCritiqueTool brand={brand} profileUserId={profileUserId} selectedPosts={selectedPosts} token={token} />
      </ToolCard>
    </div>
  );
}

function ToolCard({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-stone-200">
      <button onClick={onToggle} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-stone-900">
        {title}
        <span className="text-stone-400">{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen ? <div className="border-t border-stone-200 p-4">{children}</div> : null}
    </div>
  );
}