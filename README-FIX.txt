Jepnte Dela Torre — Public gallery hotfix

Root of GitHub repository: jept3/creativeugcportfolio

1. Replace the ROOT app.js with this new app.js.
2. Confirm data/site.json is at the exact path data/site.json; if not, add the included file to the data folder.
3. Commit the changes and wait for GitHub Pages to publish.
4. Check https://jept3.github.io/creativeugcportfolio/data/site.json (should display JSON).
5. Visit https://jept3.github.io/creativeugcportfolio/ in a private window or force-refresh.

The app.js hotfix ensures a missing data/site.json no longer blocks loading published Supabase projects.
It does not change Supabase credentials, login, or database permissions.
If the video is still missing, check the Console and verify that the latest app.js was deployed.
