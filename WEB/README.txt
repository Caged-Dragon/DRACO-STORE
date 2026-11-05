DRACO STORE WEBSITE

TO PUT THE SITE ONLINE
  Upload everything inside the  dist  folder (index.html, app.min.js, styles.min.css) to your host
  (Netlify, Vercel, GitHub Pages ...).

TO CHANGE THE SITE
  Edit the readable files in  src/  (css/styles.css and js/*.js), then run:
      python3 build.py
  and upload the new  dist  folder. Optional stronger minifying:  pip install rjsmin rcssmin

FILES IN src/js (loaded in the order listed in ORDER.txt)
  config.js        Supabase address and PUBLISHABLE key (safe to be public)
  core.js          helpers, device detection, network calls
  views.js         home page, lists, search results
  details.js       the app page
  actions.js       download, wishlist, library, reviews
  account.js       sign-in, sign-up, account sheet
  leaderboards.js  leaderboards and achievements screens
  developer.js     developer dashboard and file upload
  main.js          click handling and start-up

SECURITY
  Anything a browser runs can be read in its inspect tool; minifying only makes it harder to read.
  Your protection is the database security rules. NEVER put the secret / service_role key in any file here.

PUBLISHING WITH GITHUB + VERCEL
  1. Create a GitHub repository and upload this whole folder (keep dist/ in it).
  2. In Vercel: Add New > Project > import the repository. Framework: "Other". Leave the build command empty.
     (vercel.json already tells Vercel to publish the dist folder and adds security headers.)
  3. After the first deploy, copy your site address (https://your-name.vercel.app) and in Supabase go to
     Authentication > URL Configuration: set Site URL to that address and add it to Redirect URLs.
  4. After any change in src/: run  python3 build.py , commit, push. Vercel redeploys automatically.
