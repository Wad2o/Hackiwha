import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App routing', () => {
  it('redirects an unauthenticated visit to /app back to /login', () => {
    localStorage.clear();
    render(
      <MemoryRouter initialEntries={['/app']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
  });

  it('renders the register page at /register', () => {
    localStorage.clear();
    render(
      <MemoryRouter initialEntries={['/register']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
  });
});
