import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { ProfileCard } from './ProfileCard';
import { setProfile } from '../../lib/storage';

describe('ProfileCard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows an empty state when no profile is stored', () => {
    render(<ProfileCard />);
    expect(screen.getByText(/no profile yet/i)).toBeInTheDocument();
  });

  it('renders the stored profile', () => {
    setProfile({
      name: 'Sam',
      description: 'Tech reviewer',
      content_type: ['tech', 'reviews'],
      age: 25,
      gender: 'f',
      location: { country: 'Algeria', city: 'Algiers' },
      experience: { years: 1, months: 2, days: 3 },
    });

    render(<ProfileCard />);

    expect(screen.getByText('Sam')).toBeInTheDocument();
    expect(screen.getByText('Tech reviewer')).toBeInTheDocument();
    expect(screen.getByText('tech')).toBeInTheDocument();
    expect(screen.getByText(/algiers/i)).toBeInTheDocument();
  });
});