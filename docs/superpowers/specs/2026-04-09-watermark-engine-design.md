# C2 — Watermark Engine Design

**Date:** 2026-04-09
**Sub-project:** C2 (second sub-project of Galeriku Tier 2 roadmap)
**Status:** Approved, ready for implementation planning

## Context & Goals

Galeriku is a SaaS for Indonesian wedding photographers. C1 (Client Gallery) shipped with a `downloadPolicy` toggle that includes "watermarked" — but no actual watermark generation exists yet. When a photographer selects "watermarked", clients currently receive the original clean file (documented fallback in `download/[id]/route.ts`).

C2 fills this gap: automatic watermark compositing on published album photos so photographers can share branded previews while protecting their full-resolution originals.

### Goals
- Photographer can upload a logo (PNG) or set text as watermark source
- Configurable position (5 presets), opacity (10-100%), and scale (10-60%)
- Global studio default with per-album override
- Preview single foto before committing to bulk generation
- Bulk generate watermarked variants on publish, with progress feedback
- Download endpoint (already wired in C1) automatically serves watermarked variant

### Non-goals (out of scope for C2)
- Drag-and-drop free positioning (D not chosen — 5 presets suffice)
- SVG/WebP logo support (PNG only for MVP)
- Background queue infrastructure (sync processing with progress tracking)
- Per-photo watermark override
- Video watermarking
- Client-side canvas preview (server-side preview chosen for WYSIWYG accuracy)

## Key Decisions

| # | Topic | Decision | Alasan |
|---|---|---|---|
| 1 | Watermark source | Both logo (PNG upload) + text | Flexibility — photographer pilih mode |
| 2 | Generate timing | On publish (bulk) | Upload tetap cepat, hanya generate untuk album yang benar-benar dipublish, photographer tahu momen-nya |
| 3 | Position options | 5 presets (center, TL, TR, BL, BR) | Cover 95% kebutuhan, UI simpel |
| 4 | Configurability | Opacity slider (10-100%) + Scale slider (10-60%) | 2 controls, fine-tune without complexity |
| 5 | Settings scope | Global default + per-album override | Set sekali, customize kalau perlu |
| 6 | Preview | Server-side single-photo preview | WYSIWYG (same sharp pipeline), ~200ms per foto |
| 7 | Logo format | PNG only, max 2MB, 100-2000px | 99% photographer use PNG, sharp handles alpha natively |
| 8 | Progress feedback | Progress bar via polling | 200 foto × ~200ms = ~40s, user needs visibility |
| 9 | Code quality | SOLID principles + clean code enforced | User requirement |
| 10 | Code review | Required before merge | User requirement |

## Architecture

### New feature folder

```
src/features/watermark/
├── lib/
│   ├── composite.ts          SRP: composite foto + watermark → buffer
│   ├── text-renderer.ts      SRP: render text → PNG buffer with transparency
│   ├── config.ts             SRP: types, defaults, merge global+album override
│   └── job-store.ts          SRP: in-memory progress tracking per job
├── server/
│   ├── upload-logo.ts        SRP: validate PNG, store R2, update settings
│   ├── preview-watermark.ts  SRP: generate 1 preview foto on-the-fly
│   ├── generate-watermarks.ts SRP: bulk generate for album, track progress
│   └── get-watermark-config.ts SRP: resolve config (global + album override)
├── components/
│   ├── watermark-settings.tsx Mode/position/opacity/scale config UI
│   ├── logo-uploader.tsx     Upload logo + preview thumbnail
│   └── watermark-preview-modal.tsx Preview single foto with watermark
└── types/
    └── index.ts
```

### SOLID compliance

- **SRP**: Each file has one clear responsibility. `composite.ts` only composites, `upload-logo.ts` only handles upload, `generate-watermarks.ts` only orchestrates bulk generation.
- **OCP**: `resolveWatermarkConfig` is extensible via spread — adding a new override layer (e.g. per-photo) means adding one more spread parameter, not editing the function.
- **LSP**: Mode "logo" vs "text" are interchangeable watermark sources. `composite.ts` accepts `WatermarkConfig` and handles both modes internally — callers don't branch on mode.
- **ISP**: `WatermarkConfig` type contains only watermark-relevant fields. No bloated interfaces.
- **DIP**: Server functions accept dependencies (db, r2Client) via parameter for testability. `composite.ts` accepts buffers not file paths — decoupled from storage.

### Dependency rules

- `watermark` feature may import from `shared/`, `db/`, `media/` (read foto)
- `watermark` must NOT import from `auth/` or `guest-gallery/`
- `album` feature imports `watermark` to wire the publish flow — one-way dependency

### Integration with existing C1 code

