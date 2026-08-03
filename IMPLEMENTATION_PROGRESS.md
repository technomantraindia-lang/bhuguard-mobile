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
| Farmer ID BHG-KISHAN-*; Artisan ID BHG-ART-* | displayIds.ts helpers (formatFarmerDisplayId/formatArtisanDisplayId); all local fabrication call sites removed and rewired through the shared helper — entityId.ts, onboardingNotes.ts, farmerActivityHelpers.ts, useFarmerProfileForm.ts, ArtisanProfileScreen, ArtisanDashboardScreen, OnboardedFarmerView, FarmerOnboardingSuccess/Review, BiocharProductionSections, FarmerBiocharProductionScreen, FieldOfficerBiocharProductionScreen, ArtisanBiocharProductionScreen, inventoryMovementHelpers.ts, visitDetailModel.ts | additive display_id fields (mobile-latest local backend, see below) | `tsc --noEmit` clean for all touched files; repo-wide grep confirms no remaining `BHG-FRM-`/`BG-F-`/`BG-BHG-FRM-` local fabrication (only one illustrative TextInput placeholder string remains, never rendered as real data); client prefers farmer_display_id/artisan_display_id/farmer_id_display, falls back to legacy code, else safe placeholder | ✅ PASS (mobile) | Backend live deploy + backfill for real BHG-KISHAN-*/BHG-ART-* values |
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
| 10.1 Profile pic: no timestamp/GPS/village stamp; OK/Retry; no auto-advance | `OnboardingPhotoUpload.tsx` now calls `capturePlainPhoto()` (new, unstamped) instead of `captureLivePhotoEvidence`; pending-photo state renders an OK/Retry confirm step before committing to the draft | — | `tsc --noEmit` clean; reviewed capture path end-to-end | ⚠️ PARTIAL | Device camera verify (native capture UX) |
| 10.2 Ownership dropdown Owned/Leased/Shared/Other; Other → required text, cleared on option change | draft `ownership_other_detail` + create/additional-farm payloads | additive `farms.ownership_other_detail`; `required_if:ownership_type,other` | `FieldOfficerFarmerOnboarding` 25 passed | ✅ PASS | Device UI verify |
| 10.3 Rename → Existing Agri Bio-Waste; move below Service Interest; multi-select + Other custom | `FarmerLandDetailsScreen.tsx` (`AGRI_BIO_WASTE_OPTIONS`, chip multi-select, `parseAgriBioWaste`/`serializeAgriBioWaste` preserve prior single-value drafts), section re-ordered below Service Interest, `onboardingNotes.ts` label renamed | Backend field `existing_farming_practice` reused (comma-joined) — no schema change needed | `tsc --noEmit` clean; verified value round-trip preserves legacy single values | ✅ PASS (mobile) | Device UI verify |
| 10.4 Evidence order: 1 Ownership Document 2 Farm Photos (multi) 3 Farmer with Farm Photo | `FarmerProofUploadScreen.tsx` rebuilt into 3 ordered `AppCard` sections; new `farmer_with_farm_photo` field in `OnboardingContext.tsx` (draft + `toFormData` → `legal_agreement_photos[]`); `onboardingValidation.ts` requires Ownership Document when `ownership_type === 'owned'` | `legal_agreement_photos[]` accepts the extra file without change | `tsc --noEmit` clean | ⚠️ PARTIAL | Device camera verify for the 3 capture flows |
| 10.5 Consent before Review & Submit; show Farmer ID/Name, Farm ID/Name | `FarmerConsentScreen.tsx` and `FarmerOnboardingReviewScreen.tsx` both gained a "Registration Summary" identity card (`formatFarmerDisplayCode`/`formatFarmDisplayCode`); step order confirmed already Consent(5) → Land(4)... → Review(6) via `onboardingSteps.ts`/navigator — no reorder was needed | — | `tsc --noEmit` clean; step order re-verified against `FarmerOnboardingNavigator` | ✅ PASS (mobile) | Device UI verify |
| 10.6 Show "Complete Farm Mapping" only when mapping is genuinely pending | `OnboardedFarmerViewScreen.tsx`: button gated on `mappingPending` (`!mappingCompleted`, which itself requires `boundary_point_count >= 3` or `boundary_status === 'mapped'`) | — | `tsc --noEmit` clean; condition reviewed against API fields | ✅ PASS (mobile) | Device verify against live mapping statuses |
| 10.7/10.10 Read-only View Mapping / View Farm | New `FarmBoundaryViewScreen.tsx` (`src/screens/officer/boundary/`), registered in `OfficerNavigator.tsx` + `ArtisanNavigator.tsx` as `FarmBoundaryView`; renders `ManualBoundaryMap` with `currentLocation={null}` (no FO marker), `farmLocation={null}`, `phase="completed"`, fit-to-bounds on the single saved polygon only, summary card with farmer/farm IDs+names+area, no edit callbacks wired. Replaces old "View Saved Mapping" → `FarmBoundaryMap` (edit screen) links in `OnboardedFarmerViewScreen.tsx` and `FarmerOnboardingReviewScreen.tsx` | — | `tsc --noEmit` clean; MapLibre props audited against `MapLibreManualBoundaryMapInner.tsx`/`FoBoundaryMap.tsx` to confirm no interactive handlers fire in `completed` phase | ⚠️ PARTIAL | Full MapLibre device matrix (fit-bounds + read-only rendering on real GPS/map tiles) |
| 10.8 Edit Boundary: clear title, Done below controls, scrollable info, preserve Undo/Reset/Save/validation/MapLibre | `FarmBoundaryManualDrawScreen.tsx` header title switches to "Edit Boundary" once `persistedToBhuguard`/`editing`/`saved`/`save_failed`; `FoBoundaryActionFooter.tsx` reordered so in the `saved` state "Edit Boundary" → "View Farm Details" → **Done** (last); no changes to Undo/Reset/Save handlers, validation, or the MapLibre draw layer | — | `tsc --noEmit` clean; diffed footer/header only, drawing logic untouched | ⚠️ PARTIAL | MapLibre device verify (drag/undo/reset still smooth after footer reorder) |
| 10.9 Done on read-only view = back to origin (not restart onboarding) | `FarmBoundaryViewScreen.tsx` "Done"/back always calls `navigation.goBack()`, returning to whichever screen pushed it (`OnboardedFarmerView` or `FarmerOnboardingReview`) instead of any `reset`/restart action | — | `tsc --noEmit` clean; navigation stack reviewed (screen is always `navigate`d to, never used as a reset target) | ✅ PASS (mobile) | Device verify (back-stack behavior across both entry points) |
| 10.11 Add Edit Farmer Profile + Add New Farm with Mapping actions | `updateFieldOfficerFarmer` + `persistFieldOfficerFarmerProfile`; `beginAddNewFarmWithMapping` / `createFieldOfficerFarmerFarm` | `PUT|PATCH /field-officer/farmers/{farmer}`; `POST .../farms` | FO onboarding tests 25 passed; routes listed | ✅ PASS | Device E2E on physical Android |
| 10.12 Return from Farm Activity launched from Review back to Review context | `FarmerOnboardingReviewScreen.tsx` adds a "Log Farm Activity" action (shown once farmer/farm already persisted) → `FieldOfficerFarmActivityStart` → `FarmVerificationActivity`, all now carrying a `returnToReview` flag (`navigation/types.ts`); `FarmVerificationActivityScreen.tsx`'s dashboard/farm-activities exit actions call `navigation.navigate('FarmerOnboardingReview')` instead of `CommonActions.reset` when the flag is set, and the header back button already used `goBack()` (unaffected) | — | `tsc --noEmit` clean; traced the 3-screen param chain | ⚠️ PARTIAL | Device verify (live GPS check-in + evidence upload inside the Farm Activity flow itself) |

