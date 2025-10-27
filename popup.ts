// -*- Mode: typescript; compile-command: "ninja" -*-
const toggle = document.getElementById('toggle') as HTMLInputElement;
const moveAll = document.getElementById('moveAll') as HTMLInputElement;

type FingersmithStorage = {
    fingersmithEnabled?: boolean;
    moveAllTouches?: boolean;
};

chrome.storage.local.get(['fingersmithEnabled', 'moveAllTouches'], (result: FingersmithStorage) => {
    toggle.checked = Boolean(result.fingersmithEnabled);
    moveAll.checked = Boolean(result.moveAllTouches);
});

toggle.addEventListener('change', () => {
    const enabled = toggle.checked;
    chrome.storage.local.set({ fingersmithEnabled: enabled });
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs: chrome.tabs.Tab[]) => {
        const activeTab = tabs[0];
        if (activeTab?.id !== undefined) {
            chrome.tabs.sendMessage(activeTab.id, {
                type: enabled ? 'enable' : 'disable',
            });
        }
    });
});

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
