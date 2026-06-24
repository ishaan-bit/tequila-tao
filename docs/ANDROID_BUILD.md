# Android (AAB) build

Tequila Tao ships to Google Play as a **Capacitor**-wrapped Android app. The
built web app (`dist/`) is bundled **inside** the APK/AAB, so the app runs fully
on-device and offline — no dependency on the live Firebase site or the device's
Chrome version. This mirrors the product's privacy-first philosophy.

- **Min Android version:** 7.0 (API 24) — covers >99% of active devices.
- **Target:** Android 15 (API 36), edge-to-edge, all screen sizes & densities.
- **App ID:** `com.tequilatao.app`

## How a release is produced

GitHub Actions ([`.github/workflows/android-release.yml`](../.github/workflows/android-release.yml))
builds and **signs** the AAB. Two ways to trigger it:

| Trigger | versionName | Result |
| --- | --- | --- |
| Push a tag `vX.Y.Z` (e.g. `v3.0.1`) | `X.Y.Z` | Signed AAB uploaded as a build artifact |
| **Run workflow** (Actions tab, manual) | `package.json` version, or the optional input | Signed AAB artifact |

`versionCode` is the **workflow run number**, so it always increases (Play
rejects duplicate/decreasing codes). Download the `*.aab` from the run's
**Artifacts** section and upload it in the Play Console.

> If the signing secrets below are not set, the workflow still runs but the AAB
> is **debug-signed** — installable for testing, **not** uploadable to Play.

## One-time signing setup

### 1. Create an upload keystore (do this once, keep it safe forever)

```bash
keytool -genkeypair -v \
  -keystore upload-keystore.jks \
  -alias upload \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass "CHOOSE_A_STRONG_PASSWORD" \
  -keypass "CHOOSE_A_STRONG_PASSWORD" \
  -dname "CN=Tequila Tao, O=Tequila Tao, C=US"
```

⚠️ **Back this file and its passwords up.** If you lose the upload key you can
reset it via Play App Signing, but it's a hassle — store it in a password
manager. Never commit it (the repo `.gitignore` already blocks `*.jks`).

### 2. Base64-encode the keystore for the secret

```bash
# macOS / Linux
base64 -w0 upload-keystore.jks > keystore.b64
# Windows (PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("upload-keystore.jks")) | Set-Content keystore.b64
```

### 3. Add repository secrets

GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | contents of `keystore.b64` |
| `ANDROID_KEYSTORE_PASSWORD` | the store password from step 1 |
| `ANDROID_KEY_ALIAS` | `upload` |
| `ANDROID_KEY_PASSWORD` | the key password from step 1 |

That's it — push a `vX.Y.Z` tag (or run the workflow) and grab the signed AAB.

## Building locally (optional)

Requires JDK 17+ and the Android SDK (e.g. via Android Studio).

```bash
npm run cap:sync          # build web + copy assets into android/
cd android
# Release (debug-signed unless ANDROID_KEYSTORE_FILE etc. are exported):
./gradlew bundleRelease    # -> app/build/outputs/bundle/release/app-release.aab
# Quick installable APK for a device:
./gradlew assembleDebug    # -> app/build/outputs/apk/debug/app-debug.apk
```

To sign a local release build, export the same values the CI uses:

```bash
export ANDROID_KEYSTORE_FILE=/abs/path/upload-keystore.jks
export ANDROID_KEYSTORE_PASSWORD=...
export ANDROID_KEY_ALIAS=upload
export ANDROID_KEY_PASSWORD=...
./gradlew bundleRelease
```

## Regenerating launcher icons / splash

Source artwork is derived from the brand mark (`public/icon.svg`). To rebuild
every density after a brand change:

```bash
node scripts/gen-android-assets.mjs   # writes PNG sources into assets/
npm run cap:assets                    # @capacitor/assets -> android/.../res/
```

Then re-apply the adaptive-icon tweaks if `@capacitor/assets` overwrote them
(see `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher*.xml` — background
is a flat `@color/splash_background`, foreground carries its own padding).
