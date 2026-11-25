LOGO HIVE  -  how to put it online (free) and run it
=====================================================

PART A. PUT IT ONLINE (one time, about 10 minutes)
1. Unzip this folder on your computer/phone.
2. Open https://github.com/talha-data7/ -> New repository -> name it  logo-hive  -> Public -> Create.
3. Click "uploading an existing file" -> drag ALL files from the unzipped folder
   (index.html, style.css, script.js, admin.html, admin.js, config.js, custom.js, designs.js, fonts.js,
   colorpicker.js, sha256.js) -> Commit changes.
   Do NOT upload README.txt if you do not want to; it does not matter.
4. Open https://dash.cloudflare.com -> Workers & Pages -> Create -> Pages -> Connect to Git ->
   choose logo-hive. Build command: leave empty.  Output directory: leave empty (or "/").  Save and Deploy.
5. In one minute you get a link like  logo-hive.pages.dev . That is your website.
   Your admin page is the same link + /admin.html

PART B. FIRST THINGS TO CHANGE (open admin.html on your website)
- Tab 1 Settings: write YOUR WhatsApp number (like 923001234567) and your Easypaisa / JazzCash
  number + account name. The pay screen shows these. Price and free logos are also here.
- Tab 6 Publish: press "Download both", then upload config.js and custom.js to GitHub
  (Add file -> Upload files -> Commit). The site updates in about 1 minute.

PART C. HOW A SALE WORKS
1. Customer makes a logo, taps Download after their free logos are finished, sees your price and numbers.
2. Customer pays by Easypaisa/JazzCash and sends you the screenshot on WhatsApp (button is in the app).
3. You check the payment, then send ONE code (it gives the customer 3 logos; change this number in admin.html > Settings) from private/logo-hive-codes.txt
   (or admin.html -> tab 5 -> "Copy message", it writes the whole reply for you).
4. Customer pastes the code -> the logos download. (After the free logos the preview shows a faint repeating
   'Logo Hive' watermark; downloads are always clean. Strength / on-off is in admin.html > Settings.) Tick "Sent" in the admin list so you remember.
The 30 codes in the file are ALREADY active in config.js. Make more in admin.html tab 5, then publish.
KEEP logo-hive-codes.txt PRIVATE. Never upload it to GitHub.

PART D. ADD YOUR OWN LOGOS
1. In Illustrator: turn text into outlines (Type > Create Outlines), use flat colors,
   release clipping masks, File > Save As > SVG. Keep the business name OUT of the symbol.
2. admin.html -> tab 2 -> choose the SVG files -> pick business type -> "Add this logo".
   (Tap a piece in the preview to remove it, e.g. a white background piece.)
3. Tab 6 -> Download both -> upload custom.js (and config.js if changed) to GitHub.
Hide a logo you do not want: tab 3.   New business type (e.g. "Mobile repair"): tab 4.

HONEST LIMITS
- No server, so free-logo counting and codes live in each customer's own browser.
  A tech-savvy person can clear their browser data to get free logos again, or reuse a code on another device.
  For a small shop business this is acceptable; if abuse grows, move to a real login/payment (Stripe/Safepay) later.
- You verify payments yourself (manual). That is the cost of staying 100% free.
- Fonts come from Google Fonts, so the customer needs internet.
- The logo designs derived from your Ideogram images: check Ideogram's terms allow commercial resale before selling.


=====================================================================
NEW IN THIS VERSION: BUSINESS TYPES (NICHES) AND MORE LOGOS
=====================================================================
* The app now knows about 2,000+ business types (your Evergreen Niches list
  plus extra Pakistani ones such as tuck shop, mobile load shop, darzi,
  kiryana, rickshaw, tandoor, mehndi artist...).
* They are organised in 35 groups (shown as chips) and 204 families
  (small chips under the group). Customers can also just type their
  business in the search box (English or Urdu) and press a result.
* There are about 919 logos in total: 4 minimalist styles for every family
  (plain, circle, rounded square, ring) + your earlier designs.
* Files: logos.js (new logos), niches.js (business list). Do not edit by hand.
  Use admin.html to add, hide or delete logos and to add your own types.

LICENCE NOTE
* The ~816 new symbols were drawn from scratch as original vector shapes
  for this project, so they are not copied from anyone.
* The 103 older designs came from your AI images. Please check the terms of
  the tool you used (e.g. Ideogram) for commercial resale. If unsure, hide
  them in admin.html > "Show / hide logos".

PAGE JUMP BUG: fixed (tapping lower controls no longer scrolls the page up).

* Admin > Settings > 'Show sub-types row': turn off to hide the small chips under each group (all logos of the group then show together).

* Admin > Settings > 'Payment ON': untick it to make everything free (no payment box, no limit, no watermark). Tick it again to bring payment back.

* More logos for Mobile: new types 'Mobile repair', 'Mobile accessories & Cases', 'SIM, Load & Easypaisa shop', 'Laptop & PC repair' (4 to 16 designs each).
