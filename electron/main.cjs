const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

// Enable transparent visuals on Linux & Windows
app.commandLine.appendSwitch('enable-transparent-visuals');

let mainWindow = null;
let tray = null;

// 16x16 Cyberpunk Neon Cyan/Pink Cat-Ear Tray Icon (Data URL PNG fallback via SVG)
const TRAY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#050308" stroke="#00E5FF" stroke-width="2"/>
  <path d="M6 22 L8 8 L14 14 L18 14 L24 8 L26 22 Z" fill="#FF107A" stroke="#00E5FF" stroke-width="1.5"/>
  <circle cx="12" cy="18" r="2" fill="#39FF14"/>
  <circle cx="20" cy="18" r="2" fill="#39FF14"/>
</svg>`;

function createTray() {
    try {
        const icon = nativeImage.createFromDataURL(
            `data:image/svg+xml;base64,${Buffer.from(TRAY_SVG).toString('base64')}`
        );
        tray = new Tray(icon);
        tray.setToolTip('MIKA Engine // Autonomous Cyber-Familiar');
        const contextMenu = Menu.buildFromTemplate([
            {
                label: '⚡ Ask MIKA',
                click: () => {
                    mainWindow?.show();
                    mainWindow?.webContents.send('mika:command', 'open-ask');
                },
            },
            {
                label: '☄ Summon MIKA (Ceiling Drop)',
                click: () => {
                    mainWindow?.show();
                    mainWindow?.webContents.send('mika:command', 'summon-center');
                },
            },
            {
                label: '◈ Toggle Overlay / Cyber-Stage',
                click: () => {
                    mainWindow?.show();
                    mainWindow?.webContents.send('mika:command', 'toggle-stage');
                },
            },
            {
                label: '⚙ Neural Uplink Settings',
                click: () => {
                    mainWindow?.show();
                    mainWindow?.webContents.send('mika:command', 'open-settings');
                },
            },
            { type: 'separator' },
            {
                label: 'Quit MIKA Engine',
                click: () => {
                    app.quit();
                },
            },
        ]);
        tray.setContextMenu(contextMenu);
    } catch {
        // Tray optional on headless/minimal WMs
    }
}

function createWindow() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    mainWindow = new BrowserWindow({
        width,
        height,
        x: 0,
        y: 0,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        hasShadow: false,
        resizable: true,
        skipTaskbar: false,
        backgroundColor: '#00000000',
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    mainWindow.setAlwaysOnTop(true, 'screen-saver');

    const devUrl = process.env.MIKA_DEV_URL;
    if (devUrl) {
        mainWindow.loadURL(devUrl);
    } else {
        mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// IPC: Desktop Overlay Click-Through Hit-Testing
ipcMain.on('mika:set-ignore-mouse-events', (_event, ignore, options) => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    try {
        mainWindow.setIgnoreMouseEvents(Boolean(ignore), options || { forward: true });
    } catch {
        // ignore
    }
});

// IPC: Always-On-Top Toggle
ipcMain.on('mika:set-always-on-top', (_event, flag) => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    try {
        mainWindow.setAlwaysOnTop(Boolean(flag), 'screen-saver');
    } catch {
        // ignore
    }
});

// IPC: Stage Mode Toggle
ipcMain.on('mika:set-stage-mode', (_event, mode) => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    try {
        if (mode === 'overlay') {
            const { width, height } = screen.getPrimaryDisplay().workAreaSize;
            mainWindow.setBounds({ x: 0, y: 0, width, height });
        } else {
            mainWindow.setIgnoreMouseEvents(false);
        }
    } catch {
        // ignore
    }
});

// IPC: Native Node Fetch Proxy (Bypass CORS for Local & Cloud LLMs)
ipcMain.handle('mika:llm-fetch', async (_event, { url, options }) => {
    try {
        const res = await fetch(url, {
            method: options?.method || 'GET',
            headers: options?.headers || {},
            body: options?.body,
        });
        const text = await res.text();
        return {
            ok: res.ok,
            status: res.status,
            text,
        };
    } catch (err) {
        return {
            ok: false,
            status: 0,
            text: String(err?.message || err || 'Network error'),
        };
    }
});

app.whenReady().then(() => {
    setTimeout(() => {
        createWindow();
        createTray();
    }, process.platform === 'linux' ? 250 : 0);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
