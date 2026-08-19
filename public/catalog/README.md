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
| iPhone SE (2.ª generación) | `iphone-se-2-front.webp`       | `iphone-se-2-back.webp`       |
| iPhone 12 mini             | `iphone-12-mini-front.webp`    | `iphone-12-mini-back.webp`    |
| iPhone 12                  | `iphone-12-front.webp`         | `iphone-12-back.webp`         |
| iPhone 12 Pro              | `iphone-12-pro-front.webp`     | `iphone-12-pro-back.webp`     |
| iPhone 12 Pro Max          | `iphone-12-pro-max-front.webp` | `iphone-12-pro-max-back.webp` |
| iPhone 13 mini             | `iphone-13-mini-front.webp`    | `iphone-13-mini-back.webp`    |
| iPhone 13                  | `iphone-13-front.webp`         | `iphone-13-back.webp`         |
| iPhone 13 Pro              | `iphone-13-pro-front.webp`     | `iphone-13-pro-back.webp`     |
| iPhone 13 Pro Max          | `iphone-13-pro-max-front.webp` | `iphone-13-pro-max-back.webp` |
| iPhone SE (3.ª generación) | `iphone-se-3-front.webp`       | `iphone-se-3-back.webp`       |
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

## Tips

- Use a transparent or studio background so the card lighting still reads.
- Keep a portrait crop (about 3:4) with the phone centered.
- Commit the files in git, then redeploy — no extra upload UI.
