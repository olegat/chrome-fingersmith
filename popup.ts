// -*- Mode: typescript; compile-command: "ninja" -*-
const toggle = document.getElementById('toggle') as HTMLInputElement;
const moveAll = document.getElementById('moveAll') as HTMLInputElement;

// Restore toggle states when popup opens
chrome.storage.local.get(['fingersmithEnabled', 'moveAllTouches'], (result: {
    fingersmithEnabled?: boolean;
    moveAllTouches?: boolean;
}) => {
    toggle.checked = Boolean(result.fingersmithEnabled);
    moveAll.checked = Boolean(result.moveAllTouches);
});

// When user flips the toggle
toggle.addEventListener('change', () => {
    const enabled = toggle.checked;

    // Persist the new state
    chrome.storage.local.set({ fingersmithEnabled: enabled });

    // Send message to active tab to enable/disable Fingersmith
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs: chrome.tabs.Tab[]) => {
        const activeTab = tabs[0];
        if (activeTab?.id !== undefined) {
            chrome.tabs.sendMessage(activeTab.id, {
                type: enabled ? 'enable' : 'disable',
            });
        }
    });
});

// Toggle move-all behavior
moveAll.addEventListener('change', () => {
    const moveAllTouches = moveAll.checked;

    chrome.storage.local.set({ moveAllTouches });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs: chrome.tabs.Tab[]) => {
        const activeTab = tabs[0];
        if (activeTab?.id !== undefined) {
            chrome.tabs.sendMessage(activeTab.id, {
                type: 'setMoveAll',
                value: moveAllTouches,
            });
        }
    });
});
