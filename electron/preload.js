const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('cludariDesktop', {
  platform: process.platform,
  isElectron: true,
});
