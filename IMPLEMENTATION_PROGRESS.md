# Bhuguard Client Changes — Implementation Progress

**Branch:** `office-rebuild-client-changes-2026-08`  
**Mobile:** `C:\Users\Admin\Desktop\bhuguard-mobile`  
**Local backend:** `C:\Users\Admin\Desktop\bhuguard-latest` (no live deploy in this run)  
**Live API:** `https://erp.bhuguard.com/api`

Status legend: ✅ PASS | ⚠️ PARTIAL | ❌ FAIL | ⏳ PENDING

## Environment baseline

| Item | Value |
|------|--------|
| Node (this machine) | v24.15.0 (target documented: v20.20.2 — not changed) |
| Expo | 56.0.17 |
| React Native | 0.85.3 |
| babel-preset-expo | 56.0.18 (via expo) |
| App version | 1.2.0 |
| Baseline recorded | 2026-08-03 |

---

## Phase 0 — Audit / tracker

| Requirement | Mobile files | Backend files | Test performed | Status | Remaining blocker |
|-------------|--------------|---------------|----------------|--------|-------------------|
| Create IMPLEMENTATION_PROGRESS.md with all requirements | IMPLEMENTATION_PROGRESS.md | — | File created | ✅ PASS | — |
| Exclude junk folders from TS scope | tsconfig.json | — | exclude list updated | ✅ PASS | — |
| Freeze Expo/RN/metro compatibility | metro.config.js, package-lock.json | — | Metro aligned to Expo default + TMPDIR workaround; no FileStore | ✅ PASS | — |

---

## Phase 1 — Application startup

| Requirement | Mobile files | Backend files | Test performed | Status | Remaining blocker |
|-------------|--------------|---------------|----------------|--------|-------------------|
| Remove small native centre splash image/logo | android/.../styles.xml, drawable-*/splashscreen_logo.png | — | Blank 1px logos copied to all densities; removed `icon_preferred` | ⚠️ PARTIAL | No adb device for cold-start visual verify |
| Native splash = clean brand background only | colors.xml, styles.xml, splash-native-blank.png | — | `#03150D` bg + matching icon bg color | ⚠️ PARTIAL | Device verify |
| Keep approved Bhuguard animated preloader | App.tsx, AnimatedLogoSplash.tsx | — | Kept as JS preloader (not removed) | ✅ PASS | — |
| Keep PreloaderScreen bootstrap | PreloaderScreen.tsx | — | Advances on API fail/timeout via navigateOnce | ✅ PASS | — |
| No white flash / no stuck splash on API failure | PreloaderScreen, splashHideGuard | — | hide before navigate; catch routeAfterPreloader | ⚠️ PARTIAL | Device offline/server-unavailable verify |
| Prevent double hideAsync | src/utils/splashHideGuard.ts | — | Once-per-runtime guard | ✅ PASS | — |

---

## Phase 2 — Language persistence

| Requirement | Mobile files | Backend files | Test performed | Status | Remaining blocker |
|-------------|--------------|---------------|----------------|--------|-------------------|
| Language Selection only when never selected | AuthStartupController.ts routeAfterPreloader | — | Code: skips when resolvePreferredLanguage() returns value | ⚠️ PARTIAL | No device for fresh-storage cold start |
| Persist across logout/OTP/restart/roles | languageStorage.ts; clearAuthStorage skips language keys | — | Confirmed logout does not clear language keys | ✅ PASS | Device restart verify recommended |
| Settings Change Language immediate | I18nContext.setLanguage + SettingsScreen | — | Persists device/scoped immediately | ✅ PASS | — |

---

## Phase 3 — Login screen redesign

| Requirement | Mobile files | Backend files | Test performed | Status | Remaining blocker |
|-------------|--------------|---------------|----------------|--------|-------------------|
| Premium light Farm local background | LoginBackground.tsx, assets/auth-environment-bg.jpg | — | Light gradient overlay on bundled farm image | ⚠️ PARTIAL | No adb device visual check |
| Outfit brand font + logo spacing | LoginScreen.tsx, Theme.ts, PhoneInput.tsx | — | Outfit fonts wired | ⚠️ PARTIAL | Device verify |
| Preserve OTP/validation/keyboard/a11y + Change Language | LoginScreen + ChangeLanguagePill | — | Pill restored; keyboard insets enabled | ⚠️ PARTIAL | Device keyboard check |

