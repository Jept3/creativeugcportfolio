# Jepnte Dela Torre — UGC & Advertising Portfolio

A **mobile-first glassmorphism website** with three galleries (**UGC, Static Ads, Video Ads**), a YouTube-powered video viewer, and a secure **admin panel** for posting YouTube links and uploading photos with real upload-progress animations. The website uses plain HTML, CSS, and JavaScript and can be hosted on **GitHub Pages** without any build step.

**Videos are hosted on YouTube, not on GitHub or Supabase.** Visitors can play them directly in the portfolio. Static photos and optional custom YouTube cover photos are stored in Supabase Storage. Supabase Auth, Postgres, and Row Level Security power the admin panel and published gallery.

> The bundled artwork is labeled **DEMO** and must be replaced before presenting the portfolio as real client work. The older demo MP4 clips are local placeholders only; the new admin panel does not accept video-file uploads.

## 1. Set up GitHub Pages

1. Create a GitHub repository.
2. Upload the **contents** of this project folder to the root of the repository (not the ZIP itself).
3. In your repository, go to **Settings → Pages → Build and deployment**.
4. Select **Deploy from a branch**, branch **main**, folder **/(root)**, then save.
5. Once published, your portfolio will be at `https://YOUR-USERNAME.github.io/REPOSITORY/` (or at your connected custom domain).

The public portfolio is `index.html`; the admin dashboard is `admin.html`. You can open it at `https://YOUR-USERNAME.github.io/REPOSITORY/admin.html` after setup. **Simply knowing the admin URL does not grant access:** Supabase authentication and database policies protect writes.

## 2. Create your free Supabase project and protected admin login

**Important:** GitHub Pages cannot handle server-side logins or photo uploads on its own. The site includes Supabase integration, but you must configure **your own** Supabase project before admin uploads will work.

