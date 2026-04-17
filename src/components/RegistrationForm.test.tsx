import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RegistrationForm from './RegistrationForm';

const { insertMock, fromMock } = vi.hoisted(() => {
  const insert = vi.fn();
  const from = vi.fn(() => ({ insert }));
  return { insertMock: insert, fromMock: from };
});

vi.mock('../supabase', () => ({
  supabase: {
    from: fromMock,
  },
}));

describe('RegistrationForm', () => {
  beforeEach(() => {
    fromMock.mockClear();
    insertMock.mockReset();
    insertMock.mockResolvedValue({ error: null });
  });

  it('show validation error when decision with Jesus is not selected', async () => {
    render(<RegistrationForm />);

    fireEvent.change(screen.getByPlaceholderText(/seu nome completo/i), {
      target: { value: 'Maria Teste' },
    });
    fireEvent.change(screen.getByPlaceholderText(/\(00\) 00000-0000/i), {
      target: { value: '11999999999' },
    });
    fireEvent.click(screen.getByRole('button', { name: /enviar meu salve/i }));

    expect(
      await screen.findByText(/por favor, nos responda a seção/i),
    ).toBeInTheDocument();
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('submit data and render success message', async () => {
    render(<RegistrationForm />);

    fireEvent.change(screen.getByPlaceholderText(/seu nome completo/i), {
      target: { value: 'Maria Teste' },
    });
    fireEvent.change(screen.getByPlaceholderText(/\(00\) 00000-0000/i), {
      target: { value: '11999999999' },
    });
    fireEvent.click(
      screen.getByRole('button', {
        name: /tomei minha decisão e entreguei minha vida a jesus hoje/i,
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: /enviar meu salve/i }));

    await waitFor(() => expect(insertMock).toHaveBeenCalledTimes(1));
    expect(fromMock).toHaveBeenCalledWith('registrations');

    const payload = insertMock.mock.calls[0][0][0];
    expect(payload.name).toBe('Maria Teste');
    expect(payload.accepted_jesus).toBe(true);
    expect(payload.whatsapp).toBe('(11) 99999-9999');

    expect(
      await screen.findByRole('heading', { name: /glória a deus/i }),
    ).toBeInTheDocument();
  });
});
