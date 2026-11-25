/* Logo Hive - main app. Plain JavaScript, no libraries.
   Settings: config.js   Your own logos: custom.js   Built-in logos: designs.js   Fonts: fonts.js */
(function () {
  "use strict";

  /* ============================== data ============================== */
  var CFG = Object.assign({ APP_NAME: "Logo Hive", FREE_LOGOS: 2, PRICE: 50, LOGOS_PER_CODE: 3, WATERMARK: true, WATERMARK_OPACITY: 22, CURRENCY: "Rs.", WHATSAPP: "", PAY: [], CODES: [] }, window.CONFIG || {});
  var CUS = Object.assign({ designs: [], hidden: [], categories: [] }, window.CUSTOM || {});
  var FONTS = window.FONTS || [], FBY = {};
  FONTS.forEach(function (f) { FBY[f.k] = f; });
  var NI = window.HIVE_NICHES || { groups: [], fams: [], niches: [] };
  var BGROUPS = NI.groups.map(function (g) { return [g[0], g[1], g[2]]; });   /* id, English, Urdu */
  var FAMS = {};                                                               /* family id -> {id, group, en, ur} */
  NI.fams.forEach(function (f) { FAMS[f[0]] = { id: f[0], group: f[1], en: f[2], ur: f[3] }; });
  (CUS.categories || []).forEach(function (c) {                              /* your own business types (admin.html) */
    BGROUPS.push([c.id, c.en || c.id, c.ur || ""]);
    FAMS[c.id] = { id: c.id, group: c.id, en: c.en || c.id, ur: c.ur || "" };
  });
  var ALL = (window.DESIGNS || []).concat(window.HIVE_LOGOS || [], CUS.designs || []).filter(function (d) { return (CUS.hidden || []).indexOf(d.id) < 0 && FAMS[d.cat]; });
  var BYID = {};
  ALL.forEach(function (d) { BYID[d.id] = d; });
  function groupOf(cat) { return FAMS[cat] ? FAMS[cat].group : null; }

  var FRAMES = [["none", "No frame"], ["circle", "Circle"], ["double", "Double ring"], ["square", "Rounded square"], ["hex", "Hexagon"]];
  var DEF = { fn: { en: "poppins-700", ur: "noto-nastaliq-urdu-600" }, ft: { en: "poppins-400", ur: "noto-nastaliq-urdu-400" }, tc: "#555555" };

  /* ============================== state ============================== */
  var S = {
    cat: "sweet", fam: "", tid: "", name: "", tag: "",
    fn: { en: DEF.fn.en, ur: DEF.fn.ur }, ft: { en: DEF.ft.en, ur: DEF.ft.ur },
    nc: null, tc: DEF.tc,
    colors: {}, hidden: [], cuts: [],
    mono: { on: false, color: "#ffffff" }, monoTouched: false,
    frame: "none", fstyle: "ring", fc: null,
    bg: { clear: false, color: "#ffffff" },
    layout: "stack", ss: 100, ts: 100
  };

  var $ = function (id) { return document.getElementById(id); };
  var cv = $("cv");

  /* ============================== helpers ============================== */
  function cur() { return BYID[S.tid]; }
  function isRTL(s) { return /[؀-ۿݐ-ݿ]/.test(s || ""); }
  function scriptOf(s) { return isRTL(s) ? "ur" : "en"; }
  function hexOk(h) { return /^#[0-9a-fA-F]{6}$/.test(h || ""); }
  function lum(hex) {
    var n = parseInt(hex.slice(1), 16);
    return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  }
  function slots(d) {
    if (d._slots) return d._slots;
    var out = [];
    d.parts.forEach(function (p) {
      [p.f, p.s].forEach(function (c) { if (c && c !== "none" && out.indexOf(c) < 0) out.push(c); });
    });
    d._slots = out;
    return out;
  }
  function autoColor(d) {
    var best = null;
    slots(d).forEach(function (c) { if (best === null || lum(c) < lum(best)) best = c; });
    if (best === null || lum(best) > 0.55) return "#1f2937";
    return best;
  }
  function colorOf(h) {
    if (!h || h === "none") return "none";
    if (S.mono.on) return S.mono.color;
    return S.colors[h] || h;
  }
  function nameColor() { return S.nc || autoColor(cur()); }
  function frameColor() { return S.fc || autoColor(cur()); }
  function templatesFor(group, fam) {
    return ALL.filter(function (d) { return groupOf(d.cat) === group && (!fam || d.cat === fam); });
  }
  function usableCats() {
    return BGROUPS.filter(function (g) { return templatesFor(g[0]).length; });
  }
  function famsOf(group) {
    var seen = {}, out = [];
    ALL.forEach(function (d) { if (groupOf(d.cat) === group && !seen[d.cat]) { seen[d.cat] = 1; out.push(FAMS[d.cat]); } });
    return out;
  }
  function fontFor(kind) {
    var text = kind === "n" ? ((S.name || "").trim() || "Your Business") : S.tag;
    var sc = scriptOf(text);
    return FBY[(kind === "n" ? S.fn : S.ft)[sc]] || FBY[kind === "n" ? DEF.fn[sc] : DEF.ft[sc]] || FONTS[0];
  }
  function fontStr(f, px) {
    return (f && f.i ? "italic " : "") + (f ? f.w : 600) + " " + px + 'px "' + (f ? f.f : "Poppins") + '", "Poppins", "Noto Nastaliq Urdu", sans-serif';
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* ============================== font loading ============================== */
  var fontLinks = {};
  function loadFont(f, text) {
    if (!f) return Promise.resolve();
    if (!fontLinks[f.k]) {
      fontLinks[f.k] = new Promise(function (res) {
        var l = document.createElement("link");
        l.rel = "stylesheet"; l.href = "https://fonts.googleapis.com/css2?family=" + f.q + "&display=swap";
        l.onload = res; l.onerror = res; document.head.appendChild(l);
        setTimeout(res, 6000);
      });
    }
    return fontLinks[f.k].then(function () {
      var spec = (f.i ? "italic " : "") + f.w + ' 40px "' + f.f + '"';
      return Promise.race([
        document.fonts.load(spec, text || "Ab").catch(function () { return []; }),
        new Promise(function (r) { setTimeout(r, 5000); })
      ]);
    });
  }
  function ensureFonts() {
    var name = (S.name || "").trim() || "Your Business";
    return Promise.all([loadFont(fontFor("n"), name), S.tag ? loadFont(fontFor("t"), S.tag) : null,
      loadFont(FBY["poppins-700"], "Ab"), isRTL(name + S.tag) ? loadFont(FBY["noto-nastaliq-urdu-600"], name + S.tag) : null]);
  }

  /* ============================== symbol svg ============================== */
  function partAttrs(p, hit) {
    var a = 'd="' + p.d + '" fill="' + (p.f && p.f !== "none" ? colorOf(p.f) : "none") + '" fill-rule="evenodd"';
    if (p.s) a += ' stroke="' + colorOf(p.s) + '" stroke-width="' + (p.w || 3) + '" stroke-linecap="round" stroke-linejoin="round"';
    else if (hit) a += ' stroke="rgba(0,0,0,0.004)" stroke-width="' + hit + '"';
    if (p.tr) a += ' transform="' + p.tr + '"';
    return a;
  }
  function cutsMask(d, id) {
    if (!S.cuts.length) return "";
    var vb = d.vb, x = vb[0] - vb[2], y = vb[1] - vb[3], w = vb[2] * 3, h = vb[3] * 3;
    var m = '<defs><mask id="' + id + '" maskUnits="userSpaceOnUse" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="#fff"/>';
    S.cuts.forEach(function (c) { m += '<path d="' + cutPath(c) + '" fill="#000"/>'; });
    return m + "</mask></defs>";
  }
  function cutPath(c) {
    var s = "";
    for (var i = 0; i < c.length; i += 2) s += (i ? "L" : "M") + c[i] + " " + c[i + 1];
    return s + "Z";
  }
  function frameMarkup() {
    var d = cur(), c = frameColor(), fill = S.fstyle === "fill";
    switch (S.frame) {
      case "circle":
        return fill ? '<circle cx="500" cy="500" r="480" fill="' + c + '"/>' : '<circle cx="500" cy="500" r="468" fill="none" stroke="' + c + '" stroke-width="24"/>';
      case "double":
        return '<circle cx="500" cy="500" r="474" fill="none" stroke="' + c + '" stroke-width="26"/><circle cx="500" cy="500" r="424" fill="none" stroke="' + c + '" stroke-width="9"/>';
      case "square":
        return fill ? '<rect x="22" y="22" width="956" height="956" rx="190" fill="' + c + '"/>' : '<rect x="38" y="38" width="924" height="924" rx="180" fill="none" stroke="' + c + '" stroke-width="24"/>';
      case "hex":
        var pts = [], R = fill ? 470 : 452;
        for (var i = 0; i < 6; i++) { var a = (90 + 60 * i) * Math.PI / 180; pts.push((500 + R * Math.cos(a)).toFixed(1) + "," + (500 + R * Math.sin(a)).toFixed(1)); }
        return fill ? '<polygon points="' + pts.join(" ") + '" fill="' + c + '" stroke="' + c + '" stroke-width="40" stroke-linejoin="round"/>'
          : '<polygon points="' + pts.join(" ") + '" fill="none" stroke="' + c + '" stroke-width="24" stroke-linejoin="round"/>';
    }
    return "";
  }
  function boxFor() { return { none: 1000, circle: 780, double: 700, square: 800, hex: 720 }[S.frame] || 1000; }
  function symbolSVG(px) {
    var d = cur(), vb = d.vb, k = boxFor() / vb[2], cx = vb[0] + vb[2] / 2, cy = vb[1] + vb[3] / 2;
    var parts = "";
    d.parts.forEach(function (p, i) { if (S.hidden.indexOf(i) < 0) parts += "<path " + partAttrs(p) + "/>"; });
    var mask = cutsMask(d, "cm");
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + px + '" height="' + px + '" viewBox="0 0 1000 1000">' +
      frameMarkup() + '<g transform="translate(500 500) scale(' + k.toFixed(4) + ") translate(" + (-cx).toFixed(2) + " " + (-cy).toFixed(2) + ')">' +
      mask + (mask ? '<g mask="url(#cm)">' : "<g>") + parts + "</g></g></svg>";
  }
  function loadImg(svg) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
      var im = new Image();
      im.onload = function () { URL.revokeObjectURL(url); res(im); };
      im.onerror = function () { URL.revokeObjectURL(url); rej(new Error("symbol failed")); };
      im.src = url;
    });
  }
  function thumbSVG(d) {
    if (d._thumb) return d._thumb;
    var s = '<svg viewBox="' + d.vb.join(" ") + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">';
    d.parts.forEach(function (p) {
      var a = 'd="' + p.d + '" fill="' + (p.f || "none") + '" fill-rule="evenodd"';
      if (p.s) a += ' stroke="' + p.s + '" stroke-width="' + (p.w || 3) + '" stroke-linecap="round" stroke-linejoin="round"';
      if (p.tr) a += ' transform="' + p.tr + '"';
      s += "<path " + a + "/>";
    });
    d._thumb = s + "</svg>";
    return d._thumb;
  }

  /* ============================== layout plan + drawing ============================== */
  var mctx = document.createElement("canvas").getContext("2d");
  function measure(text, f, maxW, start, min, rtl) {
    var px = Math.max(min, Math.round(start));
    mctx.direction = rtl ? "rtl" : "ltr";
    for (;;) {
      mctx.font = fontStr(f, px);
      var m = mctx.measureText(text);
      if (m.width <= maxW || px <= min) return { px: px, w: m.width, asc: m.actualBoundingBoxAscent || px * 0.8, desc: m.actualBoundingBoxDescent || px * 0.2 };
      px = Math.max(min, Math.floor(px * 0.94));
    }
  }
  function plan() {
    var L = S.layout, name = (S.name || "").trim() || "Your Business", tag = (S.tag || "").trim();
    var nf = fontFor("n"), tf = fontFor("t"), nR = isRTL(name), tR = isRTL(tag);
    var sk = S.ss / 100, tk = S.ts / 100, P = { L: L, nR: nR, tR: tR, nf: nf, tf: tf, sym: null, name: null, tag: null };
    function lines(maxW) {
      var nm = measure(name, nf, maxW, 150 * tk, 24, nR);
      var tg = tag ? measure(tag, tf, maxW, Math.max(30, nm.px * 0.36), 18, tR) : null;
      return { nm: nm, tg: tg, h: nm.asc + nm.desc + (tg ? 34 + tg.asc + tg.desc : 0) };
    }
    if (L === "icon") {
      P.LW = 1000; P.LH = 1000;
      var s0 = Math.min(900 * sk, 900);
      P.sym = { x: (P.LW - s0) / 2, y: (P.LH - s0) / 2, s: s0 };
    } else if (L === "text") {
      P.LW = 1600; P.LH = 700;
      var t = lines(P.LW - 160), y0 = (P.LH - t.h) / 2;
      P.name = { text: name, px: t.nm.px, x: P.LW / 2, y: y0 + t.nm.asc, align: "center", rtl: nR };
      if (t.tg) P.tag = { text: tag, px: t.tg.px, x: P.LW / 2, y: y0 + t.nm.asc + t.nm.desc + 34 + t.tg.asc, align: "center", rtl: tR };
    } else if (L === "side") {
      P.LW = 1600; P.LH = 800;
      var S0 = Math.min(640 * sk, P.LH - 100), mg = 60, gap = 40, tw = P.LW - 2 * mg - S0 - gap;
      if (tw < 360) { S0 = P.LW - 2 * mg - gap - 360; tw = 360; }
      var u = lines(tw), rtl = nR, uy = (P.LH - u.h) / 2;
      var sx = rtl ? P.LW - mg - S0 : mg, ax = rtl ? P.LW - mg - S0 - gap : mg + S0 + gap, al = rtl ? "right" : "left";
      P.sym = { x: sx, y: (P.LH - S0) / 2, s: S0 };
      P.name = { text: name, px: u.nm.px, x: ax, y: uy + u.nm.asc, align: al, rtl: nR };
      if (u.tg) P.tag = { text: tag, px: u.tg.px, x: ax, y: uy + u.nm.asc + u.nm.desc + 34 + u.tg.asc, align: al, rtl: tR };
    } else {
      P.LW = 1200; P.LH = 1200;
      var v = lines(P.LW - 160), S1 = Math.min(620 * sk, P.LW - 120);
      if (S1 + 10 + v.h > P.LH - 100) S1 = Math.max(160, P.LH - 110 - v.h);
      var top = (P.LH - (S1 + 10 + v.h)) / 2;
      P.sym = { x: P.LW / 2 - S1 / 2, y: top, s: S1 };
      var by = top + S1 + 10 + v.nm.asc;
      P.name = { text: name, px: v.nm.px, x: P.LW / 2, y: by, align: "center", rtl: nR };
      if (v.tg) P.tag = { text: tag, px: v.tg.px, x: P.LW / 2, y: by + v.nm.desc + 34 + v.tg.asc, align: "center", rtl: tR };
    }
    return P;
  }
  function drawPlan(canvas, sc, P, img) {
    canvas.width = Math.round(P.LW * sc); canvas.height = Math.round(P.LH * sc);
    var ctx = canvas.getContext("2d");
    ctx.setTransform(sc, 0, 0, sc, 0, 0);
    ctx.clearRect(0, 0, P.LW, P.LH);
    if (!S.bg.clear) { ctx.fillStyle = S.bg.color; ctx.fillRect(0, 0, P.LW, P.LH); }
    if (P.sym && img) ctx.drawImage(img, P.sym.x, P.sym.y, P.sym.s, P.sym.s);
    ctx.textBaseline = "alphabetic";
    if (P.name) {
      ctx.direction = P.name.rtl ? "rtl" : "ltr"; ctx.textAlign = P.name.align;
      ctx.font = fontStr(P.nf, P.name.px); ctx.fillStyle = nameColor(); ctx.fillText(P.name.text, P.name.x, P.name.y);
    }
    if (P.tag) {
      ctx.direction = P.tag.rtl ? "rtl" : "ltr"; ctx.textAlign = P.tag.align;
      ctx.font = fontStr(P.tf, P.tag.px); ctx.fillStyle = S.tc; ctx.fillText(P.tag.text, P.tag.x, P.tag.y);
    }
  }
  function renderTo(canvas, scFn) {
    return ensureFonts().then(function () {
      var P = plan(), sc = scFn(P);
      var pr = P.sym ? loadImg(symbolSVG(Math.max(64, Math.round(P.sym.s * sc)))) : Promise.resolve(null);
      return pr.then(function (img) { drawPlan(canvas, sc, P, img); return P; });
    });
  }
  /* Watermark: repeated diagonal text over the whole preview (only when the person must pay). Downloads are never watermarked. */
  function drawWatermark(ctx, w, h) {
    var op = Math.max(5, Math.min(80, parseInt(CFG.WATERMARK_OPACITY, 10) || 30)) / 100;
    var text = CFG.APP_NAME || "Logo Hive", fs = Math.max(18, Math.round(Math.min(w, h) / 11));
    ctx.save();
    ctx.font = "700 " + fs + 'px "Poppins", Arial, sans-serif'; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.translate(w / 2, h / 2); ctx.rotate(-Math.PI / 6);
    var tw = ctx.measureText(text).width, sx = tw * 1.7, sy = fs * 3, R = Math.hypot(w, h) / 2 + sx, row = 0;
    ctx.lineJoin = "round"; ctx.lineWidth = Math.max(2, fs / 9);
    for (var y = -R; y < R; y += sy, row++) {
      for (var x = -R + (row % 2 ? sx / 2 : 0); x < R; x += sx) {
        ctx.strokeStyle = "rgba(255,255,255," + (op * 0.9).toFixed(3) + ")"; ctx.strokeText(text, x, y);
        ctx.fillStyle = "rgba(20,20,20," + op.toFixed(3) + ")"; ctx.fillText(text, x, y);
      }
    }
    ctx.restore();
  }
  var token = 0, queued = false;
  function renderPreview() {
    if (!cur() || queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      var my = ++token;
      var w = Math.max(300, ($("stage").clientWidth || 600) * Math.min(2, window.devicePixelRatio || 1));
      var canvas = document.createElement("canvas");
      renderTo(canvas, function (P) { return Math.min(1.5, w / P.LW); }).then(function () {
        if (my !== token) return;
        cv.width = canvas.width; cv.height = canvas.height;
        var pc = cv.getContext("2d"); pc.drawImage(canvas, 0, 0);
        if (CFG.WATERMARK !== false && needsPay()) drawWatermark(pc, cv.width, cv.height);
      }).catch(function () { });
    });
  }

  /* ============================== share-link state ============================== */
  function encode() {
    var p = new URLSearchParams();
    p.set("t", S.tid);
    if (S.name) p.set("n", S.name);
    if (S.tag) p.set("g", S.tag);
    if (S.fn.en !== DEF.fn.en) p.set("fe", S.fn.en);
    if (S.fn.ur !== DEF.fn.ur) p.set("fu", S.fn.ur);
    if (S.ft.en !== DEF.ft.en) p.set("te", S.ft.en);
    if (S.ft.ur !== DEF.ft.ur) p.set("tu", S.ft.ur);
    if (S.nc) p.set("nc", S.nc.slice(1));
    if (S.tc !== DEF.tc) p.set("tc", S.tc.slice(1));
    var cs = Object.keys(S.colors).map(function (k) { return k.slice(1) + "-" + S.colors[k].slice(1); });
    if (cs.length) p.set("c", cs.join(","));
    if (S.hidden.length) p.set("x", S.hidden.join("."));
    if (S.cuts.length) p.set("k", S.cuts.map(function (c) { return c.join(","); }).join(";"));
    if (S.mono.on) p.set("m", S.mono.color.slice(1));
    if (S.frame !== "none") p.set("f", S.frame);
    if (S.fstyle === "fill") p.set("fs", "f");
    if (S.fc) p.set("fc", S.fc.slice(1));
    if (S.bg.clear) p.set("b", "clear"); else if (S.bg.color !== "#ffffff") p.set("b", S.bg.color.slice(1));
    if (S.layout !== "stack") p.set("l", S.layout);
    if (S.ss !== 100) p.set("ss", S.ss);
    if (S.ts !== 100) p.set("ts", S.ts);
    return p.toString();
  }
  function decode(str) {
    var p = new URLSearchParams(str);
    var t = p.get("t");
    if (t && BYID[t]) { S.tid = t; S.cat = groupOf(BYID[t].cat); S.fam = ""; }
    if (p.get("n")) S.name = p.get("n").slice(0, 40);
    if (p.get("g")) S.tag = p.get("g").slice(0, 60);
    [["fe", "fn", "en"], ["fu", "fn", "ur"], ["te", "ft", "en"], ["tu", "ft", "ur"]].forEach(function (x) { if (FBY[p.get(x[0])]) S[x[1]][x[2]] = p.get(x[0]); });
    function hx(v) { return /^[0-9a-fA-F]{6}$/.test(v || "") ? "#" + v.toLowerCase() : null; }
    if (hx(p.get("nc"))) S.nc = hx(p.get("nc"));
    if (hx(p.get("tc"))) S.tc = hx(p.get("tc"));
    (p.get("c") || "").split(",").forEach(function (pair) {
      var a = pair.split("-"); if (hx(a[0]) && hx(a[1])) S.colors[hx(a[0])] = hx(a[1]);
    });
    if (p.get("x")) S.hidden = p.get("x").split(".").map(Number).filter(function (n) { return n >= 0 && n < 5000; });
    if (p.get("k")) S.cuts = p.get("k").split(";").map(function (s) { return s.split(",").map(Number); }).filter(function (c) { return c.length >= 6 && c.every(isFinite); }).slice(0, 30);
    if (hx(p.get("m"))) { S.mono = { on: true, color: hx(p.get("m")) }; S.monoTouched = true; }
    if (FRAMES.some(function (f) { return f[0] === p.get("f"); })) S.frame = p.get("f");
    if (p.get("fs") === "f") S.fstyle = "fill";
    if (hx(p.get("fc"))) S.fc = hx(p.get("fc"));
    if (p.get("b") === "clear") S.bg.clear = true; else if (hx(p.get("b"))) S.bg.color = hx(p.get("b"));
    if (["side", "icon", "text"].indexOf(p.get("l")) >= 0) S.layout = p.get("l");
    if (+p.get("ss") >= 50 && +p.get("ss") <= 130) S.ss = +p.get("ss");
    if (+p.get("ts") >= 50 && +p.get("ts") <= 140) S.ts = +p.get("ts");
  }
  function writeHash() {
    var s = encode();
    try { history.replaceState(null, "", "#" + s); } catch (e) { }
    return s;
  }

  /* ============================== UI: categories, grid ============================== */
  function setSw(btn, hex) { btn.firstElementChild.style.setProperty("--c", hex); }
  function chooseCat(group, fam) {
    S.cat = group; S.fam = fam || "";
    var list = templatesFor(S.cat, S.fam);
    if (list.length && !list.some(function (d) { return d.id === S.tid; })) pickDesign(list[0].id);
    syncUI();
  }
  function renderCats() {
    var box = $("cats"); box.innerHTML = "";
    usableCats().forEach(function (c) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "chip" + (c[0] === S.cat ? " on" : "");
      b.innerHTML = esc(c[1]) + (c[2] ? " <small>" + esc(c[2]) + "</small>" : "");
      b.addEventListener("click", function () { chooseCat(c[0], ""); });
      box.appendChild(b);
    });
    var on = box.querySelector(".chip.on"); if (on && box.scrollWidth > box.clientWidth) { box.scrollLeft = Math.max(0, on.offsetLeft - (box.clientWidth - on.offsetWidth) / 2); } /* scrolls only the chip row, never the page */
    var fb = $("fams"); fb.innerHTML = "";
    var fl = famsOf(S.cat);
    if (fl.length > 1 && CFG.SHOW_SUBTYPES !== false) {
      var all = document.createElement("button");
      all.type = "button"; all.className = "chip" + (!S.fam ? " on" : ""); all.textContent = "All";
      all.addEventListener("click", function () { chooseCat(S.cat, ""); });
      fb.appendChild(all);
      fl.forEach(function (f) {
        var b = document.createElement("button");
        b.type = "button"; b.className = "chip" + (S.fam === f.id ? " on" : "");
        b.innerHTML = esc(f.en) + (f.ur ? " <small>" + esc(f.ur) + "</small>" : "");
        b.addEventListener("click", function () { chooseCat(S.cat, f.id); });
        fb.appendChild(b);
      });
    }
  }
  function renderGrid() {
    var grid = $("grid"), list = templatesFor(S.cat, S.fam);
    var html = "";
    list.forEach(function (d) {
      html += '<button type="button" class="tile' + (d.id === S.tid ? " on" : "") + '" data-id="' + esc(d.id) + '" aria-label="Logo style ' + esc(d.id) + '">' + thumbSVG(d) + "</button>";
    });
    grid.innerHTML = html;
    $("count").textContent = list.length + " designs";
  }
  /* ---- business search (2,000+ niches) ---- */
  var NICHES = (NI.niches || []).map(function (n) { var f = NI.fams[n[1]]; return { name: n[0], low: n[0].toLowerCase(), fam: f ? f[0] : "" }; });
  (CUS.categories || []).forEach(function (c) { NICHES.push({ name: c.en || c.id, low: (c.en || c.id).toLowerCase() + " " + (c.ur || ""), fam: c.id }); });
  var resHL = -1;
  function runSearch() {
    var q = $("nicheSearch").value.trim().toLowerCase(), box = $("nicheRes");
    if (q.length < 2) { box.hidden = true; box.innerHTML = ""; return; }
    var hits = [], seen = {};
    function add(n) { if (!seen[n.name] && FAMS[n.fam] && hits.length < 9) { seen[n.name] = 1; hits.push(n); } }
    NICHES.forEach(function (n) { if (n.low.indexOf(q) === 0 || (" " + n.low).indexOf(" " + q) >= 0) add(n); });
    if (hits.length < 9) NICHES.forEach(function (n) { if (n.low.indexOf(q) >= 0) add(n); });
    Object.keys(FAMS).forEach(function (k) {   /* also match family names, including Urdu */
      var f = FAMS[k]; if ((f.en.toLowerCase().indexOf(q) >= 0 || (f.ur && f.ur.indexOf(q) >= 0)) && !seen[f.en]) add({ name: f.en, fam: k, low: "" });
    });
    resHL = -1;
    box.innerHTML = hits.length ? hits.map(function (n, i) {
      return '<button type="button" data-i="' + i + '">' + esc(n.name) + "<small>" + esc(FAMS[n.fam].en) + "</small></button>";
    }).join("") : '<div class="none">No match. Please choose from the groups below.</div>';
    box.hidden = false; box._hits = hits;
  }
  function pickNiche(n) {
    $("nicheSearch").value = n.name; $("nicheRes").hidden = true;
    chooseCat(FAMS[n.fam].group, n.fam);
  }
  function wireSearch() {
    var inp = $("nicheSearch"), box = $("nicheRes");
    inp.addEventListener("input", runSearch);
    inp.addEventListener("focus", runSearch);
    inp.addEventListener("keydown", function (e) {
      var bs = box.querySelectorAll("button[data-i]");
      if (e.key === "ArrowDown" && bs.length) { e.preventDefault(); resHL = (resHL + 1) % bs.length; }
      else if (e.key === "ArrowUp" && bs.length) { e.preventDefault(); resHL = (resHL - 1 + bs.length) % bs.length; }
      else if (e.key === "Enter") { e.preventDefault(); if (box._hits && box._hits.length) pickNiche(box._hits[Math.max(0, resHL)]); return; }
      else if (e.key === "Escape") { box.hidden = true; return; }
      else return;
      [].forEach.call(bs, function (b, i) { b.classList.toggle("hl", i === resHL); });
    });
    box.addEventListener("click", function (e) { var b = e.target.closest("button[data-i]"); if (b) pickNiche(box._hits[+b.dataset.i]); });
    document.addEventListener("pointerdown", function (e) { if (!box.hidden && !box.contains(e.target) && e.target !== inp) box.hidden = true; });
  }
  function pickDesign(id) {
    S.tid = id; S.colors = {}; S.hidden = []; S.cuts = [];
    if (!S.monoTouched) S.mono = { on: S.frame !== "none" && S.fstyle === "fill", color: "#ffffff" };
  }

  /* ============================== UI: colors ============================== */
  function openColor(btn, getHex, setHexFn) {
    HivePicker.open(btn, getHex(), function (hex) { setHexFn(hex); setSw(btn, hex); });
  }
  function renderLogoColors() {
    var box = $("logoCols"), d = cur(); box.innerHTML = "";
    if (S.mono.on) { box.innerHTML = '<span class="none">Using one color (see below)</span>'; return; }
    slots(d).forEach(function (orig, i) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "sw"; b.title = "Color " + (i + 1); b.setAttribute("aria-label", "Logo color " + (i + 1));
      b.innerHTML = "<i></i>"; setSw(b, S.colors[orig] || orig);
      b.addEventListener("click", function () {
        openColor(b, function () { return S.colors[orig] || orig; }, function (hex) { S.colors[orig] = hex; afterChange(true); });
      });
      box.appendChild(b);
    });
  }
  function afterChange(skipUI) { writeHash(); renderPreview(); if (!skipUI) updateQuota(); }

  /* ============================== UI: fonts popup ============================== */
  var fontKind = "n", fontFilter = "all", previewLoaded = false;
  var GROUPS = {
    en: [["all", "All"], ["bold", "Bold"], ["script", "Script"], ["serif", "Formal"], ["clean", "Clean"], ["italic", "Italic"], ["fun", "Fun"]],
    ur: [["all", "All"], ["nastaliq", "Nastaliq"], ["calli", "Calligraphy"], ["naskh", "Naskh"], ["kufi", "Kufi"], ["modern", "Modern"], ["bold", "Bold"]]
  };
  function loadPreviewFonts() {
    if (previewLoaded) return; previewLoaded = true;
    var chars = {}, urText = "اردو لوگو سویٹ بیکری";
    FONTS.forEach(function (f) { (f.n + (f.u ? urText : "")).split("").forEach(function (c) { chars[c] = 1; }); });
    var text = encodeURIComponent(Object.keys(chars).join("")), chunks = [], curChunk = null;
    FONTS.forEach(function (f) {
      if (!curChunk || curChunk.length >= 6 || curChunk.some(function (x) { return x.f === f.f; })) { curChunk = []; chunks.push(curChunk); }
      curChunk.push(f);
    });
    chunks.forEach(function (ch) {
      var l = document.createElement("link"); l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?" + ch.map(function (f) { return "family=" + f.q; }).join("&") + "&text=" + text + "&display=swap";
      document.head.appendChild(l);
    });
  }
  function currentFontKey(kind) { var sc = scriptOf(kind === "n" ? S.name : S.tag); return (kind === "n" ? S.fn : S.ft)[sc]; }
  function renderFontPop() {
    var kind = fontKind, text = kind === "n" ? S.name : S.tag, sc = scriptOf(text), isUr = sc === "ur";
    $("fontTitle").textContent = (kind === "n" ? "Name font" : "Tagline font") + (isUr ? " - Urdu" : "");
    var chips = $("fontChips"); chips.innerHTML = "";
    GROUPS[sc].forEach(function (g) {
      var b = document.createElement("button"); b.type = "button"; b.className = "chip" + (fontFilter === g[0] ? " on" : ""); b.textContent = g[1];
      b.addEventListener("click", function () { fontFilter = g[0]; renderFontPop(); });
      chips.appendChild(b);
    });
    var list = $("fontList"); list.innerHTML = "";
    var curKey = currentFontKey(kind);
    var sample = isUr ? (text && text.trim() ? text.trim() : "سویٹ بیکری") : null;
    FONTS.filter(function (f) { return (f.u ? "ur" : "en") === sc && (fontFilter === "all" || f.g === fontFilter || (fontFilter === "italic" && f.i)); }).forEach(function (f) {
      var b = document.createElement("button"); b.type = "button"; b.className = "frow" + (f.k === curKey ? " on" : "") + (isUr ? " rtl" : "");
      b.innerHTML = '<span class="s" style="font-family:\'' + f.f + "',serif;font-weight:" + f.w + ";font-style:" + (f.i ? "italic" : "normal") + '">' + esc(isUr ? sample : f.n) + '</span><span class="n">' + esc(isUr ? f.n : (f.g)) + "</span>";
      b.addEventListener("click", function () {
        (kind === "n" ? S.fn : S.ft)[sc] = f.k;
        syncUI();
        if (window.innerWidth < 640) closeFontPop(); else renderFontPop();
      });
      list.appendChild(b);
    });
  }
  var fontAnchor = null;
  function openFontPop(kind, anchor) {
    loadPreviewFonts(); fontKind = kind; fontFilter = "all"; fontAnchor = anchor;
    var pop = $("fontPop"); pop.hidden = false; renderFontPop(); placePop(pop, anchor);
  }
  function closeFontPop() { $("fontPop").hidden = true; fontAnchor = null; }
  function placePop(pop, anchor) {
    if (window.innerWidth < 640) { pop.classList.add("sheet"); pop.style.left = pop.style.top = ""; return; }
    pop.classList.remove("sheet");
    var r = anchor.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
    var x = Math.max(8, Math.min(window.innerWidth - w - 8, r.right - w)), y = r.bottom + 8;
    if (y + h > window.innerHeight - 8) y = Math.max(8, r.top - h - 8);
    pop.style.left = x + "px"; pop.style.top = y + "px";
  }
  function updateFontButtons() {
    [["nameFont", "n"], ["tagFont", "t"]].forEach(function (x) {
      var f = fontFor(x[1]), b = $(x[0]);
      b.firstElementChild.textContent = f.n;
      b.firstElementChild.style.fontFamily = "'" + f.f + "', sans-serif";
      b.firstElementChild.style.fontWeight = f.w; b.firstElementChild.style.fontStyle = f.i ? "italic" : "normal";
      loadFont(f, f.n);
    });
  }

  /* ============================== part editor ============================== */
  var tool = "tap", hist = [], lasso = null;
  function editMarkup() {
    var d = cur(), vb = d.vb, hit = (vb[2] * 0.012).toFixed(2);
    var s = '<svg id="esvg" xmlns="http://www.w3.org/2000/svg" viewBox="' + vb.join(" ") + '">' + cutsMask(d, "cmE") + (S.cuts.length ? '<g mask="url(#cmE)">' : "<g>");
    d.parts.forEach(function (p, i) {
      s += '<path class="ep' + (S.hidden.indexOf(i) >= 0 ? " off" : "") + '" data-i="' + i + '" ' + partAttrs(p, hit) + "/>";
    });
    s += "</g>";
    S.cuts.forEach(function (c) { s += '<path class="cutline" d="' + cutPath(c) + '"/>'; });
    return s + "</svg>";
  }
  function renderEdit() {
    $("editStage").innerHTML = editMarkup();
    $("editStage").classList.toggle("erase", tool === "erase");
    $("editHint").textContent = tool === "tap"
      ? "Tap any part (for example the fork, spoon or fire). It turns faint and disappears from your logo. Tap it again to bring it back."
      : "Draw a circle with your finger or mouse around the area you want to erase. Use this when two things are joined together.";
    $("editUndo").disabled = !hist.length;
    $("editReset").disabled = !S.hidden.length && !S.cuts.length;
    Array.prototype.forEach.call($("toolSeg").children, function (b) { b.classList.toggle("on", b.dataset.v === tool); });
  }
  function rdp(pts, eps) {
    if (pts.length < 3) return pts;
    var a = pts[0], b = pts[pts.length - 1], dmax = 0, idx = 0;
    for (var i = 1; i < pts.length - 1; i++) {
      var dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy), dd;
      if (len < 1e-6) dd = Math.hypot(pts[i][0] - a[0], pts[i][1] - a[1]); // closed loop: distance from the start point
      else dd = Math.abs(dy * pts[i][0] - dx * pts[i][1] + b[0] * a[1] - b[1] * a[0]) / len;
      if (dd > dmax) { dmax = dd; idx = i; }
    }
    if (dmax > eps) { var l = rdp(pts.slice(0, idx + 1), eps), r = rdp(pts.slice(idx), eps); return l.slice(0, -1).concat(r); }
    return [a, b];
  }
  function svgPoint(e) {
    var svg = $("esvg"), pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    var q = pt.matrixTransform(svg.getScreenCTM().inverse());
    return [Math.round(q.x * 10) / 10, Math.round(q.y * 10) / 10];
  }
  function wireEdit() {
    var stage = $("editStage");
    stage.addEventListener("click", function (e) {
      if (tool !== "tap") return;
      var el = e.target.closest ? e.target.closest(".ep") : null; if (!el) return;
      var i = +el.getAttribute("data-i"), at = S.hidden.indexOf(i);
      if (at >= 0) S.hidden.splice(at, 1); else S.hidden.push(i);
      hist.push({ t: "part", i: i }); renderEdit();
    });
    stage.addEventListener("pointerdown", function (e) {
      if (tool !== "erase" || !$("esvg")) return;
      e.preventDefault(); stage.setPointerCapture(e.pointerId);
      lasso = { pts: [svgPoint(e)], el: document.createElementNS("http://www.w3.org/2000/svg", "path") };
      lasso.el.setAttribute("class", "lasso"); $("esvg").appendChild(lasso.el);
    });
    stage.addEventListener("pointermove", function (e) {
      if (!lasso) return;
      var p = svgPoint(e), last = lasso.pts[lasso.pts.length - 1];
      if (Math.hypot(p[0] - last[0], p[1] - last[1]) < cur().vb[2] * 0.004) return;
      lasso.pts.push(p); lasso.el.setAttribute("d", cutPath(lasso.pts.reduce(function (a, q) { return a.concat(q); }, [])));
    });
    function end() {
      if (!lasso) return;
      var pts = lasso.pts; lasso = null;
      if (pts.length >= 3) {
        var simp = rdp(pts, cur().vb[2] * 0.0035);
        if (simp.length >= 3) { S.cuts.push(simp.reduce(function (a, q) { return a.concat(q); }, [])); hist.push({ t: "cut" }); }
      }
      renderEdit();
    }
    stage.addEventListener("pointerup", end); stage.addEventListener("pointercancel", end);
    $("toolSeg").addEventListener("click", function (e) { var v = e.target.dataset && e.target.dataset.v; if (v) { tool = v; renderEdit(); } });
    $("editUndo").addEventListener("click", function () {
      var h = hist.pop(); if (!h) return;
      if (h.t === "cut") S.cuts.pop(); else { var at = S.hidden.indexOf(h.i); if (at >= 0) S.hidden.splice(at, 1); else S.hidden.push(h.i); }
      renderEdit();
    });
    $("editReset").addEventListener("click", function () { S.hidden = []; S.cuts = []; hist = []; renderEdit(); });
    $("editDone").addEventListener("click", closeEdit);
  }
  function openEdit() { hist = []; tool = "tap"; $("editModal").hidden = false; renderEdit(); }
  function closeEdit() { $("editModal").hidden = true; syncUI(); }

  /* ============================== downloads, free logos, unlock codes ============================== */
  var KEY = "hive_v1", mem = { free: [], ok: [], credits: 0, used: [] };
  function loadStore() {
    try { var v = JSON.parse(localStorage.getItem(KEY) || "null"); if (v) mem = Object.assign(mem, v); } catch (e) { }
  }
  function saveStore() {
    mem.ok = mem.ok.slice(-200);
    try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { }
  }
  function freeLeft() { return Math.max(0, (+CFG.FREE_LOGOS || 0) - mem.free.length); }
  function price() { return (CFG.CURRENCY || "Rs.") + " " + CFG.PRICE; }
  function perCode() { return Math.max(1, parseInt(CFG.LOGOS_PER_CODE, 10) || 1); }
  function logosWord(n) { return n + " logo" + (n === 1 ? "" : "s"); }
  function packText() { return price() + " gives you " + logosWord(perCode()); }
  function payOn() { return CFG.PAYMENT_ENABLED !== false; }
  function needsPay() { return payOn() && freeLeft() <= 0 && mem.credits <= 0 && mem.ok.indexOf(encode()) < 0; }
  function updateQuota() {
    var q = $("quota");
    if (!payOn()) { q.textContent = "Free to download. No limit."; return; }
    if (freeLeft() > 0) q.textContent = "Free logos left: " + freeLeft() + " of " + CFG.FREE_LOGOS + ". After that, " + packText() + ".";
    else if (mem.credits > 0) q.textContent = "You have " + logosWord(mem.credits) + " ready to download.";
    else q.textContent = "Your free logos are finished. " + packText() + ".";
  }
  function allowed(fp) {
    if (!payOn()) return true;
    if (mem.ok.indexOf(fp) >= 0) return true;
    if (freeLeft() > 0) { mem.free.push(fp); mem.ok.push(fp); saveStore(); return true; }
    if (mem.credits > 0) { mem.credits--; mem.ok.push(fp); saveStore(); return true; }
    return false;
  }
  function download() {
    var fp = encode();
    if (!allowed(fp)) { openPay(); return; }
    var canvas = document.createElement("canvas");
    $("dlBtn").disabled = true;
    renderTo(canvas, function (P) { return 2400 / Math.max(P.LW, P.LH); }).then(function () {
      canvas.toBlob(function (blob) {
        var a = document.createElement("a"), n = (S.name || "logo").trim().replace(/[^\w؀-ۿ]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30) || "logo";
        a.href = URL.createObjectURL(blob); a.download = n + "-logo.png"; document.body.appendChild(a); a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800);
        $("dlBtn").disabled = false; updateQuota(); renderPreview();
      }, "image/png");
    }).catch(function () { $("dlBtn").disabled = false; });
  }
  function openPay() {
    $("payTitle").textContent = "Your " + CFG.FREE_LOGOS + " free logos are finished";
    $("payLead").textContent = "Pay " + price() + " and get " + logosWord(perCode()) + " to download. It takes about a minute.";
    $("payPrice").textContent = price();
    var box = $("payAccts"); box.innerHTML = "";
    (CFG.PAY || []).forEach(function (a) {
      var row = document.createElement("div"); row.className = "acct";
      row.innerHTML = "<div><small>" + esc(a.name) + " &middot; " + esc(a.title || "") + "</small><b>" + esc(a.number) + "</b></div>";
      var cb = document.createElement("button"); cb.type = "button"; cb.textContent = "Copy";
      cb.addEventListener("click", function () {
        var done = function () { cb.textContent = "Copied"; setTimeout(function () { cb.textContent = "Copy"; }, 1500); };
        if (navigator.clipboard) navigator.clipboard.writeText(a.number).then(done, done); else done();
      });
      row.appendChild(cb); box.appendChild(row);
    });
    $("codeMsg").textContent = ""; $("codeMsg").className = "msg"; $("codeIn").value = "";
    $("payModal").hidden = false;
  }
  function tryCode() {
    var raw = $("codeIn").value, m = $("codeMsg");
    if (HiveCodes.normalize(raw).length !== 12) { m.className = "msg"; m.textContent = "Please paste the full code, like HIVE-XXXX-XXXX-XXXX."; return; }
    var h = HiveCodes.hash(raw);
    if ((CFG.CODES || []).indexOf(h) < 0) { m.className = "msg"; m.textContent = "This code is not correct. Please check it and try again."; return; }
    if (mem.used.indexOf(h) >= 0) { m.className = "msg"; m.textContent = "This code was already used on this phone/computer."; return; }
    mem.used.push(h); mem.credits += perCode(); saveStore(); renderPreview();
    m.className = "msg ok"; m.textContent = "Code accepted. Downloading...";
    setTimeout(function () { $("payModal").hidden = true; download(); }, 400);
  }
  function whatsapp() {
    var link = location.href.split("#")[0] + "#" + encode();
    var msg = "Hello! I paid " + price() + " for " + logosWord(perCode()) + " on " + CFG.APP_NAME + ".\nMy payment ID: \nBusiness name: " + ((S.name || "").trim() || "-") + "\nMy design: " + link;
    window.open("https://wa.me/" + String(CFG.WHATSAPP || "").replace(/\D/g, "") + "?text=" + encodeURIComponent(msg), "_blank");
  }

  /* ============================== sync + wiring ============================== */
  function syncUI() {
    if (!cur()) return;
    renderCats(); renderGrid(); renderLogoColors(); updateFontButtons();
    setSw($("nameCol"), nameColor()); setSw($("tagCol"), S.tc);
    setSw($("frameCol"), frameColor()); setSw($("bgCol"), S.bg.color); setSw($("monoCol"), S.mono.color);
    $("mono").checked = S.mono.on; $("monoCol").hidden = !S.mono.on;
    $("clear").checked = S.bg.clear; $("bgCol").disabled = S.bg.clear; $("bgCol").style.opacity = S.bg.clear ? 0.4 : 1;
    var fr = $("frames"); fr.innerHTML = "";
    FRAMES.forEach(function (f) {
      var b = document.createElement("button"); b.type = "button"; b.className = "chip" + (S.frame === f[0] ? " on" : ""); b.textContent = f[1];
      b.addEventListener("click", function () {
        S.frame = f[0];
        if (!S.monoTouched) S.mono = { on: S.frame !== "none" && S.fstyle === "fill" && S.frame !== "double", color: "#ffffff" };
        syncUI();
      });
      fr.appendChild(b);
    });
    $("frameOpts").hidden = S.frame === "none";
    $("fstyleSeg").hidden = S.frame === "double";
    Array.prototype.forEach.call($("fstyleSeg").children, function (b) { b.classList.toggle("on", b.dataset.v === S.fstyle); });
    Array.prototype.forEach.call($("layoutSeg").children, function (b) { b.classList.toggle("on", b.dataset.v === S.layout); });
    $("ss").value = S.ss; $("ts").value = S.ts;
    var removed = S.hidden.length + S.cuts.length;
    $("editNote").textContent = removed ? removed + " change" + (removed > 1 ? "s" : "") + " made" : "";
    updateQuota(); writeHash(); renderPreview();
  }

  function wire() {
    document.title = (CFG.APP_NAME || "Logo Hive") + " - Free Logo Maker";
    $("appName").textContent = CFG.APP_NAME || "Logo Hive";
    $("name").value = S.name; $("tagline").value = S.tag;

    $("name").addEventListener("input", function (e) { S.name = e.target.value; updateFontButtons(); writeHash(); renderPreview(); if (!$("fontPop").hidden && fontKind === "n") renderFontPop(); });
    $("tagline").addEventListener("input", function (e) { S.tag = e.target.value; updateFontButtons(); writeHash(); renderPreview(); if (!$("fontPop").hidden && fontKind === "t") renderFontPop(); });
    $("nameFont").addEventListener("click", function () { openFontPop("n", $("nameFont")); });
    $("tagFont").addEventListener("click", function () { openFontPop("t", $("tagFont")); });
    $("fontPop").querySelector("[data-close]").addEventListener("click", closeFontPop);
    document.addEventListener("pointerdown", function (e) {
      var pop = $("fontPop");
      if (!pop.hidden && !pop.contains(e.target) && !(fontAnchor && fontAnchor.contains(e.target))) closeFontPop();
    }, true);

    $("nameCol").addEventListener("click", function () { var b = $("nameCol"); openColor(b, nameColor, function (h) { S.nc = h; afterChange(true); }); });
    $("tagCol").addEventListener("click", function () { var b = $("tagCol"); openColor(b, function () { return S.tc; }, function (h) { S.tc = h; afterChange(true); }); });
    $("frameCol").addEventListener("click", function () { var b = $("frameCol"); openColor(b, frameColor, function (h) { S.fc = h; afterChange(true); }); });
    $("bgCol").addEventListener("click", function () { var b = $("bgCol"); openColor(b, function () { return S.bg.color; }, function (h) { S.bg.color = h; afterChange(true); }); });
    $("monoCol").addEventListener("click", function () { var b = $("monoCol"); openColor(b, function () { return S.mono.color; }, function (h) { S.mono.color = h; S.monoTouched = true; afterChange(true); }); });

    $("grid").addEventListener("click", function (e) {
      var t = e.target.closest ? e.target.closest(".tile") : null; if (!t) return;
      pickDesign(t.getAttribute("data-id")); syncUI();
    });
    $("editBtn").addEventListener("click", openEdit);
    $("resetCols").addEventListener("click", function () { S.colors = {}; S.mono = { on: false, color: "#ffffff" }; S.monoTouched = false; S.nc = null; S.fc = null; syncUI(); });
    $("mono").addEventListener("change", function (e) {
      S.monoTouched = true; S.mono.on = e.target.checked;
      if (S.mono.on) S.mono.color = S.frame !== "none" && S.fstyle === "fill" ? "#ffffff" : autoColor(cur());
      syncUI();
    });
    $("clear").addEventListener("change", function (e) { S.bg.clear = e.target.checked; syncUI(); });
    $("fstyleSeg").addEventListener("click", function (e) {
      var v = e.target.dataset && e.target.dataset.v; if (!v) return;
      S.fstyle = v; if (!S.monoTouched) S.mono = { on: S.frame !== "none" && v === "fill", color: "#ffffff" };
      syncUI();
    });
    $("layoutSeg").addEventListener("click", function (e) { var v = e.target.dataset && e.target.dataset.v; if (v) { S.layout = v; syncUI(); } });
    $("ss").addEventListener("input", function (e) { S.ss = +e.target.value; writeHash(); renderPreview(); });
    $("ts").addEventListener("input", function (e) { S.ts = +e.target.value; writeHash(); renderPreview(); });

    $("dlBtn").addEventListener("click", download);
    $("payModal").querySelector("[data-close]").addEventListener("click", function () { $("payModal").hidden = true; });
    $("payModal").addEventListener("pointerdown", function (e) { if (e.target === $("payModal")) $("payModal").hidden = true; });
    $("payWA").addEventListener("click", whatsapp);
    $("codeGo").addEventListener("click", tryCode);
    $("codeIn").addEventListener("keydown", function (e) { if (e.key === "Enter") tryCode(); });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (!$("payModal").hidden) $("payModal").hidden = true; else if (!$("editModal").hidden) closeEdit(); else closeFontPop();
    });
    wireEdit();
    window.addEventListener("resize", function () { renderPreview(); });
  }

  function init() {
    if (!ALL.length) { document.querySelector(".layout").innerHTML = '<p class="warn">No logo designs found. Please upload designs.js.</p>'; return; }
    loadStore();
    decode((location.hash || "").replace(/^#/, ""));
    if (!S.tid || !BYID[S.tid]) {
      var cats = usableCats();
      if (!templatesFor(S.cat).length && cats.length) S.cat = cats[0][0];
      S.tid = templatesFor(S.cat, S.fam)[0].id;
    }
    if (!S.monoTouched && S.mono.on === false && S.frame !== "none" && S.fstyle === "fill") S.mono = { on: true, color: "#ffffff" };
    wire(); wireSearch(); syncUI();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(renderPreview);
  }
  window.__hive = { S: S, CFG: CFG, mem: function () { return mem; }, syncUI: syncUI, encode: encode, ALL: ALL, FONTS: FONTS, renderTo: renderTo, plan: plan };
  init();
})();
