# Bhuguard Final Deployment Package

Generated: 2026-08-04  
Branches: `office-rebuild-client-changes-2026-08` (mobile + backend)

## Package layout

```
BHUGUARD_FINAL_DEPLOYMENT/
  mobile/                 # Changed mobile file list + notes
  backend/                # Changed backend file list + notes
  migrations/             # Additive migration PHP copies
  reports/                # Status / completion reports
  apk/                    # Release APK + SHA-256 (after build)
  deployment-readme/      # This guide + smoke / rollback
```

## Safety

Do **not** include or deploy:

- `.env` with secrets
- keystores / signing passwords
- `google-services.json` with production secrets (if any)
- database dumps with PII
- `node_modules` / `vendor`
- production logs
- OTP codes / tokens / MapTiler keys in free text docs

## Live targets

- Live API: `https://erp.bhuguard.com/api`
- Local API (dev only): `http://192.168.1.11:8000/api`

## Backend deploy (live ERP)

1. **Backup database** (mysqldump or host panel backup) before migrate.
2. **Backup storage** (`storage/app` evidence + consent media).
3. Pull / sync only verified branch files (do not wipe live tree).
4. Copy additive migrations from `migrations/`.
5. On live server:

```bash
cd /www/wwwroot/erp.bhuguard.com
php artisan down
php artisan migrate --force
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan up
```

6. Confirm `.env` keys (names only — set values on server):

```
DEMO_OTP_ENABLED=false
DEMO_OTP_CODE=
DEMO_OTP_ALLOWED_MOBILES=
```

Demo OTP must stay **disabled** on production unless explicitly allow-listed for demo mobiles.

## Mobile release APK

Release API must be `https://erp.bhuguard.com/api` (`EXPO_PUBLIC_APP_VARIANT=production`).

```bat
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
cd /d C:\Users\Admin\Desktop\bhuguard-mobile
npx expo export --platform android
cd android
gradlew.bat --stop
gradlew.bat clean
gradlew.bat assembleRelease --no-daemon --stacktrace
```

Output:

`android\app\build\outputs\apk\release\app-release.apk`

Copy to:

`BHUGUARD_FINAL_DEPLOYMENT\apk\Bhuguard-Production.apk`  
and `releases\Bhuguard-Production.apk`

Hash:

```bat
certutil -hashfile releases\Bhuguard-Production.apk SHA256
```

## Rollback

1. `php artisan down`
2. Restore DB backup taken before migrate
3. Restore previous application code tree
4. `php artisan migrate:rollback` **only** if the additive migrations are known-safe to reverse and no production data depends on new columns
5. Prefer restore-from-backup over destructive rollbacks
6. `php artisan optimize:clear && php artisan up`

## Post-deploy smoke test

- `GET /api/server-time` → 200
- Login OTP request/verify (demo disabled on live)
- Farmer Pattern setup/login
- FO check-in + onboarding open
- Artisan check-in + Farm Navigator search
- Biochar production kiln list (assigned only)
- Evidence upload + map tile load

## Known blockers

- No physical Android attached during final packaging (adb empty)
- Wallet / Training APIs absent → controlled Coming Soon (do not fabricate)
- Live ERP must still receive additive migrations + code sync
- APK status: see `apk/README.md` after assembleRelease