1. Create a project at [supabase.com](https://supabase.com/).
2. Open **SQL Editor**. Paste and run **`supabase/setup.sql`**. This creates a public gallery table, image bucket, admin allowlist, and row-level security policies. It is safe to rerun if you used the earlier version; see the *migration* note below.
3. In **Authentication → Users**, create your admin account (or invite yourself) using an email/password and copy that user's **UUID**. Email confirmation may be required depending on your Auth settings.
4. In **SQL Editor**, run this with your real user UUID:

   ```sql
   insert into public.portfolio_admins (user_id)
   values ('PASTE-YOUR-AUTH-USER-UUID-HERE')
   on conflict (user_id) do nothing;
   ```

5. In **Project Settings / API keys**, get your project URL and **publishable key** (or legacy `anon` key). Enter them in **`config.js`**:

   ```js
   window.PORTFOLIO_CONFIG = {
     supabaseUrl: "https://YOUR-PROJECT.supabase.co",
     supabaseKey: "YOUR-SUPABASE-PUBLISHABLE-KEY",
     bucket: "portfolio-media",
     maxFileBytes: 100 * 1024 * 1024
   };
   ```

6. Commit/push the configured files to GitHub. Once GitHub Pages updates, visit `/admin.html` and sign in using the Supabase admin credentials from step 3.

**Never put a `service_role` key, a secret API key, or your login password in the repository.** The browser key is designed to be public. Database/storage write permissions are enforced by Supabase's row-level policies and your explicitly allowed admin account. The storage bucket is public for **published portfolio assets**—do not upload client-confidential or private photos.

**If you previously ran an older `setup.sql`:** Run the updated `supabase/setup.sql` again. It adds `youtube_id`, makes `media_path` optional for YouTube entries, and updates the required validation rules. Older MP4 rows continue to render, but all new video posts use YouTube links. Until you run this SQL, posting a YouTube link will fail because the old database schema requires a video file.

## 3. Publish YouTube videos from your admin panel

1. Upload your video to [YouTube Studio](https://studio.youtube.com/). It can be **public** or **unlisted**, provided it is embeddable. **Private videos and some age-restricted or embedding-disabled videos cannot play in the portfolio.**
2. Copy its link, such as `https://youtu.be/M7lc1UVf-VE` or `https://www.youtube.com/watch?v=M7lc1UVf-VE`. YouTube Shorts and `/live/` links also work.
3. Open `/admin.html` and log in.
4. Select **YouTube video**, paste your link, enter a project title and choose **UGC** or **Video ad**. Add brand and description if desired.
5. Optionally choose a custom thumbnail image, or leave it blank to use YouTube's own thumbnail.
6. Click **Publish creative**. The new project appears on your website when Supabase saves the record.

Your admin dashboard does **not** upload a video to YouTube or track YouTube Studio's upload progress; that happens separately inside YouTube. Adding a YouTube link takes only a database request and does not display a fabricated transfer percentage. If you include a custom thumbnail, the dashboard will show genuine upload progress for **that image file**.

YouTube playback uses a privacy-enhanced `youtube-nocookie.com` embed created **only when a visitor opens a video**. Gallery cards load thumbnail images instead of full video players to save bandwidth on mobile networks.

## 4. Upload static photos (with an animated progress meter)

1. In `/admin.html`, select **Upload photo**.
2. Choose or drag in a **JPG, PNG, or WEBP** image.
3. Enter its title, choose **Static ad** or **UGC**, and add the client and description if needed.
4. Click **Publish creative**. You'll see a **progress bar, animation, percentage, and transferred bytes** measured from the actual resumable transfer. You can cancel while the photo is transferring.
5. When the upload and database publication finish, the project will appear in your public gallery.

The dashboard accepts photos up to **100 MiB per file on the client**, but the **Supabase Free plan has a 50 MB per-file ceiling**. For photos exceeding the Free limit, compress them or upgrade/configure your project's limits. In practice, optimized ad images usually need only a small fraction of that size. Supabase's resumable (TUS) protocol provides the progress events and supports more reliable uploads.

Deleting an item in the admin panel removes it from the gallery, and also removes any uploaded Supabase photos belonging to it. For a YouTube entry, deleting the gallery entry **does not delete the video on YouTube**.

## 5. Your name, email, phone, social links, and WhatsApp

Your site is already personalized with:

- **Name:** Jepnte Dela Torre (also on the admin page)
- **Email:** `jepntedelatorre@gmail.com` (clickable contact and email button)
- **Mobile:** `09362512630` (clickable `tel:` link, Philippine international prefix `+63`)
- **Floating WhatsApp button:** sends visitors to `https://wa.me/639362512630` (bottom-right; mobile-safe and touch-friendly)

The Facebook page, TikTok, Instagram, YouTube, and LinkedIn **icons are visible but inactive until you provide their real URLs**. This avoids linking to somebody else's account. To activate them, edit `data/site.json` and replace the empty strings:

```json
{
  "name": "Jepnte Dela Torre",
  "heroDescription": "I'm Jepnte Dela Torre. I create UGC, static ads, and social-first video content designed to stop the scroll.",
  "aboutDescription": "A good creative can make someone pause, feel something, and take action. Here's where I bring those ideas to life.",
  "email": "jepntedelatorre@gmail.com",
  "phone": "09362512630",
  "whatsapp": "639362512630",
  "socials": {
    "facebook": "https://www.facebook.com/YOUR-PAGE",
    "tiktok": "https://www.tiktok.com/@YOUR-USERNAME",
    "instagram": "https://www.instagram.com/YOUR-USERNAME/",
    "youtube": "https://www.youtube.com/@YOUR-CHANNEL",
    "linkedin": "https://www.linkedin.com/in/YOUR-PROFILE/"
  },
  "availability": "Open for creative collaborations"
}
```

**These URLs are examples only. Do not copy placeholders as your actual links.** Leave a value as `""` if the corresponding profile doesn't exist or you're not ready to share it. The icons automatically become active once a valid `https://` URL is saved. Editing `data/site.json` and committing the file on GitHub Pages updates your public contact section; social links don't require a Supabase account or dashboard change.

The floating WhatsApp button uses the phone's international form without a `+`, spaces, or leading zero. If you change your mobile number in the future, update both `phone` (displayed on site) and `whatsapp` (button destination). You can remove `whatsapp` to reuse the `phone` number automatically.

## 6. Local demo mode (no Supabase needed)

By default, the sample `config.js` contains placeholders. If you haven't configured Supabase yet, the public website shows the **labeled demo entries** from `data/projects.json`. The admin page displays a setup message rather than an insecure fake login.

You can add manual local entries to `data/projects.json` as an alternative to setting up Supabase. For a **YouTube link**, add a project with `youtubeId`:

```json
{
  "id": "my-ugc-review",
  "title": "UGC product review",
  "category": "ugc",
  "client": "Example brand",
  "description": "A fast creator-led review.",
  "youtubeId": "M7lc1UVf-VE",
  "media": "",
  "poster": "",
  "demo": false
}
```

Use only the **11-character video ID** for `youtubeId`. The `media` and `poster` fields are blank because YouTube provides the playback and thumbnail. For local static ads, set `"media": "assets/media/filename.webp"` and `"category": "static"` or `"ugc"`. Such locally edited items appear in demo mode **only**. Once Supabase is configured, the gallery intentionally shows database entries instead of merging or displaying the local demo items.

Preview the site using a local server (not by double-clicking HTML):

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000/` for the site, or `http://localhost:8000/admin.html` for dashboard setup instructions.

## Mobile, browser compatibility, and performance

- Responsive layout for narrow phones, larger phones, tablets, and desktops.
- Tap-friendly source switch, forms, galleries, and modal controls.
- YouTube thumbnails load lazily; YouTube iframes are only inserted after users open a video.
- The iframe uses a responsive 16:9 player, including for Shorts (which may be letterboxed).
- Upload meter updates from transferred bytes, not a simulated timer.
- Motion is reduced automatically when the visitor's system prefers reduced motion.
- A floating WhatsApp contact button stays reachable on small phone screens, including safe-area insets.
- Social icons require no external icon fonts or third-party JavaScript libraries.
- **Hosting videos on YouTube avoids GitHub Pages' site-size limits for video files.** Google/YouTube controls playback availability and ads.

## Files

```text
index.html              Public glassmorphism portfolio
styles.css              Mobile-first portfolio styles
app.js                  Public gallery, modal and Supabase loading
admin.html              Password-protected creator dashboard
admin.css               Mobile-first dashboard styling and animated upload meter
admin.js                Sign in, upload photos, link YouTube videos, delete projects
config.js               PUBLIC Supabase URL and publishable key placeholders
youtube.js              Shared strict video URL parsing and embed URLs
supabase/setup.sql      Database, RLS, admin role, storage policy (run once or rerun to migrate)
data/site.json          Your name, contact information, WhatsApp and social profile links
data/projects.json      Local demo mode projects only
assets/demo/            Placeholder artwork, clearly marked DEMO
assets/media/           Optional assets added directly to GitHub
```

## Operational and security notes

- Enable and enforce HTTPS (GitHub Pages does this by default).
- Use a strong password and manage the allowlist only through the Supabase dashboard SQL editor.
- Do not enable broad write permissions to `portfolio_projects` or your storage bucket.
- There is no public upload form; only authenticated, allowlisted admin accounts can publish.
- Image uploads and public project records use Supabase, so the live admin panel **requires an internet connection and valid Supabase configuration**.
- Supabase Free allows a maximum file size of 50 MB; adjust your bucket/global limits if on a paid plan.
- A YouTube video must allow embedding and remain accessible for the portfolio player to work.
