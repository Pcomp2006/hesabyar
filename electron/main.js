const { app, BrowserWindow, shell, Menu, dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

const PORT = parseInt(process.env.CLU_PORT || '8000', 10);
const HOST = '127.0.0.1';
const URL = `http://${HOST}:${PORT}`;

let mainWindow = null;
let pyProc = null;
let isQuitting = false;

function projectRoot() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'cludari');
  }
  return path.join(__dirname, '..');
}

function findPython() {
  if (process.env.CLU_PYTHON) return process.env.CLU_PYTHON;
  return process.platform === 'win32' ? 'python' : 'python3';
}

function startPythonServer() {
  const root = projectRoot();
  const serverScript = path.join(root, 'electron_server.py');
  const py = findPython();

  console.log('[CluDari] Project root:', root);
  console.log('[CluDari] Starting:', py, serverScript);

  const env = Object.assign({}, process.env, {
    CLU_HOST: HOST,
    CLU_PORT: String(PORT),
    PYTHONUTF8: '1',
  });

  pyProc = spawn(py, [serverScript], {
    cwd: root,
    env: env,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  pyProc.stdout.on('data', function (d) { console.log('[py]', d.toString().trim()); });
  pyProc.stderr.on('data', function (d) { console.error('[py]', d.toString().trim()); });
  pyProc.on('exit', function (code) {
    console.log('[CluDari] Python exited:', code);
    pyProc = null;
    if (!isQuitting && mainWindow) {
      dialog.showErrorBox('CluDari', 'سرور Python متوقف شد.\nPython server stopped.');
    }
  });
}

function waitForServer(maxMs) {
  maxMs = maxMs || 30000;
  const start = Date.now();
  return new Promise(function (resolve, reject) {
    function tryOnce() {
      const req = http.get(URL + '/api/dashboard', function (res) {
        res.resume();
        resolve();
      });
      req.on('error', function () {
        if (Date.now() - start > maxMs) reject(new Error('Server timeout'));
        else setTimeout(tryOnce, 300);
      });
      req.setTimeout(1000, function () { req.destroy(); });
    }
    tryOnce();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'CluDari - حسابداری شخصی',
    backgroundColor: '#0f172a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
  });

  mainWindow.once('ready-to-show', function () { mainWindow.show(); });
  mainWindow.loadURL(URL);

  mainWindow.webContents.setWindowOpenHandler(function (details) {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', function () { mainWindow = null; });
}

function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    }] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: function () { if (mainWindow) mainWindow.reload(); },
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'togglefullscreen' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'zoomin' },
        { role: 'zoomout' },
        { role: 'resetzoom' },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function stopPythonServer() {
  if (!pyProc) return;
  try {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(pyProc.pid), '/f', '/t']);
    } else {
      pyProc.kill('SIGTERM');
      setTimeout(function () {
        if (pyProc) {
          try { pyProc.kill('SIGKILL'); } catch (e) {}
        }
      }, 2000);
    }
  } catch (e) {
    console.error(e);
  }
  pyProc = null;
}

app.whenReady().then(async function () {
  buildMenu();
  startPythonServer();
  try {
    await waitForServer();
  } catch (e) {
    dialog.showErrorBox(
      'CluDari',
      'سرور Python بالا نیامد.\n\npip install -r requirements.txt\n\n' + e.message
    );
    app.quit();
    return;
  }
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    isQuitting = true;
    stopPythonServer();
    app.quit();
  }
});

app.on('before-quit', function () {
  isQuitting = true;
  stopPythonServer();
});
