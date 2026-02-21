import { createPinia, setActivePinia } from 'pinia';
import { nextTick } from 'vue';
import { beforeEach, describe, expect, it } from 'vitest';
import { useSecretsStore } from './secrets';

describe('secrets store', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('marks passwords file as seen and unlocks Ame tab', async () => {
    const store = useSecretsStore();
    store.markPasswordsSeen();
    await nextTick();

    expect(store.passwordsTxtSeen).toBe(true);
    expect(store.passwordsTxtRevealPulse).toBe(1);
    expect(store.amesCornerUnlocked).toBe(true);

    const raw = localStorage.getItem('windose_secrets_v1');
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw ?? '{}')).toEqual({
      passwordsTxtSeen: true,
      amesCornerUnlocked: true,
    });
  });

  it('hydrates unlock state from storage', () => {
    localStorage.setItem(
      'windose_secrets_v1',
      JSON.stringify({ passwordsTxtSeen: true, amesCornerUnlocked: true }),
    );

    const store = useSecretsStore();
    expect(store.passwordsTxtSeen).toBe(true);
    expect(store.amesCornerUnlocked).toBe(true);
  });
});
