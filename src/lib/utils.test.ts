import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('merge classes and resolve tailwind conflicts', () => {
    const result = cn('px-2 py-1', 'px-4', false && 'hidden', undefined);

    expect(result).toBe('py-1 px-4');
  });
});
