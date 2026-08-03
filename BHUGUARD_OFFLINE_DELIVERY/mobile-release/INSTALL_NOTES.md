# APK Install Notes

**Status:** ❌ Standalone production APK **not delivered** in this run.

## Attempts

1. `npm run build:production-apk` → **FAILED**  
   Cause: Windows MAX_PATH (`Filename longer than 260 characters`) because Gradle used a long `cursor-sandbox-cache` path.
2. Retry with `GRADLE_USER_HOME=C:\g` and `TEMP/TMP=C:\t` → **FAILED**  
   Cause: invalid Android resource backup files under `android/app/src/main/res/values/`  
   (`colors.xml.before-animated-logo-splash`, `styles.xml.before-animated-logo-splash`).  
   Files moved to `android/_resource_backups/`.
3. Second retry after moving backups → **interrupted** mid native compile (`expo-modules-core` / reanimated). No `app-release.apk` produced.

## Existing APK on disk (not this delivery)

- `releases/Bhuguard-v1.2.0-dev-client.apk` — **dev-client**, not standalone production Preview/Production. Do not treat as Phase 22 delivery APK.

## How to finish later (host machine, short paths)

```powershell
New-Item -ItemType Directory -Force -Path C:\g,C:\t | Out-Null
$env:GRADLE_USER_HOME='C:\g'; $env:TEMP='C:\t'; $env:TMP='C:\t'
cd C:\Users\Admin\Desktop\bhuguard-mobile
# Ensure no non-.xml files remain under android/app/src/main/res
npm run build:production-apk
```

Then copy APK to `BHUGUARD_OFFLINE_DELIVERY/mobile-release/`, compute SHA-256, install with Metro stopped against `https://erp.bhuguard.com/api`.

**API defaults for production script:**
- `EXPO_PUBLIC_API_URL=https://erp.bhuguard.com/api`
- `EXPO_PUBLIC_APP_URL=https://erp.bhuguard.com`
