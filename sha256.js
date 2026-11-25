/* Tiny SHA-256 + unlock-code helpers (no libraries). Used by the app and by admin.html */
(function (g) {
  "use strict";
  var K = [], H0 = [];
  (function () {
    var primes = [], n = 2;
    while (primes.length < 64) {
      var ok = true;
      for (var i = 0; i < primes.length; i++) if (n % primes[i] === 0) { ok = false; break; }
      if (ok) primes.push(n);
      n++;
    }
    for (var j = 0; j < 64; j++) K.push(Math.floor((Math.cbrt(primes[j]) % 1) * 4294967296) | 0);
    for (var k = 0; k < 8; k++) H0.push(Math.floor((Math.sqrt(primes[k]) % 1) * 4294967296) | 0);
  })();

  function rotr(x, n) { return (x >>> n) | (x << (32 - n)); }

  function sha256(str) {
    var bytes = new TextEncoder().encode(str);
    var l = bytes.length, total = (((l + 8) >> 6) + 1) << 6;
    var buf = new Uint8Array(total);
    buf.set(bytes); buf[l] = 0x80;
    var bits = l * 8;
    buf[total - 4] = (bits >>> 24) & 255; buf[total - 3] = (bits >>> 16) & 255;
    buf[total - 2] = (bits >>> 8) & 255; buf[total - 1] = bits & 255;
    var h = H0.slice(), w = new Array(64);
    for (var off = 0; off < total; off += 64) {
      for (var i = 0; i < 16; i++)
        w[i] = (buf[off + i * 4] << 24) | (buf[off + i * 4 + 1] << 16) | (buf[off + i * 4 + 2] << 8) | buf[off + i * 4 + 3];
      for (i = 16; i < 64; i++) {
        var s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        var s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      var a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], gg = h[6], hh = h[7];
      for (i = 0; i < 64; i++) {
        var S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        var ch = (e & f) ^ (~e & gg);
        var t1 = (hh + S1 + ch + K[i] + w[i]) | 0;
        var S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        var maj = (a & b) ^ (a & c) ^ (b & c);
        var t2 = (S0 + maj) | 0;
        hh = gg; gg = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      h[0] = (h[0] + a) | 0; h[1] = (h[1] + b) | 0; h[2] = (h[2] + c) | 0; h[3] = (h[3] + d) | 0;
      h[4] = (h[4] + e) | 0; h[5] = (h[5] + f) | 0; h[6] = (h[6] + gg) | 0; h[7] = (h[7] + hh) | 0;
    }
    return h.map(function (x) { return ("00000000" + (x >>> 0).toString(16)).slice(-8); }).join("");
  }

  /* ---- unlock codes: HIVE-XXXX-XXXX-XXXX (12 random characters = 60 bits) ---- */
  var ALPHA = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0 O 1 I L
  function newCode() {
    var arr = new Uint32Array(12), out = "";
    (g.crypto || g.msCrypto).getRandomValues(arr);
    for (var i = 0; i < 12; i++) out += ALPHA[arr[i] % ALPHA.length];
    return out;
  }
  function pretty(core) { return "HIVE-" + core.slice(0, 4) + "-" + core.slice(4, 8) + "-" + core.slice(8, 12); }
  function normalize(input) {
    var s = String(input || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (s.indexOf("HIVE") === 0) s = s.slice(4);
    return s;
  }
  function codeHash(input) { return sha256("hive-code:" + normalize(input)).slice(0, 32); }

  g.HiveCodes = { sha256: sha256, newCode: newCode, pretty: pretty, normalize: normalize, hash: codeHash };
})(window);
