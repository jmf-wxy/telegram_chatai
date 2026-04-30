const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  loadConfig: () => ipcRenderer.invoke('config:load'),
  saveConfig: (cfg) => ipcRenderer.invoke('config:save', cfg),
  loadPrefs: () => ipcRenderer.invoke('prefs:load'),
  savePrefs: (prefs) => ipcRenderer.invoke('prefs:save', prefs),
  runtimeStatus: () => ipcRenderer.invoke('runtime:status'),
  start: () => ipcRenderer.invoke('runtime:start'),
  stop: () => ipcRenderer.invoke('runtime:stop'),
  restart: () => ipcRenderer.invoke('runtime:restart'),
  openLogsFolder: () => ipcRenderer.invoke('logs:openFolder'),
  onLog: (cb) => {
    ipcRenderer.removeAllListeners('logs:line');
    ipcRenderer.on('logs:line', (_e, line) => cb(line));
  }
});