**Already wired (zero change needed):**
- `download/[id]/route.ts` — reads `variants.watermarkedFull` via `downloadVariantKey("watermarked")`, falls back to original. Once C2 populates the variant, this automatically serves it.
- `media.variants` jsonb — has `watermarkedFull` and `watermarkedPreview` slots.

**Needs modification:**
- `publish-album-dialog.tsx` — add progress bar for watermark generation + optional watermark override section
- `publish-album.ts` / `publish-album.action.ts` — trigger watermark generation after publish, return job ID
- `album` schema — add `watermarkOverride` jsonb column (nullable)

## Data Model

### `app_settings` (existing table) — new key

```ts
// Key: "watermark_config"
// Value:
type WatermarkConfig = {
  mode: "logo" | "text";
  logoR2Key: string | null;
  text: string;
  position: "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
  opacity: number;   // 10-100, default 40
  scale: number;     // 10-60 (% of photo width), default 30
};
```

### `album` (existing table) — new column

```ts
watermarkOverride: jsonb("watermark_override").$type<Partial<WatermarkConfig>>(),
// null = use global default
// Partial = override specific fields only, rest from global
```

### Config resolution (pure function)

```ts
const DEFAULTS: WatermarkConfig = {
  mode: "logo",
  logoR2Key: null,
  text: "",
  position: "center",
  opacity: 40,
  scale: 30,
};

function resolveWatermarkConfig(
  global: Partial<WatermarkConfig> | null,
  albumOverride: Partial<WatermarkConfig> | null,
): WatermarkConfig {
  return { ...DEFAULTS, ...global, ...albumOverride };
}
```

### Watermark job progress (in-memory)

```ts
type WatermarkJob = {
  albumId: string;
  total: number;
  done: number;
  status: "processing" | "completed" | "failed";
  error?: string;
  skipped: string[];  // mediaIds that failed
};

// In-memory Map — acceptable for MVP. Data loss on restart is fine
// because re-publish regenerates. No DB table needed.
const jobs = new Map<string, WatermarkJob>();
```

### `media.variants` (existing jsonb) — C2 populates

```ts
// Already defined in C1 schema:
variants: {
  thumb400?: string;
  preview1200?: string;
  watermarkedPreview?: string;   // ← C2 populates
  watermarkedFull?: string;       // ← C2 populates
}
```

No schema migration needed for variants — jsonb is schemaless. Only `album.watermarkOverride` needs a migration (single nullable column).

## Key Flows

### Flow 1: Upload watermark logo

1. Photographer opens watermark settings page
2. Clicks "Upload Logo" → file picker
3. Client validates: PNG only, max 2 MB
4. POST `/api/watermark/logo` (multipart/form-data)
5. Server `uploadLogo`:
   - Validate magic bytes (`89 50 4E 47` = PNG header)
   - `sharp(buffer).metadata()` → verify PNG + dimensions
   - Reject if <100px or >2000px (auto-resize >2000px down)
   - R2 key: `watermarks/<studioId>/logo-<timestamp>.png`
   - Upload to R2
   - Delete old logo from R2 if exists
   - Upsert `app_settings` key `watermark_config` → `logoR2Key`
   - Return `{ ok: true, previewUrl }`
6. UI shows logo thumbnail

### Flow 2: Configure watermark settings

1. `<WatermarkSettings>` shows: mode toggle, logo/text input, 5-position grid, opacity slider, scale slider
2. Changes debounce-saved via server action
3. Server: upsert `app_settings` key `watermark_config`
4. No generation happens here — config only

### Flow 3: Preview watermark

1. Photographer clicks "Preview Watermark" on album detail
2. POST `/api/watermark/preview` `{ albumId, mediaId? }`
3. Server `previewWatermark`:
   - `resolveWatermarkConfig(global, album.watermarkOverride)`
   - Fetch foto from R2
   - Fetch logo from R2 (if mode=logo)
   - `composite(foto, watermark, config)` → JPEG buffer
   - Return `image/jpeg`
4. `<WatermarkPreviewModal>` displays result

### Flow 4: Publish with watermark (bulk generate)

1. Photographer publishes album with policy "watermarked"
2. `publishAlbum()` completes (slug, settings — existing C1)
3. Trigger `generateWatermarks(albumId)`:
   - Create job: `{ albumId, total, done: 0, status: "processing", skipped: [] }`
   - Resolve config once
   - Fetch logo from R2 once (reuse for all photos)
   - For each media in album:
     - Fetch original from R2
     - `composite(original, watermark, config)` → full-res buffer
     - Resize to 1200px → `composite(resized, watermark, config)` → preview buffer
     - Upload both to R2 as `watermarkedFull` + `watermarkedPreview`
     - Update `media.variants` (merge with existing)
     - Increment `job.done`
     - On error: add to `job.skipped`, continue
   - Set `job.status = "completed"`
