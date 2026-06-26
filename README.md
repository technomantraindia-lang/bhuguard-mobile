# Bhuguard Mobile App

React Native **Expo** mobile client for Farmer, Company User, and Field Officer roles.

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

## Local API URL

Copy `.env.example` → `.env.development` and set:

```
EXPO_PUBLIC_API_URL=http://YOUR-PC-IP:8000/api
```

Phone and PC must be on the same Wi‑Fi when using LAN IP.

## Typecheck

```bash
npx tsc --noEmit
```
