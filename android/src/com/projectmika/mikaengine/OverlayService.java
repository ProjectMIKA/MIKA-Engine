package com.projectmika.mikaengine;

import android.annotation.SuppressLint;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.DisplayMetrics;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class OverlayService extends Service {
    public static final String ACTION_STOP_OVERLAY = "com.projectmika.mikaengine.STOP_OVERLAY";
    private static final String CHANNEL_ID = "mika_overlay_channel";
    private static final int NOTIFICATION_ID = 1042;
    // Tight 88x92dp hit-box around MIKA when idle/roaming/dragging so 98%+ of the phone screen is 100% pass-through
    private static final int COMPACT_W_DP = 88;
    private static final int COMPACT_H_DP = 92;
    // Medium 236x230dp box when speech bubble is showing (still leaves almost the entire phone screen clickable)
    private static final int BUBBLE_W_DP = 236;
    private static final int BUBBLE_H_DP = 230;

    private WindowManager windowManager;
    private WebView webView;
    private WindowManager.LayoutParams params;
    private Handler mainHandler;
    private float density = 1.0f;
    private int screenWidthDp = 400;
    private int screenHeightDp = 800;

    // Hardware physical touch tracking (immune to WebView viewport shifts during window movement)
    private volatile float downRawX = 0f;
    private volatile float downRawY = 0f;
    private volatile float downTouchXDp = 120f;
    private volatile float downTouchYDp = 300f;
    private volatile float lastTouchXDp = 120f;
    private volatile float lastTouchYDp = 300f;
    private int lastSizeMode = 0;
    private boolean lastNeedKeyboard = false;

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        mainHandler = new Handler(Looper.getMainLooper());
        windowManager = (WindowManager) getSystemService(Context.WINDOW_SERVICE);
        updateScreenMetrics();
        startForegroundNotification();
        createOverlayWebView();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP_OVERLAY.equals(intent.getAction())) {
            stopForeground(true);
            stopSelf();
            return START_NOT_STICKY;
        }
        return START_STICKY;
    }

    @SuppressWarnings("deprecation")
    private void updateScreenMetrics() {
        DisplayMetrics dm = new DisplayMetrics();
        if (windowManager != null && windowManager.getDefaultDisplay() != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1) {
                windowManager.getDefaultDisplay().getRealMetrics(dm);
            } else {
                windowManager.getDefaultDisplay().getMetrics(dm);
            }
        } else {
            dm = getResources().getDisplayMetrics();
        }
        density = dm.density > 0 ? dm.density : 1.0f;
        screenWidthDp = Math.max(320, Math.round(dm.widthPixels / density));
        screenHeightDp = Math.max(480, Math.round(dm.heightPixels / density));
    }

    private void startForegroundNotification() {
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && nm != null) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "MIKA Avatar Overlay",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Keeps MIKA Chibi Proxy floating on top of your screen.");
            nm.createNotificationChannel(channel);
        }

        Intent stopIntent = new Intent(this, OverlayService.class);
        stopIntent.setAction(ACTION_STOP_OVERLAY);
        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            piFlags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent stopPending = PendingIntent.getService(this, 0, stopIntent, piFlags);

        Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? new Notification.Builder(this, CHANNEL_ID)
            : new Notification.Builder(this);

        Notification notification = builder
            .setContentTitle("MIKA Engine // Avatar Overlay Active")
            .setContentText("Tap notification to dismiss MIKA system overlay")
            .setSmallIcon(android.R.drawable.sym_def_app_icon)
            .setContentIntent(stopPending)
            .setOngoing(true)
            .build();

        startForeground(NOTIFICATION_ID, notification);
    }

    @SuppressLint({"SetJavaScriptEnabled", "AllowUniversalAccessFromFileURLs", "ClickableViewAccessibility"})
    private void createOverlayWebView() {
        int overlayType = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            : WindowManager.LayoutParams.TYPE_PHONE;

        int compactW = Math.round(COMPACT_W_DP * density);
        int compactH = Math.round(COMPACT_H_DP * density);

        params = new WindowManager.LayoutParams(
            compactW,
            compactH,
            overlayType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                | WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL
                | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN
                | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        );
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            params.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        }
        params.gravity = Gravity.TOP | Gravity.START;
        params.x = Math.round(60 * density);
        params.y = Math.round(260 * density);

        webView = new WebView(this);
        webView.setBackgroundColor(Color.TRANSPARENT);
        webView.setFocusable(true);
        webView.setFocusableInTouchMode(true);

        // Track hardware-raw finger deltas from ACTION_DOWN so dragging never feedback-loops when params.x/y move
        webView.setOnTouchListener(new View.OnTouchListener() {
            @Override
            public boolean onTouch(View v, MotionEvent event) {
                if (params != null && density > 0f) {
                    int action = event.getActionMasked();
                    if (action == MotionEvent.ACTION_DOWN) {
                        downRawX = event.getRawX();
                        downRawY = event.getRawY();
                        downTouchXDp = (params.x + event.getX()) / density;
                        downTouchYDp = (params.y + event.getY()) / density;
                        lastTouchXDp = downTouchXDp;
                        lastTouchYDp = downTouchYDp;
                    } else {
                        lastTouchXDp = downTouchXDp + ((event.getRawX() - downRawX) / density);
                        lastTouchYDp = downTouchYDp + ((event.getRawY() - downRawY) / density);
                    }
                }
                return false;
            }
        });

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        settings.setUseWideViewPort(false);
        settings.setSupportZoom(false);

        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());
        webView.addJavascriptInterface(new MikaAndroidBridge(), "mikaAndroid");

        try {
            windowManager.addView(webView, params);
            webView.loadUrl("file:///android_asset/index.html");
        } catch (Exception ignored) {
        }
    }

    public class MikaAndroidBridge {
        @JavascriptInterface
        public int getScreenWidth() {
            updateScreenMetrics();
            return screenWidthDp;
        }

        @JavascriptInterface
        public int getScreenHeight() {
            updateScreenMetrics();
            return screenHeightDp;
        }

        @JavascriptInterface
        public float getRawTouchX() {
            return lastTouchXDp;
        }

        @JavascriptInterface
        public float getRawTouchY() {
            return lastTouchYDp;
        }

        @JavascriptInterface
        public void syncOverlay(final int xDp, final int yDp, final boolean fullScreen, final boolean needKeyboard) {
            updateOverlayInternal(xDp, yDp, fullScreen ? 2 : 0, needKeyboard);
        }

        @JavascriptInterface
        public void syncOverlayMode(final int xDp, final int yDp, final int sizeMode, final boolean needKeyboard) {
            updateOverlayInternal(xDp, yDp, sizeMode, needKeyboard);
        }
    }

    private void updateOverlayInternal(final int xDp, final int yDp, final int sizeMode, final boolean needKeyboard) {
        mainHandler.post(new Runnable() {
            @Override
            public void run() {
                if (webView == null || params == null || windowManager == null) return;
                try {
                    updateScreenMetrics();
                    int flags = WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL
                        | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN
                        | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS;
                    if (!needKeyboard) {
                        flags |= WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE;
                    }

                    int targetW;
                    int targetH;
                    int targetX;
                    int targetY;

                    if (sizeMode >= 2) {
                        // Fullscreen interactive mode (Radial Menu, ASK, DIRECTOR_SETTINGS, Matrix Game)
                        targetW = WindowManager.LayoutParams.MATCH_PARENT;
                        targetH = WindowManager.LayoutParams.MATCH_PARENT;
                        targetX = 0;
                        targetY = 0;
                    } else if (sizeMode == 1) {
                        // Medium bubble box centered on MIKA
                        targetW = Math.round(BUBBLE_W_DP * density);
                        targetH = Math.round(BUBBLE_H_DP * density);
                        targetX = Math.round(xDp * density) - (targetW / 2);
                        targetY = Math.round(yDp * density) - (targetH / 2);
                    } else {
                        // Tight 88x92dp avatar hit-box around MIKA (idle, roaming, and dragging)
                        targetW = Math.round(COMPACT_W_DP * density);
                        targetH = Math.round(COMPACT_H_DP * density);
                        targetX = Math.round(xDp * density) - (targetW / 2);
                        targetY = Math.round(yDp * density) - (targetH / 2);
                    }

                    boolean modeChanged = (sizeMode != lastSizeMode);
                    boolean kbChanged = (needKeyboard != lastNeedKeyboard);
                    boolean changed = (params.width != targetW)
                        || (params.height != targetH)
                        || (params.x != targetX)
                        || (params.y != targetY)
                        || (params.flags != flags);

                    lastSizeMode = sizeMode;
                    lastNeedKeyboard = needKeyboard;

                    if (changed) {
                        params.width = targetW;
                        params.height = targetH;
                        params.x = targetX;
                        params.y = targetY;
                        params.flags = flags;
                        windowManager.updateViewLayout(webView, params);
                    }

                    if (needKeyboard && kbChanged) {
                        webView.requestFocus();
                    }

                    if (modeChanged && webView != null) {
                        webView.post(new Runnable() {
                            @Override
                            public void run() {
                                if (webView != null) {
                                    webView.evaluateJavascript("window.dispatchEvent(new Event('resize'))", null);
                                }
                            }
                        });
                    }
                } catch (Exception ignored) {
                }
            }
        });
    }

    @Override
    public void onDestroy() {
        if (webView != null && windowManager != null) {
            try {
                windowManager.removeView(webView);
            } catch (Exception ignored) {
            }
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
