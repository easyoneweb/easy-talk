import {
  app,
  BrowserWindow,
  ipcMain,
  nativeTheme,
  safeStorage,
  Tray,
  Menu,
  nativeImage,
  Notification,
  protocol,
  net,
} from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

// Register custom protocol before app is ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: { standard: true, secure: true, supportFetchAPI: true },
  },
]);

const STORE_PATH = path.join(app.getPath('userData'), 'secure-store.json');

// --- Secure Storage ---

function readStore(): Record<string, string> {
  try {
    if (!fs.existsSync(STORE_PATH)) return {};
    const encrypted = fs.readFileSync(STORE_PATH, 'utf-8');
    const decrypted = safeStorage.decryptString(
      Buffer.from(encrypted, 'base64'),
    );
    return JSON.parse(decrypted);
  } catch {
    return {};
  }
}

function writeStore(data: Record<string, string>): void {
  const json = JSON.stringify(data);
  const encrypted = safeStorage.encryptString(json);
  fs.writeFileSync(STORE_PATH, encrypted.toString('base64'), 'utf-8');
}

ipcMain.handle('secure-store:save', (_event, key: string, value: string) => {
  const store = readStore();
  store[key] = value;
  writeStore(store);
});

ipcMain.handle('secure-store:get', (_event, key: string) => {
  const store = readStore();
  return store[key] ?? null;
});

ipcMain.handle('secure-store:remove', (_event, key: string) => {
  const store = readStore();
  delete store[key];
  writeStore(store);
});

// --- Notifications ---

ipcMain.handle('notification:show', (_event, title: string, body: string) => {
  new Notification({ title, body }).show();
});

// --- Window Management ---

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Easy Talk',
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false, // Disable CORS — desktop app talks directly to Nextcloud
    },
  });

  const isDev = process.argv.includes('--dev');

  if (isDev) {
    mainWindow.loadURL('http://localhost:8081');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL('app://./index.html');
  }

  mainWindow.on('close', (event) => {
    // Minimize to tray instead of quitting, unless app is quitting
    if (tray && !isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray(): void {
  const iconPath = path.join(__dirname, '..', 'assets', 'icon.png');
  const icon = nativeImage
    .createFromPath(iconPath)
    .resize({ width: 16, height: 16 });
  tray = new Tray(icon);
  tray.setToolTip('Easy Talk');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show',
      click: () => mainWindow?.show(),
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        tray = null;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('click', () => mainWindow?.show());
}

function createAppMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Easy Talk',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [{ role: 'minimize' }, { role: 'close' }],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// --- App Lifecycle ---

app.on('before-quit', () => {
  isQuitting = true;
});

app.whenReady().then(() => {
  // Respect system dark mode preference so CSS prefers-color-scheme works
  nativeTheme.themeSource = 'system';

  // Serve dist/ folder via custom app:// protocol so absolute paths resolve correctly
  protocol.handle('app', (request) => {
    const url = new URL(request.url);
    const filePath = path.join(__dirname, '..', 'dist', url.pathname);
    return net.fetch(`file://${filePath}`);
  });

  createAppMenu();
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      mainWindow?.show();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
