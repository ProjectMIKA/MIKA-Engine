package com.projectmika.mikaengine;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

public class MainActivity extends Activity {
    private static final int REQ_OVERLAY_PERMISSION = 4096;
    private WebView fallbackWebView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();
        if (window != null) {
            window.setBackgroundDrawableResource(android.R.color.transparent);
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(Color.TRANSPARENT);
            window.setNavigationBarColor(Color.TRANSPARENT);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (Settings.canDrawOverlays(this)) {
                launchSystemOverlayAndClose();
                return;
            }
            Toast.makeText(
                this,
                "MIKA Engine: Enable 'Display over other apps' so MIKA can float over your screen!",
                Toast.LENGTH_LONG
            ).show();
            try {
                Intent intent = new Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + getPackageName())
                );
                startActivityForResult(intent, REQ_OVERLAY_PERMISSION);
                return;
            } catch (Exception ignored) {
            }
        } else {
            launchSystemOverlayAndClose();
            return;
        }

        startTranslucentInAppFallback();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQ_OVERLAY_PERMISSION) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && Settings.canDrawOverlays(this)) {
                launchSystemOverlayAndClose();
            } else {
                startTranslucentInAppFallback();
            }
        }
    }

    private void launchSystemOverlayAndClose() {
        Intent svc = new Intent(this, OverlayService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(svc);
        } else {
            startService(svc);
        }
        finish();
    }

    @SuppressLint({"SetJavaScriptEnabled", "AllowUniversalAccessFromFileURLs"})
    private void startTranslucentInAppFallback() {
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.TRANSPARENT);

        fallbackWebView = new WebView(this);
        fallbackWebView.setBackgroundColor(Color.TRANSPARENT);

        WebSettings settings = fallbackWebView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(false);

        fallbackWebView.setWebViewClient(new WebViewClient());
        fallbackWebView.setWebChromeClient(new WebChromeClient());

        root.addView(
            fallbackWebView,
            new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        );
        setContentView(root);
        fallbackWebView.loadUrl("file:///android_asset/index.html");
    }

    @Override
    protected void onDestroy() {
        if (fallbackWebView != null) {
            fallbackWebView.destroy();
            fallbackWebView = null;
        }
        super.onDestroy();
    }
}
