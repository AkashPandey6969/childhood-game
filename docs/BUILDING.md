# Building Gem Delver for Android

This guide provides instructions for building, running, and releasing **Gem Delver** on Android using Capacitor.

---

## 1. Prerequisites

Before building for Android, ensure you have the following installed:

- **Node.js**: v18.0.0 or higher (`node -v`)
- **Android Studio**: Iguana (2023.2), Jellyfish (2024.1), or later
- **Android SDK**: API Level 34 or 35 (Android 14 / 15) installed via Android Studio SDK Manager
- **Java Development Kit (JDK)**: OpenJDK 17 or 21 (bundled with modern Android Studio at `C:\Program Files\Android\Android Studio\jbr`)
- **Android Device / Emulator**: USB debugging enabled or an active AVD emulator

> **Tip for Windows Command Line**: If `JAVA_HOME` is not set on your machine, set it to Android Studio's bundled runtime:
> ```powershell
> $env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
> ```

---

## 2. Project Architecture & Setup

The web bundle is compiled to `./dist`, which Capacitor copies into the native Android Gradle project.

### Step 1: Install Dependencies & Build Web Assets
```powershell
npm install
npm run build
```

### Step 2: Initialize / Sync Android Platform
```powershell
npx cap add android   # Run once to generate the native Android project
npx cap sync android  # Syncs web assets and Capacitor configuration
```

---

## 3. Capacitor Configuration (`capacitor.config.ts`)

The native configuration is locked to:
- **App ID**: `com.gemdelver.game`
- **App Name**: `Gem Delver`
- **Web Directory**: `dist`
- **Orientation**: Portrait locked in `AndroidManifest.xml` (`android:screenOrientation="portrait"`)
- **Background Color**: `#0a0f1d`

---

## 4. Building a Debug APK

### Option A: Via Command Line (Recommended for CI / Fast Testing)
On Windows:
```powershell
cd android
.\gradlew.bat assembleDebug
```
On macOS / Linux:
```bash
cd android
./gradlew assembleDebug
```

The generated APK will be located at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

To install directly to a connected phone or running emulator:
```powershell
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### Option B: Via Android Studio
```powershell
npx cap open android
```
1. Wait for Gradle sync to complete.
2. Select your connected device or emulator in the target dropdown.
3. Click the green **Run (▶)** button (or press `Shift + F10`).

---

## 5. Building a Signed Release AAB (Google Play Store)

Google Play requires the **Android App Bundle (.aab)** format for all new applications.

### Step 1: Generate a Release Keystore
Run the following command once to generate your private signing key:
```powershell
keytool -genkey -v -keystore gem-delver-release.keystore -alias gemdelver -keyalg RSA -keysize 2048 -validity 10000
```
Store `gem-delver-release.keystore` in a secure location outside public version control.

### Step 2: Configure Gradle Signing
In `android/app/build.gradle`, add your signing configuration:
```groovy
android {
    ...
    signingConfigs {
        release {
            storeFile file("../../gem-delver-release.keystore")
            storePassword System.getenv("KEYSTORE_PASSWORD") ?: "YOUR_PASSWORD"
            keyAlias "gemdelver"
            keyPassword System.getenv("KEY_PASSWORD") ?: "YOUR_PASSWORD"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Step 3: Compile the Signed Release AAB
```powershell
npm run build
npx cap sync android
cd android
.\gradlew.bat bundleRelease
```

The resulting signed App Bundle will be located at:
```
android/app/build/outputs/bundle/release/app-release.aab
```

This `.aab` file is ready for direct upload to the Google Play Console Internal Testing track.

---

## 6. Mobile Controls & Verification Checklist

- [x] **Touch Swipes**: Up, Down, Left, Right swipe gestures handle 100% of player movement.
- [x] **On-Screen Touch Buttons**: Undo (`U`), Restart (`R`), and Pause (`ESC`) are fully interactive with generous 48px+ touch targets.
- [x] **No Keyboard Dependency**: All features, menus, level navigation, and gameplay function without any physical keyboard.
- [x] **Screen Orientation**: Fixed portrait mode (`portrait`) to prevent accidental layout rotation during play.
- [x] **Offline Capabilities**: 100% functional without cellular or Wi-Fi connectivity.
