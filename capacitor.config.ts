import type { CapacitorConfig } from "@capacitor/cli";

// Tequila Tao — native shell config.
// The built web app (dist/) is bundled INSIDE the APK/AAB, so the app runs
// fully on-device and offline — no dependency on the live Firebase site or the
// device's Chrome version. This mirrors the product's privacy-first philosophy.
const config: CapacitorConfig = {
  appId: "com.tequilatao.app",
  appName: "Tequila Tao",
  webDir: "dist",
  // Match the app's dark canvas so there is never a white flash between the
  // native splash and the first React paint.
  backgroundColor: "#0b0e1a",
  android: {
    // Allow non-HTTPS local asset loading (Capacitor serves from https://localhost).
    allowMixedContent: false,
    // Keep the WebView background dark to avoid a white flash on cold start.
    backgroundColor: "#0b0e1a",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 600,
      launchAutoHide: true,
      backgroundColor: "#0b0e1a",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0b0e1a",
      overlaysWebView: true,
    },
  },
};

export default config;
