# Claire Tracker - Architecture

## Overview
Baby feeding and diaper tracker for Claire (born March 21, 2026). Web app + Alexa + Siri voice control.

## Tech Stack
- **Frontend**: Next.js 16 + Tailwind CSS (PWA)
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel
- **Voice**: Alexa Custom Skill + Siri Shortcuts

## URLs
- **App**: `https://claire-tracker.vercel.app`
- **GitHub**: `https://github.com/lkingl123/claire-tracker`
- **Supabase Project**: `heduhsvdhykbkfcsnury`

---

## Database Schema

### `feedings` table
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| type | TEXT | `bottle` or `breast_snack` |
| amount_ml | INTEGER | ml for both bottles AND snacks |
| duration_minutes | INTEGER | DEPRECATED - was for snack duration, now unused |
| notes | TEXT | Optional |
| fed_at | TIMESTAMPTZ | When the feed happened |
| created_at | TIMESTAMPTZ | Auto |

### `diapers` table
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| type | TEXT | `wet`, `dirty`, or `both` |
| notes | TEXT | Optional |
| changed_at | TIMESTAMPTZ | When the change happened |
| created_at | TIMESTAMPTZ | Auto |

**RLS**: Both tables have open policies (no auth required).

---

## API Endpoints

### `/api/speak` - Siri voice commands (MAIN ONE)
- **GET** `?q=bottle 30` or **POST** `{ q: "bottle 30" }`
- Returns **plain text** (not JSON) - Siri speaks it directly
- Commands: `bottle 30`, `snack 30`, `diaper pee`, `diaper poop`, `diaper both`, `status`, `last feed`, `undo`
- "diaper" alone asks for specificity (won't auto-log)
- "bottle" alone asks for ml amount
- Handles word numbers ("thirty" -> 30)

### `/api/alexa` - Alexa skill endpoint
- **POST** - receives Alexa request envelope, returns Alexa response JSON
- Invocation: "baby tracker"
- Signature verification was REMOVED (was blocking requests)
- Intents: LastFeedIntent, DailyStatusIntent, LogBottleIntent, LogSnackIntent, LogDiaperIntent, DiaperCountIntent, UndoIntent

### `/api/siri` - Advanced Siri with confirmation flow
- **POST** `{ q: "bottle 30" }` -> returns preview with `needsConfirm: true`
- **POST** `{ q: "yes", confirm: "bottle 30" }` -> actually logs it
- Status/last feed commands return immediately (no confirmation needed)
- NOT CURRENTLY USED by the shortcut - too complex for Shortcuts app

### `/api/voice` - Original voice API (JSON responses)
- Similar to `/api/speak` but returns JSON `{ speech: "..." }`
- Kept for backward compatibility

### `/api/quick` - Simple GET-based actions
- `?action=bottle&ml=60`, `?action=diaper&type=wet`, `?action=status`, `?action=last`
- Returns JSON

### `/api/status` - Full status JSON
- GET - returns today's feeding totals, diaper counts, time since last feed

---

## Alexa Skill Setup

### What FINALLY worked:
1. **Delete the first skill** - it was created with "Start from Scratch" template which auto-created a Lambda. Even after switching to HTTPS, it kept saying "not supported on this device"
2. **Create new skill** with "Provision your own" hosting from the start
3. Set endpoint to **HTTPS** -> `https://claire-tracker.vercel.app/api/alexa`
4. SSL cert: **"My development endpoint is a sub-domain of a domain that has a wildcard certificate from a certificate authority"**
5. Paste interaction model JSON -> Save -> Build
6. Test tab: **UNCHECK "Device Display"** - this was causing "not supported on this device" in the simulator
7. Simulator was STILL broken even after all this - but the **actual Alexa device worked fine**

### Key learnings:
- The Alexa Developer Console test simulator is buggy - don't rely on it
- "Not supported on this device" usually means Lambda/HTTPS config mismatch OR Device Display checked in test
- Manual JSON tab was broken too - kept saying "Invalid request payload" regardless of format
- When in doubt, test with `curl` directly against the endpoint
- Signature verification (`alexa-verifier`) was removed because it was blocking legitimate requests

### Alexa Developer Console:
- Account: Wife's Amazon account (Alexa is registered to her)
- Skill ID: `amzn1.ask.skill.6b038d3f-61db-440a-bf9d-a8be62fa6285`
- Invocation name: `baby tracker`
- Interaction model: `alexa-skill-model.json` in project root
- Endpoint: HTTPS -> `https://claire-tracker.vercel.app/api/alexa`
- SSL: "My development endpoint is a sub-domain of a domain that has a wildcard certificate from a certificate authority"

### Current Interaction Model (must match what's in developer console JSON Editor):
- **LogBottleIntent**: slot `amount` (AMAZON.NUMBER) - "log a {amount} milliliter bottle"
- **LogSnackIntent**: slot `amount` (AMAZON.NUMBER) - "snack {amount} milliliters" (ml not minutes!)
- **LogDiaperIntent**: slot `diaperType` (custom DiaperType) - values: pee (synonym: wet), poop (synonym: dirty), both
- **LastFeedIntent**: "when was the last feed"
- **DailyStatusIntent**: "how is claire doing"
- **DiaperCountIntent**: "how many diapers"
- **UndoIntent**: "undo", "undo last", "delete last"
- **IMPORTANT**: If you update `alexa-skill-model.json` in code, you MUST also paste the updated JSON into the developer console JSON Editor, Save, and Build Skill

---

## Siri Shortcuts Setup

### What FINALLY worked:
The shortcut is **5 steps** using `/api/speak` (plain text response):

1. **Dictate Text** - Siri listens
2. **Text** - convert Dictated Text to string (REQUIRED - without this, the URL breaks)
3. **Get Contents of URL** - POST to `https://claire-tracker.vercel.app/api/speak` with JSON body `{ q: [Text] }`
4. **Text** - convert Contents of URL to string (REQUIRED for Speak to work via Siri voice)
5. **Speak Text** - speak the Text from step 4

### Key learnings:
- **GET with query params breaks** - spaces in `?q=bottle 30` get truncated. Siri only sends "bottle". Use POST with JSON body instead
- **Must convert variables to Text** - Dictated Text and Contents of URL need an intermediate "Text" action before being used in URLs or Speak
- **Speak Text doesn't work with raw Contents of URL** when triggered via "Hey Siri" - needs the extra Text conversion step
- **JSON responses don't work** - need Get Dictionary Value action which adds complexity. Plain text (`Content-Type: text/plain`) from `/api/speak` is much simpler
- **Confirmation flow is too complex** for Shortcuts - the If/Else + second API call pattern is fragile. Instead, use validation (require "diaper pee" not just "diaper") and an "undo" command
- **"Hey Siri, [name]"** triggers the shortcut - the name must match exactly, no "open" prefix

### Failed approaches:
- GET request with variable in URL query string (space encoding issue)
- JSON response + Get Dictionary Value + Speak (silent when triggered via Siri voice)
- Confirmation flow with If/Else (too complex, unreliable variable passing)
- Multiple shortcuts (unnecessary - one shortcut handles everything)

---

## App Features

### Dashboard
- Total ml today (bottles + snacks combined)
- Feed urgency: green (<2h), yellow (2-2.5h), red pulsing (>2.5h)
- Daily goal progress bar (age-based: scales from 60ml at day 1 to 900ml at 6 months)
- Claire's age displayed automatically (birthday: March 21, 2026)
- Diaper counts (wet/dirty/total)
- Predicted next feed time based on average intervals

### Logging
- Bottle feed: quick-select (15/30/45/60/75/90ml) + adjuster, shows oz conversion
- Breast snack: same as bottle (ml, not minutes)
- Diaper: pee/poop/both (one tap)
- All entries editable (tap to edit time, amount, type)
- Delete with X button

### History
- Full scrollable log grouped by day
- Day summaries (total ml, snack count, diaper counts)
- Accessible via "History" button

### Voice Commands (Siri)
- "bottle 30" - logs 30ml bottle
- "snack 30" - logs 30ml breast snack
- "diaper pee/poop/both" - logs diaper
- "status" - today's summary
- "last feed" - when was last feed
- "undo" - removes most recent entry

### Voice Commands (Alexa)
- "Alexa, open baby tracker"
- "log a 60 milliliter bottle"
- "log a pee diaper"
- "when was the last feed"
- "how is claire doing"
- "undo"

### PWA
- Installable on iPhone home screen (Add to Home Screen from Safari)
- Custom app icon (pink gradient + baby bottle + "Claire")
- Standalone mode (no browser bar)
- Service worker for notifications (limited on iOS)
- 30-second polling for real-time sync between devices

---

## Design
- **Font**: Nunito (rounded, baby-friendly)
- **Colors**: Cream background (#FFF8F0), peach for bottles, blush/pink for snacks, mint for diapers, lavender for UI accents
- **Style**: Soft pastels, rounded corners (20px), subtle shadows, no harsh edges
- **Mobile-first**: Large tap targets, bottom sheet modals, one-handed usable
