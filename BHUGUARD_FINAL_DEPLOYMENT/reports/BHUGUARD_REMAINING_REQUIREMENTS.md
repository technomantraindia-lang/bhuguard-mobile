# Bhuguard Remaining Requirements Matrix

**Branch:** `office-rebuild-client-changes-2026-08`  
**Audited:** 2026-08-04  
**Local API:** `http://192.168.1.11:8000/api`  
**Live API:** `https://erp.bhuguard.com/api`  
**adb devices this run:** none attached  

Status: ✅ PASS | ⚠️ PARTIAL | ❌ FAIL  
PASS requires implementation + connected navigation/API + validation + test evidence. Physical Android is marked PARTIAL when code is done but no device was available.

| ID | Requirement | Mobile Evidence | Backend Evidence | Test Evidence | Status | Remaining Work |
|----|-------------|-----------------|------------------|---------------|--------|----------------|
| 1 | Startup (no centre splash before preloader) | Transparent splash logos rewritten; styles keep brand bg | — | Asset rewrite; no adb | ⚠️ PARTIAL | Physical cold-start verify |
| 2 | Approved Bhuguard preloader | AnimatedLogoSplash + PreloaderScreen retained | — | Prior phases | ✅ PASS | — |
| 3 | Language persistence (first use only) | AuthStartupController + languageStorage | preferred language APIs | Code path | ⚠️ PARTIAL | Device fresh-install verify |
| 4 | Login screen (HD farm bg, logo, keyboard, env API) | LoginScreen / LoginBackground / env.ts | — | Code; no hard-coded exclusive URL | ⚠️ PARTIAL | Device visual/keyboard |
| 5 | Farmer onboarding complete flow | FO onboarding navigator + screens | FO farmer/farm APIs | FO onboarding tests prior | ⚠️ PARTIAL | Device E2E |
| 6 | Farmer profile photo (no stamp/crop, OK/Retry) | OnboardingPhotoUpload + capturePlainPhoto | — | Code review | ⚠️ PARTIAL | Camera device |
| 7 | Pattern authentication | PatternLockPad, Set/Login/Change; finishMobileLogin farmer→Pattern | PatternAuthController + migrations | Prior Pattern tests | ⚠️ PARTIAL | Remove MPIN login UX (this pass); device verify |
| 8 | Ownership type + Other text | FarmerLandDetails + ownership_other_detail | farms.ownership_other_detail | FO onboarding tests | ✅ PASS | Device UI |
| 9 | Existing Agri Bio-Waste | Land details multi-select | existing_farming_practice | Code | ✅ PASS | Device UI |
| 10 | Evidence order | FarmerProofUpload 3 sections | legal_agreement_photos[] | Code | ⚠️ PARTIAL | Camera device |
| 11 | Consent order + Continue | Consent after land; eligibility without farm_id deadlock | Consent OTP APIs | Consent fixes committed | ⚠️ PARTIAL | Device Continue |
| 12 | Farmer/Farm IDs | displayIds helpers; BHG-KISHAN / BHG-ART | display_id migrations | Prior tests | ⚠️ PARTIAL | Live backfill |
| 13 | Mapping view (read-only) | FarmBoundaryViewScreen / FarmerFarmBoundaryView | Farm boundaries | Code | ⚠️ PARTIAL | MapLibre device |
| 14 | Edit Boundary | FarmBoundaryManualDrawScreen | Boundary save APIs | Code | ⚠️ PARTIAL | Device draw |
| 15 | View Farm | Read-only map summary | — | Code | ⚠️ PARTIAL | Device |
| 16 | Done as Back | goBack() on Done | — | Code | ⚠️ PARTIAL | Device stack |
| 17 | Edit Farmer Profile | persistFieldOfficerFarmerProfile | PUT/PATCH FO farmers | Tests prior | ✅ PASS | Device |
| 18 | Add New Farm | beginAddNewFarmWithMapping | POST FO farms | Tests prior | ✅ PASS | Device |
| 19 | Mapping Pending CTA | OnboardedFarmerView gate | — | Code | ✅ PASS | Device |
| 20 | FO dashboard IA | OfficerDashboardSections | — | Code | ⚠️ PARTIAL | Device visual |
| 21 | Add Artisan | RegisterArtisanScreen | FO artisan APIs | Code | ⚠️ PARTIAL | Device |
| 22 | Working-area multi-select merge | WorkingAreaSelector | resolveWorkingVillages | Code | ✅ PASS | Live deploy |
| 23 | Farmer module | Farm cards, activity, labels | Farmer APIs | Phase 12 | ⚠️ PARTIAL | Device |
| 24 | Image capture OK/Retry | Evidence + profile flows | — | Code | ⚠️ PARTIAL | Camera |
| 25 | Village timestamp | livePhotoLocation / stamps | Evidence stamp APIs | Code | ⚠️ PARTIAL | Device GPS |
| 26 | Farmer profile pencil edit | FarmDetailHeader + profile edit | Farmer update | Code | ⚠️ PARTIAL | Device |
| 27 | Fraud marquee | FraudWarningMarquee + hide routes | — | Code | ⚠️ PARTIAL | Device |
| 28 | Change Pattern | ChangePatternScreen; farmer security | Pattern change API | Code | ✅ PASS | Device |
| 29 | Artisan mandatory check-in | ArtisanCheckInGate | /artisan/check-in | WorkSession tests | ⚠️ PARTIAL | Device GPS; fix session device_timestamp |
| 30 | FO mandatory check-in | FieldOfficerCheckInGate | FO check-in | Code | ⚠️ PARTIAL | Device GPS |
| 31 | Farm Navigator | ArtisanFarmLookup purpose navigate | ArtisanFarmSearchService | Code | ⚠️ PARTIAL | Maps device |
| 32 | Artisan ID | formatArtisanDisplayId | artisan_display_id | Phase 14 tests | ⚠️ PARTIAL | Live backfill |
| 33 | Artisan Pro Farm ID | ArtisanBiocharBatchesScreen | Batch summary farm fields | Code | ⚠️ PARTIAL | Live deploy |
| 34 | Navigate Farm | openGoogleMaps when GPS saved | — | Code | ⚠️ PARTIAL | Device Maps |
| 35 | Wallet | Controlled Coming Soon (no fabricate) | No wallet API | Phase14 | ⚠️ PARTIAL | Real API missing |
| 36 | Help & Support | Single ArtisanHelpSupport | — | Navigator audit | ⚠️ PARTIAL | Device |
| 37 | Biochar Training | Controlled Coming Soon | No training API | Phase14 | ⚠️ PARTIAL | Real content missing |
| 38 | Biochar Production | Process form + kiln gate + resume | Production APIs | Code | ⚠️ PARTIAL | Device E2E; FO free-text kiln fix |
| 39 | Assigned Kilns | Artisan picker only; remove DEFAULT_KILN | Kiln allocation | Code | ⚠️ PARTIAL | FO section picker-only this pass |
| 40 | GPS/address | Recapture + reverse geocode | — | Code | ⚠️ PARTIAL | Device |
| 41 | Image OK/Retry | Biochar evidence confirm | — | Code | ⚠️ PARTIAL | Camera |
| 42 | Resume process | Draft storage + Complete card | Draft APIs | Code | ⚠️ PARTIAL | Kill/resume device |
| 43 | Finish time | Server synced finish | — | Code | ⚠️ PARTIAL | Device |
| 44 | New Batch | Add New creates fresh batch | — | Code | ⚠️ PARTIAL | Device |
| 45 | Application hierarchy | Farmer→Farm→Mixing; no Search | Application APIs | Code | ⚠️ PARTIAL | Mixing Search hide this pass; device |
| 46 | Add New after Application | replace to farmer list | — | Code | ⚠️ PARTIAL | Device |
| 47 | Server-authoritative time | serverTimeSync + banner | GET /server-time | Code | ⚠️ PARTIAL | Device skew test |
| 48 | Device-time tampering warning | EN/HI timeSync strings | — | Strings present | ⚠️ PARTIAL | Device |
| 49 | Offline persistence | Queues + drafts | — | Code | ⚠️ PARTIAL | Offline device |
| 50 | Duplicate-submit prevention | Locks on submit/check-in | Idempotency uuids | Code | ⚠️ PARTIAL | Device double-tap |
| 51 | Final APK | Prior assembleRelease failed | — | No APK | ❌ FAIL | Rebuild release APK |
| 52 | Full QA | Run-Bhuguard-Full-Test 78P/14Partial/0Fail | Focused artisan/OTP tests | 2026-08-03 full QA | ⚠️ PARTIAL | Re-run after fixes |
| 53 | Live deployment preparation | Offline delivery ZIPs partial | Additive migrations local | Docs | ⚠️ PARTIAL | BHUGUARD_FINAL_DEPLOYMENT package |

## Immediate code work this session

1. Farmer login: Pattern/OTP only (remove MPIN/password cards); finishMobileLogin never CreateMpin for farmers  
2. ArtisanWorkSession check-in/out: buildTimeAuditMetadata / server synced stamps  
3. FO ProductionUnitSection: assigned kiln picker only  
4. Remove DEFAULT_ARTISAN_KILN_ID  
5. Mixing lookup: hide Search like Application  
6. ApiServerSettings: `__DEV__` only  
7. Transparent native splash icons  
8. Then QA, deploy package, APK attempt  
