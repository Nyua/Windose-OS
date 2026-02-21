import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

const STORAGE_KEY = 'windose_secrets_v1';

export const useSecretsStore = defineStore('secrets', () => {
    // Track whether the user has discovered the passwords.txt file
    const passwordsTxtSeen = ref(false);
    const passwordsTxtRevealPulse = ref(0);

    // Unlocks Ame's Corner tab in Control Panel
    const amesCornerUnlocked = ref(false);

    // Load from storage on init
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            passwordsTxtSeen.value = parsed.passwordsTxtSeen ?? false;
            amesCornerUnlocked.value = parsed.amesCornerUnlocked ?? false;
        }
    } catch (e) {
        console.warn('Failed to load secrets state', e);
    }

    // Persist to localStorage on change
    watch([passwordsTxtSeen, amesCornerUnlocked], () => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                passwordsTxtSeen: passwordsTxtSeen.value,
                amesCornerUnlocked: amesCornerUnlocked.value,
            }));
        } catch (e) {
            console.warn('Failed to save secrets state', e);
        }
    }, { deep: true });

    /**
     * Called when user opens passwords.txt in the Trash Bin.
     * This unlocks Ame's Corner in the Control Panel.
     */
    function markPasswordsSeen() {
        passwordsTxtSeen.value = true;
        amesCornerUnlocked.value = true;
        passwordsTxtRevealPulse.value += 1;
    }

    /**
     * Reset all secrets (for testing/debug)
     */
    function reset() {
        passwordsTxtSeen.value = false;
        amesCornerUnlocked.value = false;
        passwordsTxtRevealPulse.value = 0;
        localStorage.removeItem(STORAGE_KEY);
    }

    return {
        passwordsTxtSeen,
        passwordsTxtRevealPulse,
        amesCornerUnlocked,
        markPasswordsSeen,
        reset
    };
});
