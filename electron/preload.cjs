const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mikaDesktop', {
    platform: process.platform,
    updateMikaBounds: (bounds) => {
        ipcRenderer.send('mika:update-bounds', bounds);
    },
    setIgnoreMouseEvents: (ignore, options) => {
        ipcRenderer.send('mika:set-ignore-mouse-events', Boolean(ignore), options || { forward: true });
    },
    setAlwaysOnTop: (flag) => {
        ipcRenderer.send('mika:set-always-on-top', Boolean(flag));
    },
    setStageMode: (mode) => {
        ipcRenderer.send('mika:set-stage-mode', mode);
    },
    llmFetch: (url, options) => ipcRenderer.invoke('mika:llm-fetch', { url, options }),
    onCommand: (callback) => {
        if (typeof callback !== 'function') return () => {};
        const handler = (_event, cmd) => callback(cmd);
        ipcRenderer.on('mika:command', handler);
        return () => ipcRenderer.removeListener('mika:command', handler);
    },
});
