import { describe, it, expect } from 'vitest';
import { resolveImagePath, DEFAULT_POSTER } from '../src/utils/image';

describe('utils/image', () => {
  it('falls back to the default poster for empty or missing filenames', () => {
    expect(resolveImagePath('')).toBe('images/default.jpg');
    expect(resolveImagePath(undefined)).toBe('images/default.jpg');
  });

  it('prefixes bare filenames with images/', () => {
    expect(resolveImagePath('foo.jpg')).toBe('images/foo.jpg');
  });

  it('leaves paths that already start with images/ untouched', () => {
    expect(resolveImagePath('images/foo.jpg')).toBe('images/foo.jpg');
  });

  it('trims surrounding whitespace', () => {
    expect(resolveImagePath(' foo.jpg ')).toBe('images/foo.jpg');
  });

  it('exports the default poster path', () => {
    expect(DEFAULT_POSTER).toBe('images/default.jpg');
  });
});
