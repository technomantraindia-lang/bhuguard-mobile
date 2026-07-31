# Bhuguard Mobile

React Native (Expo) mobile client for **Farmer**, **Field Officer**, **Artisan / Artisan Pro**, and related Bhuguard field workflows.

This repository is intended for **private** multi-device development. Both the office desktop and other laptops talk to the same live Laravel API — no local Laravel or MySQL is required.

---

## 1. Project name

**bhuguard-mobile** (`com.bhuguard.app`)

---

## 2. Mobile project overview

| Area | Location |
|------|----------|
| API clients | `src/api/` |
| Screens | `src/screens/` |
| Navigation | `src/navigation/` |
| Config / API URL | `src/config/` |
| Offline / storage | `src/storage/` |
| Evidence / watermark | `src/services/`, `src/components/evidence/` |

Package manager: **npm** (`package-lock.json`).

---

## 3. Required software

On each computer:

- **Git**
- **Node.js** compatible with Expo SDK 56 (recommend current LTS; verify with `node -v`)
- **npm** (comes with Node)
- **Cursor** or **VS Code**
- **Expo Go** on a physical Android phone (for day-to-day UI testing)

Optional (only for native APK/AAB or emulator work):

- Android Studio + Android SDK
- Java / JDK used by Android Gradle builds
- EAS CLI (`npm i -g eas-cli`) for cloud builds

---

## 4. First-time installation

```powershell
git clone <PRIVATE_GITHUB_REPOSITORY_URL> bhuguard-mobile
cd bhuguard-mobile
npm install
Copy-Item .env.example .env
npx expo start -c
```

Then open the project in Expo Go (same network or tunnel) or a development build.

---

## 5. Environment configuration

Every computer must have a local `.env` (never committed):

```powershell
Copy-Item .env.example .env
```

Required values:

```env
EXPO_PUBLIC_APP_URL=https://erp.bhuguard.com
EXPO_PUBLIC_API_URL=https://erp.bhuguard.com/api
```

After creating or changing `.env`, restart Metro with cache clear:

```powershell
npx expo start -c
```

Add your MapTiler key in `.env` for Field Officer Hybrid maps (`EXPO_PUBLIC_MAPTILER_API_KEY`). Do not commit the real `.env`.

---

## 6. Starting Expo

```powershell
cd bhuguard-mobile
npx expo start -c
```

Useful scripts from `package.json`:

| Command | Purpose |
|---------|---------|
| `npm start` | Project start script |
| `npm run start:go` | Expo Go on LAN port 8081 |
| `npm run start:tunnel` | Expo Go via tunnel |
| `npm run start:dev-client` | Custom dev client |

---

## 7. Testing on a physical Android device

1. Install **Expo Go** (or your Bhuguard dev-client APK).
2. Ensure the phone can reach the Metro URL shown in the terminal (same Wi‑Fi for LAN, or use tunnel).
3. Scan the QR code.
4. Confirm login and dashboards load data from **https://erp.bhuguard.com/api**.

The phone does **not** need:

- Local Laravel
- Local MySQL
- Office desktop powered on
- Office LAN IP / port `8000`

---

## 8. Git synchronization workflow

### Before starting work (every computer)

```powershell
git pull origin main
```

> If your default branch is still `master`, use `git pull origin master` until the team standardizes on `main`.

### After completing and testing changes

```powershell
git status
git add .
git commit -m "Describe the completed change"
git pull --rebase origin main
git push origin main
```

**Rules**

- Never edit the same file on two computers without pulling first.
- Never use `git reset --hard` or `git push --force` unless explicitly requested and a backup exists.
- Do not commit `.env`, keystores, APK/AAB files, or tokens.

---

## 9. Production API URL

| Setting | Value |
|---------|--------|
| App / media origin | `https://erp.bhuguard.com` |
| API base URL | `https://erp.bhuguard.com/api` |

Client requests use paths such as `/auth/login` (no extra `/api` prefix). The Axios `baseURL` already includes `/api`, so URLs must not become `/api/api/...`.

Central config: `src/config/env.ts` and `src/config/apiConfig.ts`.

---

## 10. APK / AAB build instructions

Local scripts (Windows):

```powershell
npm run build:production-apk
npm run build:production-aab
npm run build:demo-apk
npm run build:dev-client
```

EAS profiles live in `eas.json` (`development`, `preview`, `demo`, `production`).

Signing credentials and any production keystore must stay **off GitHub**. Transfer them privately when needed (see security section).

---

## 11. Important security rules

**Never commit**

- `.env` / real API tokens / passwords / MPIN / OTP
- Android keystores (`*.jks`, `*.keystore`) and passwords
- `google-services.json` / `GoogleService-Info.plist`
- EAS / cloud tokens
- APK / AAB binaries
- Laravel `.env` or database credentials

**Do commit**

- Source under `src/`
- `package.json` / `package-lock.json`
- `app.json` / `app.config.js` / `eas.json` (without secrets)
- `.env.example` (public URLs + placeholders only)
- README and safe scripts

---

## 12. Troubleshooting

| Symptom | What to try |
|---------|-------------|
| App points at old tunnel / LAN URL | Delete app data or reset Server Settings; ensure `.env` uses `erp.bhuguard.com`; restart with `npx expo start -c` |
| `.env` not loading | Confirm file is named `.env` in project root; restart Metro with `-c` |
| Cannot reach API | Check phone internet; open `https://erp.bhuguard.com/up` in a browser |
| Module install errors | Delete `node_modules`, run `npm install` again |
| Git push rejected | `git pull --rebase origin main` then push; do not force-push |
| Map tiles blank | Set a real `EXPO_PUBLIC_MAPTILER_API_KEY` in local `.env` |

---

## Laptop setup (copy/paste)

```powershell
cd C:\Users\<LAPTOP_USERNAME>\Desktop
git clone <PRIVATE_GITHUB_REPOSITORY_URL> bhuguard-mobile
cd bhuguard-mobile
npm install
Copy-Item .env.example .env
# Edit .env and set MapTiler key if maps are required
npx expo start -c
```

---

## Recommended branch workflow (larger changes)

```powershell
git checkout -b feature/change-name
# ... implement and test ...
git add .
git commit -m "Complete change name"
git push -u origin feature/change-name
```

Merge to `main` only after the app opens and the related module works.

---

## Source layout

```
src/
├── api/
├── components/
├── config/
├── constants/
├── hooks/
├── navigation/
├── screens/
├── services/
├── storage/
├── theme/
└── utils/
```

---

## Related live backend

- Admin / ERP: https://erp.bhuguard.com  
- API: https://erp.bhuguard.com/api  

Backend code is maintained separately. This mobile repo must not modify Laravel, Admin Panel, or the production database.
