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
    // Tight 92x98dp hit-box around MIKA when idle/roaming so 98%+ of the phone screen is 100% pass-through
    private static final int COMPACT_W_DP = 92;
    private static final int COMPACT_H_DP = 98;
    // Medium 250x220dp box when speech bubble is showing (still leaves almost the entire phone screen clickable)
    private static final int BUBBLE_W_DP = 250;
    private static final int BUBBLE_H_DP = 220;

    private WindowManager windowManager;
    private WebView webView;
    private WindowManager.LayoutParams params;
    private Handler mainHandler;
    private float density = 1.0f;
    private int screenWidthDp = 400;
    private int screenHeightDp = 800;

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

    private void updateScreenMetrics() {
        DisplayMetrics dm = getResources().getDisplayMetrics();
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

    @SuppressLint({"SetJavaScriptEnabled", "AllowUniversalAccessFromFileURLs"})
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
                | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        );
        params.gravity = Gravity.TOP | Gravity.START;
        params.x = Math.round(60 * density);
        params.y = Math.round(260 * density);

        webView = new WebView(this);
        webView.setBackgroundColor(Color.TRANSPARENT);

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
                        | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN;
                    if (!needKeyboard) {
                        flags |= WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE;
                    }

                    if (sizeMode >= 2) {
                        // Fullscreen interactive mode (Radial Menu, ASK, DIRECTOR_SETTINGS, Drag)
                        params.width = WindowManager.LayoutParams.MATCH_PARENT;
                        params.height = WindowManager.LayoutParams.MATCH_PARENT;
                        params.x = 0;
                        params.y = 0;
                    } else if (sizeMode == 1) {
                        // Medium bubble box centered on MIKA
                        int boxW = Math.round(BUBBLE_W_DP * density);
                        int boxH = Math.round(BUBBLE_H_DP * density);
                        params.width = boxW;
                        params.height = boxH;
                        params.x = Math.round(xDp * density) - (boxW / 2);
                        params.y = Math.round(yDp * density) - (boxH / 2);
                    } else {
                        // Tight 92x98dp avatar hit-box around MIKA so all surrounding screen area is clickable
                        int boxW = Math.round(COMPACT_W_DP * density);
                        int boxH = Math.round(COMPACT_H_DP * density);
                        params.width = boxW;
                        params.height = boxH;
                        params.x = Math.round(xDp * density) - (boxW / 2);
                        params.y = Math.round(yDp * density) - (boxH / 2);
                    }
                    params.flags = flags;
                    windowManager.updateViewLayout(webView, params);
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
