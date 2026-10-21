# Jepnte Portfolio — link preview, favicon and Google Search

## Upload these files to the GitHub repository `jept3/creativeugcportfolio`

Use the GitHub Pages publishing branch and folder (likely main / root).

- `assets/social-preview.jpg` — social sharing thumbnail, 1200 × 630
- `assets/favicon.svg` — brand icon for browser tabs
- `assets/apple-touch-icon.png` — iOS home screen icon, 180 × 180
- `assets/favicon-512.png` — high-resolution icon if needed elsewhere
- `favicon.ico` — legacy browser favicon
- `sitemap.xml` — sitemap at the project site's URL

You can upload `assets/*` inside the `assets` directory, plus `favicon.ico` and `sitemap.xml` at repo root. All assets must be in the *deployed* Pages directory.

## Edit index.html

Edit ONLY the existing `<head>` section. Preserve all other CSS and JS tags, especially `config.js`, `youtube.js`, the Supabase CDN, and whichever `app.js?v=...` is currently working.

1. Remove the old `<title>` and old `<meta name="description">` line.
2. Remove any existing `og:title`, `og:description`, `og:type`, `og:image` tags to avoid duplicates.
3. Remove the old `<link rel="icon">` (the new block replaces it).
4. Paste the contents of `HEAD-METADATA.html` before `</head>`. Do NOT paste a second `<head>`.
5. Commit your changes and let GitHub Pages redeploy.

The Open Graph and X metadata must be in the initial HTML `<head>`; adding it only through JavaScript is unreliable for social sharing crawlers.

## Verify the deployed files

Open each URL to verify it returns a real image or XML (not a 404):

- https://jept3.github.io/creativeugcportfolio/assets/social-preview.jpg
- https://jept3.github.io/creativeugcportfolio/assets/favicon.svg
- https://jept3.github.io/creativeugcportfolio/favicon.ico
- https://jept3.github.io/creativeugcportfolio/sitemap.xml

You can share the homepage link in a message to check the preview. Some apps cache previews. Facebook's Sharing Debugger or LinkedIn's Post Inspector may be used to request a refresh.

## Google Search Console

1. Open https://search.google.com/search-console
2. Add **URL prefix**: `https://jept3.github.io/creativeugcportfolio/` (include the whole project path).
3. Verify ownership using Google's offered method. If using the HTML meta tag method, add their unique verification meta tag to the existing index.html `<head>` and commit, then click Verify.
4. In **Sitemaps**, submit `sitemap.xml`, which resolves to https://jept3.github.io/creativeugcportfolio/sitemap.xml
5. In **URL Inspection**, inspect https://jept3.github.io/creativeugcportfolio/ and request indexing if eligible.

Google indexing is not guaranteed, and may take time. Make sure index.html renders visible descriptive text; Google can render JS, but dynamic gallery entries are less consistently discoverable than static HTML.

## Optional admin protection from search discovery

You can add `<meta name="robots" content="noindex,nofollow">` into `admin.html` `<head>`. This is not an authentication or access control mechanism. Your existing Supabase login/security remains necessary.

## Important GitHub Pages project-subfolder note

Do not rely on `creativeugcportfolio/robots.txt` as a crawler exclusion rule. Robots directives apply to the **host root** (`https://jept3.github.io/robots.txt`), not the repository subfolder. The sitemap.xml in the project folder is fine and can be submitted to Search Console.

## Important Google favicon note

Google Search associates favicons with a hostname rather than an individual project subdirectory. The browser will use this site's favicon; for independent Google Search favicon branding, consider a custom domain.
