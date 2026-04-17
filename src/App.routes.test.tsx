import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const { fromMock, channelMock, removeChannelMock } = vi.hoisted(() => {
  const single = vi.fn().mockResolvedValue({ data: null, error: null });
  const eq = vi.fn(() => ({ single }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));

  const subscribe = vi.fn(() => ({ id: 'channel-id' }));
  const on = vi.fn(() => ({ subscribe }));
  const channel = vi.fn(() => ({ on }));
  const removeChannel = vi.fn();

  return {
    fromMock: from,
    channelMock: channel,
    removeChannelMock: removeChannel,
  };
});

vi.mock('./supabase', () => {
  return {
    supabase: {
      from: fromMock,
      channel: channelMock,
      removeChannel: removeChannelMock,
    },
  };
});

describe('App routes', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/cadastro');
    fromMock.mockClear();
    channelMock.mockClear();
    removeChannelMock.mockClear();
  });

  it('render cadastro page when path is /cadastro', async () => {
    render(<App />);

    expect(
      await screen.findByText(/deixe seus dados para mantermos contato/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar meu salve/i })).toBeInTheDocument();
  });
});
