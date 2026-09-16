# Catalog product shots

Drop official iPhone **front** and **back** photos here. Explorar reads them automatically.

Do **not** upload these to the Supabase `listing-images` bucket — that bucket is only for seller listing photos.

## Naming

Use the model slug from `src/lib/iphone-catalog-data.ts`:

```text
{slug}-front.webp
{slug}-back.webp
```

`.png`, `.jpg`, and `.jpeg` also work. Prefer WebP.

Example for iPhone 17 Pro Max:

```text
public/catalog/iphone-17-pro-max-front.webp
public/catalog/iphone-17-pro-max-back.webp
```

When **both** files exist, hovering (or focusing) the card flips front → back. If only the front is present, Explorar shows that still. If neither is present, the silhouette stays.

## Filenames (all 28 models)

| Model                      | Front                          | Back                          |
| -------------------------- | ------------------------------ | ----------------------------- |
| iPhone 12 mini             | `iphone-12-mini-front.webp`    | `iphone-12-mini-back.webp`    |
| iPhone 12                  | `iphone-12-front.webp`         | `iphone-12-back.webp`         |
| iPhone 12 Pro              | `iphone-12-pro-front.webp`     | `iphone-12-pro-back.webp`     |
| iPhone 12 Pro Max          | `iphone-12-pro-max-front.webp` | `iphone-12-pro-max-back.webp` |
| iPhone 13 mini             | `iphone-13-mini-front.webp`    | `iphone-13-mini-back.webp`    |
| iPhone 13                  | `iphone-13-front.webp`         | `iphone-13-back.webp`         |
| iPhone 13 Pro              | `iphone-13-pro-front.webp`     | `iphone-13-pro-back.webp`     |
| iPhone 13 Pro Max          | `iphone-13-pro-max-front.webp` | `iphone-13-pro-max-back.webp` |
| iPhone SE (3.ª generación) | `iphone-se-3-front.webp`       | `iphone-se-3-back.webp`       |
| iPhone SE (4.ª generación) | `iphone-se-4-front.webp`       | `iphone-se-4-back.webp`       |
| iPhone 14                  | `iphone-14-front.webp`         | `iphone-14-back.webp`         |
| iPhone 14 Plus             | `iphone-14-plus-front.webp`    | `iphone-14-plus-back.webp`    |
| iPhone 14 Pro              | `iphone-14-pro-front.webp`     | `iphone-14-pro-back.webp`     |
| iPhone 14 Pro Max          | `iphone-14-pro-max-front.webp` | `iphone-14-pro-max-back.webp` |
| iPhone 15                  | `iphone-15-front.webp`         | `iphone-15-back.webp`         |
| iPhone 15 Plus             | `iphone-15-plus-front.webp`    | `iphone-15-plus-back.webp`    |
| iPhone 15 Pro              | `iphone-15-pro-front.webp`     | `iphone-15-pro-back.webp`     |
| iPhone 15 Pro Max          | `iphone-15-pro-max-front.webp` | `iphone-15-pro-max-back.webp` |
| iPhone 16                  | `iphone-16-front.webp`         | `iphone-16-back.webp`         |
| iPhone 16 Plus             | `iphone-16-plus-front.webp`    | `iphone-16-plus-back.webp`    |
| iPhone 16 Pro              | `iphone-16-pro-front.webp`     | `iphone-16-pro-back.webp`     |
| iPhone 16 Pro Max          | `iphone-16-pro-max-front.webp` | `iphone-16-pro-max-back.webp` |
| iPhone 16e                 | `iphone-16e-front.webp`        | `iphone-16e-back.webp`        |
| iPhone 17                  | `iphone-17-front.webp`         | `iphone-17-back.webp`         |
| iPhone Air                 | `iphone-air-front.webp`        | `iphone-air-back.webp`        |
| iPhone 17 Pro              | `iphone-17-pro-front.webp`     | `iphone-17-pro-back.webp`     |
| iPhone 17 Pro Max          | `iphone-17-pro-max-front.webp` | `iphone-17-pro-max-back.webp` |
| iPhone 17e                 | `iphone-17e-front.webp`        | `iphone-17e-back.webp`        |

## Size scale

Phone height on the 1200×1600 canvas follows **official body height**, so a 6.3" 17 / 17 Pro looks smaller than a 6.9" Pro Max. Source of truth: `CATALOG_PHONE_BODY_MM` in `src/lib/iphone-catalog-images.ts`.

iPhone 17 series (display diagonal → body):

| Model             | Display | Body height | Canvas phone height |
| ----------------- | ------- | ----------- | ------------------- |
| iPhone 17         | 6.3"    | 149.6 mm    | ~1208 px            |
| iPhone 17 Pro     | 6.3"    | 150.0 mm    | ~1212 px            |
| iPhone 17 Pro Max | 6.9"    | 163.4 mm    | 1320 px (max)       |
| iPhone 17e        | 6.1"    | 146.7 mm    | ~1185 px            |
| iPhone Air        | 6.5"    | 156.2 mm    | ~1262 px            |
| iPhone SE (3.ª)   | 4.7"    | 138.4 mm    | ~1118 px            |
| iPhone SE (4.ª)   | 6.1"    | 146.7 mm    | ~1185 px            |

The 6.5" phone in Apple's 17-family size chart is **Air**, not 17e.

SE (4.ª) shares the iPhone 14 chassis height (146.7 mm), not the compact SE (3.ª) body (138.4 mm).

Use this scale for every later model. Do not draw all phones the same size.

## Tips

- **Transparent background is required.** The Explorar card already has the studio well; a white plate shows as a rectangle on the card.
- Prefer WebP with an alpha channel (PNG is fine). Do not composite onto white.
- Keep a portrait crop (about 3:4) with the phone centered on the canvas; smaller models keep more margin.
- Commit the files in git, then redeploy — no extra upload UI.