4. Client polls `GET /api/watermark/status/[jobId]` every 2s
5. UI: progress bar "Generating watermark 47/200..."
6. Completed → show link

### Flow 5: Re-publish after config change

1. Photographer changes watermark setting
2. Re-publishes album
3. `generateWatermarks()` runs again → overwrites variant files in R2
4. Progress bar → done → clients see updated watermark

### Flow 6: Album watermark override

1. Publish dialog has collapsible "Watermark override" section
2. Expanded: same controls as WatermarkSettings, scoped to album
3. Save → `album.watermarkOverride = { ...partial }`
4. Preview + generate use `resolveWatermarkConfig(global, override)`

## Error Handling & Edge Cases

| Scenario | Handling |
|---|---|
| Upload not PNG (renamed .jpg) | Magic bytes check — reject if not `89 50 4E 47` |
| Upload > 2 MB | 413 reject before store |
| Upload < 100px | 400 "Logo too small" |
| Upload > 2000px | Auto-resize to max 2000px width |
| No logo uploaded, mode=logo, publish watermarked | Block publish: "Upload logo first" |
| No logo AND no text, publish watermarked | Block publish: validation error |
| Foto corrupt during generate | Skip, log error, continue. `job.skipped` includes mediaId |
| R2 upload fails for variant | Retry 1x. Still fails → skip. Foto falls back to original (C1 behavior) |
| Server crash mid-generation | Job stuck "processing". Client timeout after 5 min → "Try again". Re-publish safe. |
| Album 0 photos published | Skip generation, job completes instantly |
| Logo changed mid-generation | Generation uses logo fetched at start (cached). New logo applies on re-publish |
| Concurrent publish same album | Last job wins (overwrite in Map by albumId) |
| Delete album during generation | Variants orphaned in R2. Acceptable for MVP. |
| Text empty (whitespace) | Reject "text cannot be empty" |
| Text > 100 chars | Truncate to 100 at UI + server validation |
| Text with emoji/unicode | sharp text supports Unicode. Allow. |

## Security

| Concern | Mitigation |
|---|---|
| Malicious PNG (zip bomb / polyglot) | sharp.metadata() with dimension limits + max file size 2MB |
| Path traversal in R2 key | Key generated server-side, no user input in path |
| DoS via repeated publish | Existing publish rate limit + job dedup per albumId |
| Logo access by unauthorized | Logo in R2 private bucket, presigned URL for preview only. Composited watermark is part of the photo — raw logo never served to clients |

## Testing Strategy

TDD mandatory. Tests use `galeriku_test` DB.

### Unit tests (vitest)

`lib/config.ts`:
- resolveWatermarkConfig: defaults only, global only, album override, full merge, partial override, null inputs
- Verify merge order: album > global > defaults

`lib/composite.ts`:
- Logo mode: sharp.composite() called with correct gravity for each of 5 positions
- Text mode: SVG text overlay generated correctly
- Opacity/scale mapping to sharp parameters

`lib/text-renderer.ts`:
- Render text → PNG buffer with transparency
- Empty text → throw
- Long text → truncated

`components/`:
- logo-uploader: file type validation, size validation, upload trigger
- watermark-settings: mode toggle, position select, slider changes
- watermark-preview-modal: image display, close

### Integration tests (vitest + DB + R2 mock)

`server/upload-logo.ts`:
- Valid PNG → stored, key saved in settings
- Invalid MIME → rejected
- Old logo cleaned up on re-upload

`server/get-watermark-config.ts`:
- No config → DEFAULTS
- Global set → returns global
- Album override → merged

`server/preview-watermark.ts`:
- Valid config + foto → JPEG buffer
- Missing logo → error
- Missing foto → error

`server/generate-watermarks.ts`:
- 3 photos → 3 variants generated, media.variants updated
- 1 corrupt → skipped, 2 succeed
- 0 photos → job completed instantly
- Progress tracking increments

### E2E tests (Playwright)

1. Upload logo + configure + preview + publish watermarked → progress → complete
2. Text watermark + preview + publish

### Coverage target
- Unit: 90%+ (pure functions)
- Integration: 100% server functions
- E2E: 2 journeys
- Total: maintain 448 existing + ~40-50 new

### Code review
- Required before merge (superpowers:code-reviewer agent)
- Focus on: SOLID compliance, sharp usage, R2 key hygiene, error handling completeness

## Out of Scope (deferred)

- C3 Sharing & Access Control
- G1 Studio branding (custom subdomain)
- S3 Background queue (BullMQ migration for watermark generation)
- SVG/WebP logo support
- Video watermarking
- Per-photo watermark override
- Client-side canvas live preview
