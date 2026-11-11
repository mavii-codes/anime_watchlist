import { describe, it, expect } from 'vitest';
import defaults from '../src/data/defaultCatalogue';

const VALID_STATUSES = ['Watching', 'Completed', 'Plan to Watch'];

describe('data/defaultCatalogue', () => {
  it('ships exactly 18 catalogue entries', () => {
    expect(defaults).toHaveLength(18);
  });

  it('gives every entry all required fields', () => {
    for (const entry of defaults) {
      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('title');
      expect(entry).toHaveProperty('genre');
      expect(entry).toHaveProperty('episodes');
      expect(entry).toHaveProperty('status');
      expect(entry).toHaveProperty('isFavorite');
      expect(entry).toHaveProperty('dateAdded');
      expect(entry).toHaveProperty('image');
    }
  });

  it('points every image at the bundled images/ folder', () => {
    for (const entry of defaults) {
      expect(entry.image.startsWith('images/')).toBe(true);
    }
  });

  it('only uses valid statuses', () => {
    for (const entry of defaults) {
      expect(VALID_STATUSES).toContain(entry.status);
    }
  });
});