---

## Phase 4 — Fraud-prevention marquee

| Requirement | Mobile files | Backend files | Test performed | Status | Remaining blocker |
|-------------|--------------|---------------|----------------|--------|-------------------|
| Slim permanent marquee EN/HI for authenticated roles | FraudWarningMarquee.tsx, RoleAppLayout, Farmer/Officer/Artisan navigators | — | Mounted once via navigator layout; i18n keys added | ⚠️ PARTIAL | Device verify + reduced-motion |
| Hide on camera/viewer/boundary; reduced-motion | FRAUD_MARQUEE_HIDDEN_ROUTES + AccessibilityInfo | — | Route hide set + reduce-motion pause | ⚠️ PARTIAL | Device verify |

---

## Phase 5 — Farmer Pattern authentication

| Requirement | Mobile files | Backend files | Test performed | Status | Remaining blocker |
|-------------|--------------|---------------|----------------|--------|-------------------|
| Remove MPIN from Farmer onboarding; 3x3 Pattern UI | PatternLockPad, Set/PatternLogin/Change screens; FarmerBasicDetailsScreen | pattern endpoints (local) | UI + routing wired; capability detection; no fake success | ⚠️ PARTIAL | Live API Pattern not deployed; no device test |
| Setup/confirm/change/forgot via OTP; rate limit | patternApi, OtpVerification forgot_pattern, finishMobileLogin | Auth controllers | Code paths present | ⚠️ PARTIAL | Live deploy + device |
| Capability detection; no fake success | patternApi.capabilityFromAuthPayload / PatternUnsupportedError | — | Falls back to MPIN when unsupported | ✅ PASS | — |
| Preserve historical MPIN | onboarding no longer collects MPIN | users.mpin kept | MPIN fields not deleted | ✅ PASS | — |

---

## Phase 6 — Business display IDs

| Requirement | Mobile files | Backend files | Test performed | Status | Remaining blocker |
|-------------|--------------|---------------|----------------|--------|-------------------|
| Farmer ID BHG-KISHAN-*; Artisan ID BHG-ART-* | displayIds.ts helpers (formatFarmerDisplayId/formatArtisanDisplayId); all local fabrication call sites removed (entityId.ts, onboardingNotes.ts, farmerActivityHelpers.ts, useFarmerProfileForm.ts) and rewired through the shared helper; ArtisanProfileScreen/ArtisanDashboardScreen/OnboardedFarmerView/FarmerOnboardingSuccess use it | additive display_id fields (mobile-latest local backend, see below) | `tsc --noEmit` clean for all touched files; grep confirms no remaining `BHG-FRM-`/`BG-F-`/`BG-BHG-FRM-` local fabrication; client prefers farmer_display_id/artisan_display_id/farmer_id_display, falls back to legacy code, else safe placeholder | ✅ PASS (mobile) | Backend live deploy + backfill for real BHG-KISHAN-*/BHG-ART-* values |
| Farm labels: Farm ID / Farmer ID only | OnboardedFarmerView, FarmerOnboardingSuccess, FarmerOnboardingReview, FarmerLandDetails; i18n locales already use "Farm ID"/"Farmer ID" | — | Repo-wide search confirms no remaining "Farmer Code"/"Farm Code"/"Artisan Code" UI text | ✅ PASS | — |

---

## Phase 7 — Farm Name

| Requirement | Mobile files | Backend files | Test performed | Status | Remaining blocker |
|-------------|--------------|---------------|----------------|--------|-------------------|
| Farm Name under Khasra; default BHG-{Name}-Farm-0N | FarmerLandDetailsScreen (field placed directly below Khasra Number), OnboardingContext (farm_name in draft + toFormData), displayIds.ts `defaultFarmName()`, onboardingValidation (farm_name required) | farms.farm_name (additive column, see backend doc) | Default seeds as `BHG-{SanitizedFarmerName}-Farm-01` (spaces stripped), editable before submit, `tsc --noEmit` clean | ✅ PASS (mobile) | Device/live submit verify |
| Show Farm Name across cards/mapping/biochar | FarmerOnboardingReviewScreen (Land details line), FarmerOnboardingSuccessScreen, OnboardedFarmerViewScreen, continueFarmerOnboarding params already threaded to boundary/biochar screens | — | Farm name flows from draft through onboarding review → success → farmer detail | ✅ PASS (core onboarding flow) | Downstream farmer/artisan module cards (non-onboarding) may still show farm_code only |

