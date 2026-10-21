JEP NTE DELA TORRE - INDEX.HTML / SEO / FAVICON PACKAGE

This is a PATCH package, NOT a whole website. Copy all contained files into the
ROOT of the GitHub Pages publishing folder of jept3/creativeugcportfolio,
keeping their folder paths. MERGE with existing files rather than deleting them.

You should still have existing styles.css, config.js, youtube.js, app.js,
admin.html and your other website files. Do not delete or overwrite them.

Files:
  index.html                   complete updated HTML including metadata
  assets/social-preview.jpg    1200x630 social sharing image
  assets/favicon.svg           modern browser favicon
  favicon.ico                  fallback browser favicon
  assets/apple-touch-icon.png  iPhone home screen icon
  assets/favicon-512.png       optional larger icon
  data/site.json               fixes previous 404 in old app.js
  assets/demo/*.svg            fixes the two missing hero image errors
  sitemap.xml                  register this in Google Search Console

After deploying, confirm these load WITHOUT 404:
https://jept3.github.io/creativeugcportfolio/assets/social-preview.jpg
https://jept3.github.io/creativeugcportfolio/data/site.json
https://jept3.github.io/creativeugcportfolio/sitemap.xml

Social preview note:
Link previews can remain cached in Facebook, WhatsApp, LinkedIn, etc.
Use Facebook Sharing Debugger or LinkedIn Post Inspector to refresh.

Google Search Console:
Add a URL-prefix property for https://jept3.github.io/creativeugcportfolio/
Complete site ownership verification and submit sitemap.xml.
Google index/rank is not guaranteed. Ensure projects display properly.

Do NOT paste the new meta tags a second time if replacing the entire index.html;
they are already present once in the <head>.

The script reference app.js?v=20261021 is just a cache-busting URL query.
It does not replace or modify app.js itself. It will use your existing code.
