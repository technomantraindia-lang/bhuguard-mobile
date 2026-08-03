# APK Install Notes

**Status:** First local `assembleRelease` **FAILED** (Windows MAX_PATH via long `cursor-sandbox-cache` Gradle path). Retry started with `GRADLE_USER_HOME=C:\g` and short `TEMP=C:\t`.

**Expected output locations after success:**
- `android/app/build/outputs/apk/release/app-release.apk`
- Copy to `releases/Bhuguard-v1.2.0-production.apk` and `BHUGUARD_OFFLINE_DELIVERY/mobile-release/` with SHA-256

**API baked in by script defaults:**
- `EXPO_PUBLIC_API_URL=https://erp.bhuguard.com/api`
- `EXPO_PUBLIC_APP_URL=https://erp.bhuguard.com`

**Install verification checklist (device required):**
1. Metro / Expo Go stopped
2. Install standalone APK (not dev-client)
3. Cold start → solid splash → animated preloader → language/login
4. Confirm live API base URL is production
5. Record SHA-256 of the delivered APK file

**Current blocker if APK missing:** build still running or failed — see Gradle log; no adb device was attached during this delivery run.
