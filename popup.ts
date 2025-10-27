// -*- Mode: typescript; compile-command: "ninja" -*-
const toggle = document.getElementById('toggle') as HTMLInputElement;

// Restore toggle state when popup opens
chrome.storage.local.get(['fingersmithEnabled'], (result) => {
    toggle.checked = Boolean(result['fingersmithEnabled']);
});

// When user flips the toggle
toggle.addEventListener('change', () => {
    const enabled = toggle.checked;

    // Persist the new state
    chrome.storage.local.set({ fingersmithEnabled: enabled });

    // Send message to active tab to enable/disable Fingersmith
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (activeTab?.id !== undefined) {
            chrome.tabs.sendMessage(activeTab.id, {
                type: enabled ? 'enable' : 'disable',
            });
        }
    });
});
