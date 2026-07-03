# Bhuguard Mobile App

React Native **Expo** mobile client for Farmer, Company User, Field Officer, and Artisan roles.

## Related backend

Laravel API + admin lives in:

```
C:\Users\Admin\Desktop\bhuguard-latest
```

Full project documentation: **`../bhuguard-latest/docs/`** (especially [MODULE_MAP.md](../bhuguard-latest/docs/MODULE_MAP.md) and [DEPLOYMENT_GUIDE.md](../bhuguard-latest/docs/DEPLOYMENT_GUIDE.md)).

## Quick start

```bash
npm install
npx expo start --go --lan --clear
```

## Source layout

```
src/
├── api/           # API clients (auth, farmer, company, fieldOfficer, evidence, …)
├── components/    # Shared + role-specific UI
├── config/        # API URL, env
├── constants/     # Branding, checklist constants
├── hooks/         # Data hooks per screen
├── navigation/    # Root, Farmer, Company, Officer navigators + tab bars
├── screens/       # auth/, farmer/, company/, officer/, tabs/
├── services/      # Cross-cutting services (e.g. watermark)
├── storage/       # AsyncStorage helpers
├── theme/         # Colors, spacing, role themes
└── utils/         # Helpers
```

## API URL

Production default (baked into EAS production builds):

```
https://yourdomain.com/api
```

Replace `yourdomain.com` with your live HTTPS API domain before release.

Demo/staging (internal testing):

```
https://demo.bhuguard.com/api
```

Local development (same Wi‑Fi only) — copy `.env.example` → `.env.development`:

```
EXPO_PUBLIC_API_URL=http://YOUR-PC-IP:8000/api
```

Server Settings on the login screen can override the API URL without rebuilding.

## Android / Play Store readiness

| Item | Value |
|------|-------|
| App name | Bhuguard |
| Package | `com.bhuguard.app` |
| Production build | EAS `production` profile → AAB (`app-bundle`) |
| Preview APK | EAS `preview` or `demo` profile → APK |

### Android permissions used

- **Camera** — Biochar and evidence capture
- **Location** — Farm GPS, check-in, Artisan production tracking
- **Photo library / media** — Evidence image and video selection
- **Microphone** — Biochar process video recording
- **Biometric** — Secure login

### EAS Android build

**Cloud build** (uses EAS quota — free plan is limited per month):

```bash
npx eas-cli@latest build -p android --profile preview
npx eas-cli@latest build -p android --profile production
```

**Local build** (no EAS cloud quota — use when free plan limit is reached):

```bash
# Gradle APK on your PC (Android Studio required)
npm run build:production-apk

# Gradle AAB for Play Store on your PC
npm run build:production-aab

# Or EAS local build (same credentials, runs on your machine)
npm run build:eas:local:android
```

Output APK/AAB is copied to `releases/`.

## iOS / App Store readiness

| Item | Value |
|------|-------|
| App name | Bhuguard |
| Bundle ID | `com.bhuguard.app` |
| Apple Developer Account | Required for TestFlight / App Store |
| Production API URL | Required — HTTPS live domain |
| Privacy Policy URL | Required for App Store Connect |
| Support URL / email | Required for App Store Connect (e.g. support@bhuguard.com) |

### iOS permissions used

- **Camera** — Biochar activity, farm, feedstock, moisture, production, and evidence images
- **Location (when in use)** — Farm verification, Biochar GPS, Field Officer check-in, Artisan production location
- **Photo library** — Select and upload evidence images
- **Microphone** — Biochar process video recording
- **Face ID** — Secure biometric login

Push notifications are **not** used natively; in-app notifications are fetched from the API.

### EAS iOS build

```bash
npm install
npx tsc --noEmit
npm install -g eas-cli
eas login
eas build:configure
npx eas-cli@latest build -p ios --profile production
```

Submit to App Store / TestFlight after a successful build:

```bash
eas submit -p ios --profile production
```

## Typecheck

```bash
npx tsc --noEmit
```
