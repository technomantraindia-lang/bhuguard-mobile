# Mobile API Integration — Pattern, Display IDs, Server Time

Local backend support prepared in `bhuguard-latest`. **Not deployed to live** in this run.

## Pattern authentication

| Method | URL | Auth | Role | Request | Success | Notes |
|--------|-----|------|------|---------|---------|-------|
| GET | `/api/auth/pattern/capability` | No | — | — | `{ pattern_supported: true }` | Capability probe |
| POST | `/api/auth/pattern/setup` | Sanctum | Farmer | `{ pattern_sequence }` (digits 0-8, min 4 unique) | user + flags | Stores bcrypt/argon hash |
| POST | `/api/auth/pattern/verify` | No | Farmer | `{ mobile, pattern_sequence }` | token + user | Locks after 5 fails / 15 min |
| POST | `/api/auth/pattern/change` | Sanctum | Farmer | `{ old_pattern, new_pattern }` | message | Requires old pattern |
| POST | `/api/auth/pattern/reset` | No* | Farmer | `{ mobile, pattern_sequence }` | message | After forgot-mpin OTP verify |

OTP verify (`POST /api/auth/login/verify-otp`) now includes:
- `pattern_supported`
- `has_pattern`
- `pattern_setup_required` (farmer without pattern)

DB (additive): `users.pattern_hash`, `pattern_failed_attempts`, `pattern_locked_until`. Preserves `mpin`.

## Display IDs

| Field | Format | Table |
|-------|--------|-------|
| `farmer_display_id` | `BHG-KISHAN-01`… | `farmers` (keeps `farmer_code`) |
| `artisan_display_id` | `BHG-ART-01`… | `artisans` (keeps `artisan_code`) |

Exposed optionally on `UserResource` farmer/artisan profiles.

## Server time

| Method | URL | Auth |
|--------|-----|------|
| GET | `/api/server-time` | Sanctum |

Response: `{ server_utc, unix }` in UTC.

## Mobile consumer

`bhuguard-mobile` `src/api/patternApi.ts` + capability detection; falls back to MPIN when live API lacks Pattern routes.