---

## Phase 8 — FO mandatory check-in

| Requirement | Mobile files | Backend files | Test performed | Status | Remaining blocker |
|-------------|--------------|---------------|----------------|--------|-------------------|
| Block dashboard until active check-in | FieldOfficerCheckInGate, useFieldOfficerMandatoryCheckIn, OfficerNavigator | FO check-in status API | Gate wired; fail-closed; duplicate submit lock | ⚠️ PARTIAL | No adb device |
| GPS + server time; no duplicates; no fake success | MandatoryCheckInScreen + hook | live check-in endpoint | Code uses server status; no device-time auth | ⚠️ PARTIAL | Device GPS test |

---

## Phase 9 — FO dashboard

| Requirement | Mobile files | Backend files | Test performed | Status | Remaining blocker |
|-------------|--------------|---------------|----------------|--------|-------------------|
| Farm Activity → My Activity; elevate Onboarding | OfficerDashboardSections.tsx | — | Quick actions reordered; primary highlight | ⚠️ PARTIAL | Device visual |
| Remove Visited Field / Pending Visit cards only | OfficerStatsGrid | data preserved | Cards removed from UI | ✅ PASS | — |

---

## Phase 10 — FO Farmer Onboarding (10.1–10.12)

| Requirement | Mobile files | Backend files | Test performed | Status | Remaining blocker |
|-------------|--------------|---------------|----------------|--------|-------------------|
| 10.1 Profile pic no timestamp; OK/Retry | proof/profile capture | — | — | ⏳ PENDING | — |
| 10.2 Ownership Owned/Leased/Shared/Other | land details | — | — | ⏳ PENDING | — |
| 10.3 Existing Agri Bio-Waste multi-select | land details + options API | options endpoint if any | — | ⏳ PENDING | — |
| 10.4 Evidence order Ownership→Farm Photos→Farmer+Farm | FarmerProofUploadScreen | evidence categories | — | ⏳ PENDING | — |
| 10.5 Consent before Review; show IDs/names | Consent + navigation order | — | — | ⏳ PENDING | — |
| 10.6 Mapping Pending only when genuinely pending | onboarding review/actions | — | — | ⏳ PENDING | — |
| 10.7 Read-only View Mapping | boundary preview/view | — | — | ⏳ PENDING | — |
| 10.8 Edit Boundary layout scroll/controls | FarmBoundaryManualDrawScreen | — | — | ⏳ PENDING | — |
| 10.9 Done = Back on read-only | navigation | — | — | ⏳ PENDING | — |
| 10.10 View Farm read-only selected farm | view farm screen | — | — | ⏳ PENDING | — |
| 10.11 Edit Farmer Profile; Add New Farm | final actions | farm create APIs | — | ⏳ PENDING | — |
| 10.12 Return from Farm Activity to Review | navigation params | — | — | ⏳ PENDING | — |

---

## Phase 11 — FO Add Artisan working areas

| Requirement | Mobile files | Backend files | Test performed | Status | Remaining blocker |
|-------------|--------------|---------------|----------------|--------|-------------------|
| Gujarat default; dependent dropdowns; WA multi-select merge | Add Artisan screens | artisan WA APIs | — | ⏳ PENDING | — |

---

## Phase 12 — Farmer module

| Requirement | Mobile files | Backend files | Test performed | Status | Remaining blocker |
|-------------|--------------|---------------|----------------|--------|-------------------|
| Farmer ID; map labels; Acre/Hectare; hide Bigha UI | farmer screens | — | — | ⏳ PENDING | — |
| Farm Activity visual reuse; OK/Retry; village stamp; pencil edit; Change Pattern | farmer screens | — | — | ⏳ PENDING | — |

---

## Phase 13 — Artisan mandatory check-in

| Requirement | Mobile files | Backend files | Test performed | Status | Remaining blocker |
|-------------|--------------|---------------|----------------|--------|-------------------|
| Same mandatory gate as FO for Artisan | ArtisanCheckInGate, useArtisanMandatoryCheckIn, ArtisanNavigator | artisan check-in API | Gate wired fail-closed | ⚠️ PARTIAL | Device GPS verify |

---

## Phase 19 — Server-authoritative time

