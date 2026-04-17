import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AboutTheSalve from './AboutTheSalve';

describe('AboutTheSalve', () => {
  it('render section title and core copy', () => {
    render(<AboutTheSalve />);

    expect(screen.getByRole('heading', { name: /o renascimento\s+da\s+salve/i })).toBeInTheDocument();
    expect(screen.getByText(/no fim, não é sobre quem a gente era/i)).toBeInTheDocument();
  });
});
