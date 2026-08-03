/**
 * Ensures native Android splash is a solid Bhuguard brand background
 * with a blank 1px centre icon (no small logo artwork).
 *
 * Safe to re-run after `npx expo prebuild`.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const blank = path.join(root, 'assets', 'splash-native-blank.png');
const densities = ['drawable-hdpi', 'drawable-mdpi', 'drawable-xhdpi', 'drawable-xxhdpi', 'drawable-xxxhdpi'];
const stylesPath = path.join(root, 'android', 'app', 'src', 'main', 'res', 'values', 'styles.xml');

if (!fs.existsSync(blank)) {
  console.error('[ensure-solid-android-splash] Missing assets/splash-native-blank.png');
  process.exit(1);
}

const androidRes = path.join(root, 'android', 'app', 'src', 'main', 'res');
if (!fs.existsSync(androidRes)) {
  console.warn('[ensure-solid-android-splash] android/ not present — skip (run after prebuild)');
  process.exit(0);
}

for (const density of densities) {
  const dir = path.join(androidRes, density);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.copyFileSync(blank, path.join(dir, 'splashscreen_logo.png'));
}

const solidStyles = `<?xml version="1.0" encoding="utf-8"?>
<resources xmlns:tools="http://schemas.android.com/tools">
  <style name="AppTheme" parent="Theme.AppCompat.DayNight.NoActionBar">
    <item name="android:editTextBackground">@drawable/rn_edit_text_material</item>
    <item name="colorPrimary">@color/colorPrimary</item>
    <item name="android:statusBarColor">@android:color/transparent</item>
    <item name="android:navigationBarColor">@android:color/transparent</item>
  </style>
  <!-- Solid brand background only — blank 1px icon, no centre logo artwork. -->
  <style name="Theme.App.SplashScreen" parent="Theme.SplashScreen">
    <item name="windowSplashScreenBackground">@color/splashscreen_background</item>
    <item name="windowSplashScreenAnimatedIcon">@drawable/splashscreen_logo</item>
    <item name="windowSplashScreenIconBackgroundColor">@color/splashscreen_background</item>
    <item name="postSplashScreenTheme">@style/AppTheme</item>
  </style>
</resources>
`;

if (fs.existsSync(stylesPath)) {
  // Preserve AppTheme parent/items when possible by only rewriting SplashScreen style block.
  let xml = fs.readFileSync(stylesPath, 'utf8');
  if (!xml.includes('windowSplashScreenIconBackgroundColor') || xml.includes('icon_preferred')) {
    xml = xml
      .replace(
        /<style name="Theme\.App\.SplashScreen"[\s\S]*?<\/style>/,
        `  <style name="Theme.App.SplashScreen" parent="Theme.SplashScreen">
    <item name="windowSplashScreenBackground">@color/splashscreen_background</item>
    <item name="windowSplashScreenAnimatedIcon">@drawable/splashscreen_logo</item>
    <item name="windowSplashScreenIconBackgroundColor">@color/splashscreen_background</item>
    <item name="postSplashScreenTheme">@style/AppTheme</item>
  </style>`,
      )
      .replace(/\s*<item name="android:windowSplashScreenBehavior">[^<]*<\/item>\s*/g, '\n');
    fs.writeFileSync(stylesPath, xml, 'utf8');
  }
} else {
  fs.mkdirSync(path.dirname(stylesPath), { recursive: true });
  fs.writeFileSync(stylesPath, solidStyles, 'utf8');
}

const launcherBg = path.join(androidRes, 'drawable', 'ic_launcher_background.xml');
if (fs.existsSync(path.dirname(launcherBg))) {
  fs.writeFileSync(
    launcherBg,
    `<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
  <item android:drawable="@color/splashscreen_background"/>
</layer-list>
`,
    'utf8',
  );
}

console.log('[ensure-solid-android-splash] Native splash set to solid brand background.');
