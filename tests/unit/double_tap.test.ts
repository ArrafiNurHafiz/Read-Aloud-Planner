import { describe, it, expect, beforeEach } from 'vitest';
import { getAccessibleDescription, DoubleTapManager } from '../../src/frontend/double_tap_assist.js';

function createMockElement(opts: {
  id?: string;
  text?: string;
  tagName?: string;
  ariaLabel?: string;
  classList?: string[];
  href?: string;
}) {
  const classes = new Set(opts.classList || []);
  const el = {
    id: opts.id || '',
    innerText: opts.text || '',
    textContent: opts.text || '',
    tagName: (opts.tagName || 'button').toUpperCase(),
    getAttribute: (attr: string) => {
      if (attr === 'aria-label') return opts.ariaLabel || null;
      if (attr === 'href') return opts.href || null;
      return null;
    },
    classList: {
      contains: (c: string) => classes.has(c)
    },
    contains: (other: any) => other === el
  };
  return el as any as HTMLElement;
}

describe('DoubleTapManager & Accessible Description', () => {
  let manager: DoubleTapManager;

  beforeEach(() => {
    manager = new DoubleTapManager(true, 'en');
  });

  it('generates clear Indonesian spoken descriptions when lang is id', () => {
    const btn = createMockElement({
      id: 'btn-voice-add',
      text: 'Tambah via Suara (V)'
    });

    const desc = getAccessibleDescription(btn, 'id');
    expect(desc).toContain('Tombol');
    expect(desc).toContain('Tambah via Suara');
    expect(desc).toContain('Ketuk dua kali');
  });

  it('generates clear English spoken descriptions when lang is en', () => {
    const btn = createMockElement({
      id: 'btn-voice-add',
      text: 'Voice Add (V)'
    });

    const desc = getAccessibleDescription(btn, 'en');
    expect(desc).toContain('Voice Add Button');
    expect(desc).toContain('Double tap');
  });

  it('generates clear descriptions for schedule items in both languages', () => {
    const item = createMockElement({
      text: 'Senin, 08.00, Kuliah Basis Data, 2 jam, ruang 301.',
      classList: ['activity-linear-item'],
      tagName: 'li'
    });

    const descId = getAccessibleDescription(item, 'id');
    expect(descId).toContain('Kegiatan:');
    expect(descId).toContain('Kuliah Basis Data');

    const descEn = getAccessibleDescription(item, 'en');
    expect(descEn).toContain('Task:');
    expect(descEn).toContain('Double tap');
  });

  it('handles first click by reporting first tap and not executing action', () => {
    let executed = false;
    const btn = createMockElement({ text: 'Read Schedule' });

    const result = manager.handleClick(btn, () => {
      executed = true;
    });

    expect(result.shouldExecute).toBe(false);
    expect(executed).toBe(false);
    expect(result.announcement).toContain('Read Schedule Button');
  });

  it('executes action on second click within delay threshold', () => {
    let executed = false;
    const btn = createMockElement({ text: 'Read Schedule' });

    // First click
    manager.handleClick(btn, () => { executed = true; });
    expect(executed).toBe(false);

    // Second click immediately
    const secondResult = manager.handleClick(btn, () => { executed = true; });
    expect(secondResult.shouldExecute).toBe(true);
    expect(executed).toBe(true);
  });

  it('treats click as first click if delay threshold has expired', async () => {
    let executed = false;
    const btn = createMockElement({ text: 'Read Schedule' });

    // First click
    manager.handleClick(btn, () => { executed = true; }, 50);

    // Wait 70ms
    await new Promise((r) => setTimeout(r, 70));

    // Next click after timeout should again be treated as first click
    const nextResult = manager.handleClick(btn, () => { executed = true; }, 50);
    expect(nextResult.shouldExecute).toBe(false);
    expect(executed).toBe(false);
  });
});
