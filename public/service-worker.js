const updateIcon = () => {
    chrome.storage.local.get().then(r => {
        let customIcon = r.customIcon;
        if (customIcon) {
            chrome.action.setIcon({path: customIcon});
        }
    })
};
chrome.runtime.onStartup.addListener(updateIcon);