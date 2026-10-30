const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

// Enable transparent visuals on Linux & Windows
app.commandLine.appendSwitch('enable-transparent-visuals');

let mainWindow = null;
let tray = null;
let cursorPollInterval = null;
let liveMikaBounds = {
    x: 240,
    y: 420,
    radius: 95,
    modalOpen: false,
};
let lastIgnoreState = null;

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
        tray.setToolTip('MIKA Engine // Always-On-Top Avatar Overlay');
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
                label: '⚙ Director Settings (LLM Uplink)',
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

function startCursorHitTestLoop() {
    if (cursorPollInterval) clearInterval(cursorPollInterval);
    cursorPollInterval = setInterval(() => {
        if (!mainWindow || mainWindow.isDestroyed()) return;
        try {
            if (liveMikaBounds.modalOpen) {
                if (lastIgnoreState !== false) {
                    lastIgnoreState = false;
                    mainWindow.setIgnoreMouseEvents(false);
                }
                return;
            }
            const cursor = screen.getCursorScreenPoint();
            const winBounds = mainWindow.getBounds();
            const localX = cursor.x - winBounds.x;
            const localY = cursor.y - winBounds.y;
            const dist = Math.hypot(localX - liveMikaBounds.x, localY - liveMikaBounds.y);
            const insideMika = dist <= (liveMikaBounds.radius || 95);
            const shouldIgnore = !insideMika;
            if (shouldIgnore !== lastIgnoreState) {
                lastIgnoreState = shouldIgnore;
                mainWindow.setIgnoreMouseEvents(shouldIgnore, { forward: true });
            }
        } catch {
            // ignore transient display query errors
        }
    }, 33);
}

function createWindow() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { x, y, width, height } = primaryDisplay.workArea;

    mainWindow = new BrowserWindow({
        width,
        height,
        x,
        y,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        hasShadow: false,
        resizable: false,
        skipTaskbar: false,
        backgroundColor: '#00000000',
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    try {
        mainWindow.setAlwaysOnTop(true, 'screen-saver');
        mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    } catch {
        // ignore WM-specific unsupported flags
    }

    const devUrl = process.env.MIKA_DEV_URL;
    if (devUrl) {
        mainWindow.loadURL(devUrl);
    } else {
        mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
    }

    startCursorHitTestLoop();

    mainWindow.on('closed', () => {
        if (cursorPollInterval) {
            clearInterval(cursorPollInterval);
            cursorPollInterval = null;
        }
        mainWindow = null;
    });
}

// IPC: Live MIKA Avatar Bounds for 30fps OS Cursor Click-Through Hit-Testing
ipcMain.on('mika:update-bounds', (_event, bounds) => {
    if (!bounds || typeof bounds !== 'object') return;
    liveMikaBounds = {
        x: Number(bounds.x) || 240,
        y: Number(bounds.y) || 420,
        radius: Number(bounds.radius) || 95,
        modalOpen: Boolean(bounds.modalOpen),
    };
});

// IPC: Desktop Overlay Click-Through Hit-Testing
ipcMain.on('mika:set-ignore-mouse-events', (_event, ignore, options) => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    try {
        if (liveMikaBounds.modalOpen) {
            mainWindow.setIgnoreMouseEvents(false);
            return;
        }
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

// IPC: Stage Mode (Always Overlay)
ipcMain.on('mika:set-stage-mode', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    try {
        const { x, y, width, height } = screen.getPrimaryDisplay().workArea;
        mainWindow.setBounds({ x, y, width, height });
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