| Requirement | Mobile files | Backend files | Test performed | Status | Remaining blocker |
|-------------|--------------|---------------|----------------|--------|-------------------|
| Sync server UTC; ±2min warning; audit metadata; offline submit block | serverTimeSync.ts, DeviceTimeWarningBanner, App.tsx | GET /api/server-time (local) | Sync on launch; suspicious banner; live endpoint may 404 | ⚠️ PARTIAL | Live deploy + full activity wiring |

---

## Phase 14 — Artisan dashboard

| Requirement | Mobile files | Backend files | Test performed | Status | Remaining blocker |
|-------------|--------------|---------------|----------------|--------|-------------------|
| Wallet / Help / Training / Farm Navigator | ArtisanDashboard | wallet/training if any | — | ⏳ PENDING | Wallet may be PARTIAL |

---

## Phase 15 — Artisan ID + Artisan Pro batches

| Requirement | Mobile files | Backend files | Test performed | Status | Remaining blocker |
|-------------|--------------|---------------|----------------|--------|-------------------|
| Display BHG-ART-*; Farm ID + Navigate Farm on Pro cards | artisan screens | display IDs | — | ⏳ PENDING | — |

---

## Phase 16 — Farm Navigator

| Requirement | Mobile files | Backend files | Test performed | Status | Remaining blocker |
|-------------|--------------|---------------|----------------|--------|-------------------|
| Search authorized farms; navigate GPS/Maps | ArtisanFarmLookupScreen | farm lookup | — | ⏳ PENDING | — |

---

## Phase 17 — Biochar Production

| Requirement | Mobile files | Backend files | Test performed | Status | Remaining blocker |
|-------------|--------------|---------------|----------------|--------|-------------------|
| Sequential steps; single start time; assigned kilns; GPS address; photo OK/Retry; resume; completion time; new batch; validation | biochar production screens/storage | kiln alloc, draft APIs | — | ⏳ PENDING | — |

---

## Phase 18 — Biochar Application

| Requirement | Mobile files | Backend files | Test performed | Status | Remaining blocker |
|-------------|--------------|---------------|----------------|--------|-------------------|
| Farmer→Farm→Mixing hierarchy; no initial Search; Add New → Farmer list | application screens | application APIs | — | ⏳ PENDING | — |

---

## Phase 19 — Server-authoritative time

| Requirement | Mobile files | Backend files | Test performed | Status | Remaining blocker |
|-------------|--------------|---------------|----------------|--------|-------------------|
| Sync server UTC; ±2min warning; audit metadata; offline submit block | timeSync service | server-time + audit | — | ⏳ PENDING | Live deploy |

---

## Phase 20 — Backend / Admin support (local only)

| Requirement | Mobile files | Backend files | Test performed | Status | Remaining blocker |
|-------------|--------------|---------------|----------------|--------|-------------------|
| Additive migrations/APIs for Pattern, IDs, check-in, time, kilns, WA, evidence, biochar | docs/mobile-api-integration.md | PatternAuthController, migrations, UserResource, server-time route | Local `migrate --force` DONE for pattern + display IDs; routes listed | ⚠️ PARTIAL | Not deployed to live; kiln/WA/biochar resume still pending |

---

## Phase 21 — UI/UX standards

| Requirement | Mobile files | Backend files | Test performed | Status | Remaining blocker |
|-------------|--------------|---------------|----------------|--------|-------------------|
| Cross-cutting premium UX / a11y / i18n / keyboard | various | — | — | ⏳ PENDING | — |

---

## Phase 22 — Performance

| Requirement | Mobile files | Backend files | Test performed | Status | Remaining blocker |
|-------------|--------------|---------------|----------------|--------|-------------------|
| Memoization, cancel stale, pagination, no duplicate submits | contexts/lists | — | — | ⏳ PENDING | — |

---

## Final delivery

| Requirement | Status | Remaining blocker |
|-------------|--------|-------------------|
| Standalone APK in BHUGUARD_OFFLINE_DELIVERY/mobile-release/ | ⏳ PENDING | — |
| Source/Backend/Docs ZIPs | ⏳ PENDING | — |
| FINAL reports | ⏳ PENDING | — |

---

## Safety confirmations (running)

- No destructive migrations run
- No live backend overwrite
- MapLibre/MapTiler packages retained
- No fabricated auth/IDs/balances
