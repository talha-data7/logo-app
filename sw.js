/* Logo Hive service worker: lets the app install and open offline. Network first, so your updates always show. */
var CACHE = "hive-v1";
var CORE = ["./", "index.html", "style.css", "script.js", "config.js", "custom.js", "fonts.js", "designs.js", "logos.js", "niches.js", "sha256.js", "colorpicker.js", "manifest.webmanifest", "icon-192.png"];
self.addEventListener("install", function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) { return Promise.all(CORE.map(function (u) { return c.add(u).catch(function () { }); })); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin || /admin\.(html|js)$/.test(r.url)) return;
  e.respondWith(fetch(r).then(function (res) {
    if (res && res.ok) { var c = res.clone(); caches.open(CACHE).then(function (ch) { ch.put(r, c); }); }
    return res;
  }).catch(function () { return caches.match(r).then(function (m) { return m || caches.match("index.html"); }); }));
});