---

## Phase 11 — FO Add Artisan working areas

| Requirement | Mobile files | Backend files | Test performed | Status | Remaining blocker |
|-------------|--------------|---------------|----------------|--------|-------------------|
| State Gujarat default; District/Taluka/Village dependent dropdowns for home address | `RegisterArtisanScreen.tsx` uses shared `AddressSelector` (`state` defaults to `'Gujarat'` via `initialHomeAddress`); District→Taluka→Village cascade via `useAddressCascade` | — | `tsc`/lint clean; cascade re-used from existing Farmer/FO onboarding flows | ✅ PASS (mobile) | Device verify |
| Working Area multi-select MERGE (do not silently replace) | New `WorkingAreaSelector.tsx` component: pick District→Taluka→Village(s), "Add to working area" appends a per-taluka entry and unions village ids when the same taluka is re-added; per-village/per-taluka removal chips. Wired into both `RegisterArtisanScreen.tsx` (new artisan) and `ArtisanDetailScreen.tsx` (edit existing artisan — `startEditWorkingArea` now groups the artisan's current `working_villages` by taluka so re-opening the editor pre-seeds every existing taluka before any new one is merged in) | `FieldOfficerArtisanService::resolveWorkingVillages` — removed the "all working villages must belong to the same taluka" validation (now authorizes each village individually via `locationAuthorization->authorizeLocationIds`) so registration/update accept villages spanning multiple talukas | `tsc --noEmit` clean on all touched files; lints clean; traced payload — `working_taluka_id` (singular, backend filter) is only sent when the working area is confined to one taluka, `working_taluka_ids[]`/`working_village_ids[]` always carry the full merged set | ✅ PASS (mobile + local backend) | Live backend deploy of the relaxed validation; device verify |

---

## Phase 12 — Farmer module

| Requirement | Mobile files | Backend files | Test performed | Status | Remaining blocker |
|-------------|--------------|---------------|----------------|--------|-------------------|
| Use displayIds helpers; map labels Farm Name/Farmer Name | Farmer farm list/detail/map/add/edit/biochar/baseline labels use Farm Name / Farmer Name | — | Label sweep 2026-08-03 | ✅ PASS | Device visual |
| Acre/Hectare only — hide Bigha UI in farmer farms UI | `FarmBoundaryStartScreen.tsx`/`CameraBoundaryStartScreen.tsx` unit pickers already Acre/Hectare-only (Bigha excluded from `UNITS`); this session additionally removed the Bigha row from `FarmerFarmListCard.tsx` (`conversionRow` now shows Hectare only) and `FarmerHeroSummaryCard.tsx` (`landSecondaryRow` now shows Hectare only, dropped the `•`/Bigha text) | — | `tsc --noEmit` + lints clean on both edited components | ✅ PASS (mobile) | Device visual verify |
| Pencil editing / OK-Retry where feasible without huge redesign | `FarmDetailHeader` edit uses pencil; profile/evidence OK-Retry retained | — | Header icon + label polish | ✅ PASS | Profile-document OK/Retry still deferred |

---

## Phase 13 — Artisan mandatory check-in

| Requirement | Mobile files | Backend files | Test performed | Status | Remaining blocker |
|-------------|--------------|---------------|----------------|--------|-------------------|
| Mirror FieldOfficerCheckInGate; gate ArtisanNavigator dashboard; fail closed; no fake success | `ArtisanCheckInGate.tsx` (mirrors `FieldOfficerCheckInGate.tsx`'s phase machine: `checkingStatus` → `granted`/`blocked`/`statusError`), `useArtisanMandatoryCheckIn.ts` hook calls `getArtisanActiveCheckIn()`/`artisanWorkCheckIn()` against the real `/artisan/check-in` + `/artisan/active-check-in` endpoints (never trusts device time, never grants on a status/network error), wired around the whole `Stack.Navigator` in `ArtisanNavigator.tsx` so the dashboard and every other artisan screen are blocked until an active check-in is confirmed; hardware back button disabled while blocked; only Retry/Logout available. This session additionally fixed a state-sync gap: `ArtisanCheckInGate` now force-hydrates `ArtisanWorkSessionContext` once the gate grants access, so the per-activity `ensureCheckedInOrPrompt()` checks (Farm Lookup, Biochar Production/Mixing/Application) agree with the gate instead of re-prompting a second check-in | `/artisan/check-in`, `/artisan/active-check-in` (existing artisan work-session endpoints) | `tsc --noEmit` + lints clean; traced gate→session hydrate wiring end-to-end | ✅ PASS (mobile) | Device GPS verify |

---

## Phase 14 — Artisan dashboard

| Requirement | Mobile files | Backend files | Test performed | Status | Remaining blocker |
|-------------|--------------|---------------|----------------|--------|-------------------|
| 14.1 Mandatory check-in gate | `ArtisanCheckInGate`, `useArtisanMandatoryCheckIn` (strict `is_checked_in === true`) | `/artisan/check-in`, `/active-check-in` | ArtisanWorkSession 8/8 after message assert fix | ⚠️ PARTIAL | Physical Android GPS / out-of-zone device verify |
| 14.2–14.3 Dashboard IA + Continue Active Process | `ArtisanDashboardScreen` deduped cards; resume renamed; primary/secondary/field sections | dashboard adds kiln count + recent_batches | Phase14 dashboard test PASS | ⚠️ PARTIAL | Device E2E resume after kill |
| 14.4 Farm Navigator | primary card → `ArtisanFarmLookup` navigate | `/artisan/farms/search` | Existing search authz tests | ⚠️ PARTIAL | Device Maps verify |
| 14.5 Wallet | `ArtisanWallet` → controlled unavailable; fraud copy | No artisan wallet API | Phase14 asserts 404 wallet | ⚠️ PARTIAL | Real wallet API not available — must not mark PASS |
| 14.6 Training | `ArtisanTraining` → controlled unavailable | No mobile training API | Phase14 asserts 404 training | ⚠️ PARTIAL | Real training API not available |
| 14.7 Help & Support | single `ArtisanHelpSupport` route + fraud note | — | Navigator audit: one registration | ⚠️ PARTIAL | Device verify |
| 14.8–14.11 Profile ID / area / kilns / recent | display ID + kiln + recent cards | profile `artisan_display_id`; dashboard kiln/recent | ArtisanDashboardPhase14 PASS | ⚠️ PARTIAL | Device verify; live display_id backfill |
| 14.12–14.16 Nav/fraud/offline/perf/UX | RoleAppLayout marquee; load throttle; no-assignment banner | — | Code review + tsc no new errors in touched files | ⚠️ PARTIAL | Physical Android matrix |

---

## Phase 15 — Artisan ID + Artisan Pro batches

| Requirement | Mobile files | Backend files | Test performed | Status | Remaining blocker |
|-------------|--------------|---------------|----------------|--------|-------------------|
| Display Artisan ID via formatArtisanDisplayId | Already used in `ArtisanDashboardScreen.tsx`/`ArtisanProfileScreen.tsx`; this session closed a gap where the Field Officer's own `ArtisanDetailScreen.tsx` and `MyArtisansScreen.tsx` list rows displayed **no** artisan ID at all — added an "Artisan ID: {formatArtisanDisplayId(...)}" line to both | — | `tsc --noEmit` + lints clean | ✅ PASS (mobile) | Live BHG-ART-* backfill for real display IDs |
| Artisan Pro batch cards show Farm ID + Navigate Farm; preserve restrictions | `ArtisanBiocharBatchesScreen.tsx` cards now show a "Farm ID" line (`farm_code` falling back to `farm_id`) and a "Navigate Farm" button that opens Google Maps via `openGoogleMaps()`; button is disabled with a "GPS not saved for this farm" label (never invents coordinates) when the batch's farm has no lat/long. FO-only access to this screen unchanged | `FieldOfficerArtisanBatchService::summary()` extended (additive) to return `farm_id`, `farm_code`, `latitude`, `longitude` alongside existing fields; `listForOfficer()` already eager-loads the `farm` relation | `tsc --noEmit` + PHP reviewed; lints clean on the mobile screen | ✅ PASS (mobile + local backend) | Live backend deploy of the additive `summary()` fields |

---

## Phase 16 — Farm Navigator

| Requirement | Mobile files | Backend files | Test performed | Status | Remaining blocker |
|-------------|--------------|---------------|----------------|--------|-------------------|
| Extend ArtisanFarmLookupScreen: search Farm ID/Farmer Name; authorized only; Navigate Farm via Google Maps with saved GPS; clear errors if missing GPS | `ArtisanFarmLookupScreen.tsx` already supports a `purpose:'navigate'` mode (search box labelled "Search by Farm ID or Farmer Name", results restricted to `searchArtisanFarms()` which is scoped server-side to the artisan's allocated area) with a "Navigate Farm" action per result calling `openGoogleMaps()`; when `latitude`/`longitude` are missing, `navigateToFarm()` shows a clear alert — "This farm has no saved GPS coordinates. Navigation cannot invent a location." — instead of guessing or fabricating a location. Verified as already fully wired from an earlier phase in this same engagement; no code changes needed this session | `ArtisanController::searchFarms` → `ArtisanFarmSearchService::search($artisan, ...)` restricts results to the authenticated artisan's allocated villages/talukas only | `tsc --noEmit` + lints clean; traced authorization path end-to-end in the PHP service | ✅ PASS (mobile + local backend) | Device Maps app verify |

---

## Phase 17 — Biochar Production

| Requirement | Mobile files | Backend files | Test performed | Status | Remaining blocker |
|-------------|--------------|---------------|----------------|--------|-------------------|
| Sequential steps; single start time; assigned kilns; GPS address; photo OK/Retry; resume; completion time; new batch; validation | Removed `DEFAULT_ARTISAN_KILN_ID` soft-fill + FO `mappedUnits[0]` auto-pick; explicit kiln required | kiln alloc / draft APIs | Grep confirms no BHG-001 auto-set | ✅ PASS (mobile) | Device E2E + live kiln allocation |
| Final validation blocks incomplete submit | `ArtisanBiocharProcessFormContent.tsx` gained `onValidationChange(isComplete, missingItems)` (fires from the existing `missingItems` memo); `ArtisanBiocharProductionScreen.tsx` tracks `isFormComplete`, disables/greys the Submit button and shows "Complete all steps to submit" until every required step item is done, and re-blocks with an explanatory alert if `handleSubmit` is somehow invoked early | — | `tsc --noEmit` shows no new errors from these two files (verified by diffing against the pre-existing error baseline) | ✅ PASS (mobile) | Device E2E verify |
| Offline timestamp-sensitive submit block wired into Artisan Production submit | `useBiocharProductionForm.ts` submit path now calls `safeNetInfoIsConnected()` + `shouldBlockOfflineTimestampSubmit()` (from Phase 19 `serverTimeSync.ts`) and throws a clear EN message before building the offline submission snapshot when offline without a recent server-time sync; offline payload keeps time-audit fields | — | Reviewed guard placement (fires before any local/offline submission is queued) | ✅ PASS (mobile) | Device offline/online transition verify |

---

## Phase 18 — Biochar Application

| Requirement | Mobile files | Backend files | Test performed | Status | Remaining blocker |
|-------------|--------------|---------------|----------------|--------|-------------------|
| Farmer→Farm→Mixing hierarchy; no initial Search; Add New → Farmer list | FO deep-link loads mixings when `farmerId`+`farmId`; `mixingId` advances to submit | application APIs | Mixing load useEffect verified | ✅ PASS (mobile) | Device E2E verify |
| Artisan Biochar Application: remove initial Search, Farmer list → Farms → (Mixing) selection → submit, Add New → Farmer list | `ArtisanFarmLookupScreen.tsx` extends the existing mixing farmer→farm drilldown to `purpose === 'application'` (new `handleApplicationFarmerSelect`/`handleApplicationFarmSelect`, generalized `renderMixingResult` → `renderFarmerDrilldownResult(kind)`), hides the search box/taluka-village filters/Search button for `application`; `ArtisanBiocharApplicationScreen.tsx` rewritten to derive the selected farmer/farm entirely from route params (no in-screen search), and "Add New" now calls `navigation.replace('ArtisanFarmLookup', { purpose: 'application' })` instead of resetting local form state in place | application APIs (unchanged) | `tsc --noEmit` shows no new errors introduced by these two files vs. the pre-existing baseline; manually traced the farmer→farm→mixing-selection→submit param chain | ✅ PASS (mobile) | Device E2E verify (farmer list → farm → mixing pick → submit → Add New loop) |

---

## Phase 19 — Server-authoritative time

| Requirement | Mobile files | Backend files | Test performed | Status | Remaining blocker |
|-------------|--------------|---------------|----------------|--------|-------------------|
| Sync server UTC; ±2min warning; audit metadata; offline submit block | Wired into FO/Artisan application + mixing submits (+ production/check-in already) | GET /api/server-time | Helpers present on application/mixing submit paths | ✅ PASS (code) | Live deploy; remaining visit/inventory paths optional |

---

## Phase 20 — Backend / Admin support (local only)

| Requirement | Mobile files | Backend files | Test performed | Status | Remaining blocker |
|-------------|--------------|---------------|----------------|--------|-------------------|
| Additive migrations/APIs for Pattern, IDs, check-in, time, kilns, WA, evidence, biochar | docs/mobile-api-integration.md | PatternAuthController, migrations, UserResource, server-time route | Local `migrate --force` DONE for pattern + display IDs; routes listed | ⚠️ PARTIAL | Not deployed to live; kiln/WA/biochar resume still pending |
| 20.2 Login OTP end-to-end | `authApi.verifyLoginOtp` sends string OTP | DemoOtp allow-list + AuthController coerce; OtpService | LoginOtp/DemoOtpLogin tests PASS; live probe request 200 / wrong 422 / correct 200+token on `192.168.1.11:8000` | ✅ PASS (API) | No adb device for physical APK UI; use Server settings → local API |

---

## Phase 21 — UI/UX standards

| Requirement | Mobile files | Backend files | Test performed | Status | Remaining blocker |
|-------------|--------------|---------------|----------------|--------|-------------------|
| Cross-cutting premium UX / a11y / i18n / keyboard | login, marquee, gates, dashboard cards | — | Incremental polish across earlier phases | ⚠️ PARTIAL | Full device matrix + reduced-motion |

---

## Phase 22 — Performance

| Requirement | Mobile files | Backend files | Test performed | Status | Remaining blocker |
|-------------|--------------|---------------|----------------|--------|-------------------|
| Memoization, cancel stale, pagination, no duplicate submits | check-in gates, dashboard loaders, biochar draft resume | — | Duplicate-submit locks + silent resume helpers | ⚠️ PARTIAL | Broader list/map memoization pass |

---

## Gap-closure pass (2026-08-03 afternoon)

Closed audit PARTIAL/NOT items where code could be completed without live deploy:

- Phase 4 marquee hide routes expanded; Phase 9 Visited Field quick access removed; My Activity label.
- Phase 10.7/10.10 `UserLocation` suppressed on read-only maps.
- Phase 5: onboarding no longer sends MPIN; local backend MPIN optional; Forgot Pattern requests OTP first.
- Phase 10.11: `POST /field-officer/farmers/{farmer}/farms` + mobile `beginAddNewFarmWithMapping`.
- Phase 12.2/12.5/12.7: map labels, OK/Retry evidence confirm, pencil profile edit.
- Phase 17.3: kiln global fallback removed (empty list when unassigned).
- Phase 19: HI/GU `timeSync`, audit metadata helper, check-in/production offline blocks + shutter sync time.
- Phase 15 production records: Farm ID + Navigate Farm.
- `BHUGUARD_OFFLINE_DELIVERY/reports/FINAL_REQUIREMENT_STATUS.md` created.

### Gap-closure pass (2026-08-03 evening) — Phases 10/12/17/18/19 + OTP

- **OTP 20.2:** allow-listed env demo OTP; numeric OTP coerce; API probe on `http://192.168.1.11:8000/api` OK.
- **10.2/10.11:** `ownership_other_detail` column + `PUT/PATCH` farmer profile; mobile persist helpers.
- **12:** Farm Name / Farmer Name labels + pencil edit header.
- **17:** removed `DEFAULT_ARTISAN_KILN_ID` / FO first-unit auto-pick; offline audit fields retained.
- **18:** FO application deep-link loads mixings / optional `mixingId` → submit.
- **19:** application + mixing submits use `shouldBlockOfflineTimestampSubmit` + server-synced timestamps.

Still blocked: live ERP deploy; standalone release APK; full device matrix (no adb device attached this run).

## Final delivery

| Requirement | Status | Remaining blocker |
|-------------|--------|-------------------|
| Standalone APK in BHUGUARD_OFFLINE_DELIVERY/mobile-release/ | ❌ FAIL | assembleRelease failed twice then interrupted: (1) MAX_PATH via sandbox Gradle cache, (2) invalid `*.xml.before-*` under `res/values` (moved aside), (3) rebuild killed mid-native compile; no release APK/SHA-256; no adb device |
| Source/Backend/Docs ZIPs | ⚠️ PARTIAL | Lean ZIPs in `BHUGUARD_OFFLINE_DELIVERY/zips/` (src+config / additive backend / docs) |
| FINAL reports | ⚠️ PARTIAL | `FINAL_DELIVERY_REPORT.md` + **`FINAL_REQUIREMENT_STATUS.md` (added)** |

---

## Safety confirmations (running)

- No destructive migrations run
- No live backend overwrite
- MapLibre/MapTiler packages retained
- No fabricated auth/IDs/balances
