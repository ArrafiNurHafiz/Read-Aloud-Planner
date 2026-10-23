import { describe, it, expect, beforeEach } from 'vitest';
import { SpeechCoordinator } from '../../src/frontend/speech.js';

describe('SpeechCoordinator', () => {
  let coordinator: SpeechCoordinator;

  beforeEach(() => {
    coordinator = new SpeechCoordinator();
  });

  it('updates speech rate safely within 0.5 and 2.0', () => {
    coordinator.setRate(3.5);
    expect(coordinator.getRate()).toBe(2.0);
    coordinator.setRate(0.2);
    expect(coordinator.getRate()).toBe(0.5);
    coordinator.setRate(1.5);
    expect(coordinator.getRate()).toBe(1.5);
  });

  it('handles stop without crashing when synthesis is inactive', () => {
    expect(() => coordinator.stop()).not.toThrow();
  });

  it('handles language changes', () => {
    coordinator.setLanguage('en-US');
    expect(coordinator.getLanguage()).toBe('en-US');
  });

  it('falls back gracefully in headless environment', () => {
    let started = false;
    let ended = false;
    const spoken = coordinator.speak(
      'Test audio',
      () => { started = true; },
      () => { ended = true; }
    );
    expect(spoken).toBe(false);
    expect(started).toBe(true);
    expect(ended).toBe(true);
  });
});
