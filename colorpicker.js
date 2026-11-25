/* Full colour picker (like Photoshop / Illustrator): colour square, hue slider, hex box,
   eyedropper, "best colors" palette and recent colors. No libraries. */
(function (g) {
  "use strict";

  var PALETTE = [
    "#ffffff", "#f2f2f2", "#d9d9d9", "#a6a6a6", "#737373", "#404040", "#1a1a1a", "#000000",
    "#fde2e2", "#f8b4b4", "#ef4444", "#dc2626", "#b91c1c", "#7f1d1d", "#ec4899", "#be185d",
    "#ffedd5", "#fdba74", "#f97316", "#ea580c", "#fde047", "#facc15", "#d4a017", "#a16207",
    "#dcfce7", "#86efac", "#22c55e", "#16a34a", "#0f6b4f", "#166534", "#84cc16", "#4d7c0f",
    "#ccfbf1", "#2dd4bf", "#0d9488", "#0e7490", "#67e8f9", "#38bdf8", "#2563eb", "#1e3a8a",
    "#ede9fe", "#c4b5fd", "#8b5cf6", "#6d28d9", "#4c1d95", "#d946ef", "#a21caf", "#581c87",
    "#f5e6d3", "#d6b48a", "#b07d4f", "#8b5a2b", "#6f4e37", "#4a2c17", "#c0a062", "#b8860b"
  ];

  var el, sv, svh, hue, hueh, hex, cur, recBox, state = { h: 0, s: 1, v: 1 }, onChange = null, anchor = null, recent = [];
  try { recent = JSON.parse(localStorage.getItem("hive_recent") || "[]"); } catch (e) { recent = []; }

  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function hsv2rgb(h, s, v) {
    var c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c, r = 0, gg = 0, b = 0;
    if (h < 60) { r = c; gg = x; } else if (h < 120) { r = x; gg = c; } else if (h < 180) { gg = c; b = x; }
    else if (h < 240) { gg = x; b = c; } else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
    return [Math.round((r + m) * 255), Math.round((gg + m) * 255), Math.round((b + m) * 255)];
  }
  function rgb2hsv(r, gg, b) {
    r /= 255; gg /= 255; b /= 255;
    var mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), d = mx - mn, h = 0;
    if (d) {
      if (mx === r) h = 60 * (((gg - b) / d) % 6);
      else if (mx === gg) h = 60 * ((b - r) / d + 2);
      else h = 60 * ((r - gg) / d + 4);
    }
    if (h < 0) h += 360;
    return { h: h, s: mx ? d / mx : 0, v: mx };
  }
  function toHex(rgb) { return "#" + rgb.map(function (x) { return ("0" + x.toString(16)).slice(-2); }).join(""); }
  function parseHex(s) {
    s = String(s || "").trim().replace(/^#/, "");
    if (/^[0-9a-f]{3}$/i.test(s)) s = s.split("").map(function (c) { return c + c; }).join("");
    if (!/^[0-9a-f]{6}$/i.test(s)) return null;
    var n = parseInt(s, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function curHex() { return toHex(hsv2rgb(state.h, state.s, state.v)); }

  function paint(fromHexBox) {
    var hx = curHex();
    sv.style.background = "linear-gradient(to top,#000,rgba(0,0,0,0)),linear-gradient(to right,#fff,hsl(" + state.h + ",100%,50%))";
    svh.style.left = state.s * 100 + "%"; svh.style.top = (1 - state.v) * 100 + "%"; svh.style.background = hx;
    hueh.style.left = (state.h / 360) * 100 + "%"; hueh.style.background = "hsl(" + state.h + ",100%,50%)";
    cur.style.background = hx;
    if (!fromHexBox) hex.value = hx.toUpperCase();
  }
  function emit() { paint(false); if (onChange) onChange(curHex()); }
  function setHex(h, silent) {
    var rgb = parseHex(h); if (!rgb) return;
    var hsv = rgb2hsv(rgb[0], rgb[1], rgb[2]);
    if (hsv.s === 0 || hsv.v === 0) hsv.h = state.h; // keep hue for greys
    state = hsv; paint(false); if (!silent && onChange) onChange(curHex());
  }

  function drag(node, fn) {
    node.addEventListener("pointerdown", function (e) {
      e.preventDefault(); node.setPointerCapture(e.pointerId); fn(e);
      function mv(ev) { fn(ev); }
      function up() { node.removeEventListener("pointermove", mv); node.removeEventListener("pointerup", up); node.removeEventListener("pointercancel", up); remember(); }
      node.addEventListener("pointermove", mv); node.addEventListener("pointerup", up); node.addEventListener("pointercancel", up);
    });
  }

  function remember() {
    var h = curHex(); recent = recent.filter(function (x) { return x !== h; }); recent.unshift(h); recent = recent.slice(0, 14);
    try { localStorage.setItem("hive_recent", JSON.stringify(recent)); } catch (e) { }
    drawRecent();
  }
  function swatch(h) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "pk-s"; b.style.background = h; b.title = h; b.setAttribute("aria-label", h);
    b.addEventListener("click", function () { setHex(h); remember(); });
    return b;
  }
  function drawRecent() {
    recBox.innerHTML = "";
    if (!recent.length) { recBox.innerHTML = '<span class="pk-none">Colors you use will appear here</span>'; return; }
    recent.forEach(function (h) { recBox.appendChild(swatch(h)); });
  }

  function build() {
    el = document.createElement("div"); el.className = "pk"; el.hidden = true;
    el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Color picker");
    el.innerHTML =
      '<div class="pk-head"><b>Pick a color <span class="ur">رنگ چنیں</span></b><button type="button" class="pk-x" aria-label="Close">&times;</button></div>' +
      '<div class="pk-sv"><i class="pk-svh"></i></div>' +
      '<div class="pk-hue"><i class="pk-hueh"></i></div>' +
      '<div class="pk-row"><span class="pk-cur"></span><input class="pk-hex" maxlength="7" spellcheck="false" aria-label="Hex color"></div>' +
      '<button type="button" class="pk-eye" hidden>Pick a color from the screen</button>' +
      '<div class="pk-lab">Best colors</div><div class="pk-grid"></div>' +
      '<div class="pk-lab">Recent</div><div class="pk-rec"></div>' +
      '<button type="button" class="pk-done">Done</button>';
    document.body.appendChild(el);
    sv = el.querySelector(".pk-sv"); svh = el.querySelector(".pk-svh"); hue = el.querySelector(".pk-hue"); hueh = el.querySelector(".pk-hueh");
    hex = el.querySelector(".pk-hex"); cur = el.querySelector(".pk-cur"); recBox = el.querySelector(".pk-rec");
    var grid = el.querySelector(".pk-grid"); PALETTE.forEach(function (h) { grid.appendChild(swatch(h)); });
    drag(sv, function (e) {
      var r = sv.getBoundingClientRect();
      state.s = clamp((e.clientX - r.left) / r.width, 0, 1); state.v = 1 - clamp((e.clientY - r.top) / r.height, 0, 1); emit();
    });
    drag(hue, function (e) {
      var r = hue.getBoundingClientRect(); state.h = clamp((e.clientX - r.left) / r.width, 0, 1) * 359.999; emit();
    });
    hex.addEventListener("input", function () { var rgb = parseHex(hex.value); if (rgb) { var hsv = rgb2hsv(rgb[0], rgb[1], rgb[2]); if (hsv.s === 0 || hsv.v === 0) hsv.h = state.h; state = hsv; paint(true); if (onChange) onChange(curHex()); } });
    hex.addEventListener("blur", function () { paint(false); remember(); });
    var eye = el.querySelector(".pk-eye");
    if (g.EyeDropper) {
      eye.hidden = false;
      eye.addEventListener("click", function () {
        new g.EyeDropper().open().then(function (r) { setHex(r.sRGBHex); remember(); }).catch(function () { });
      });
    }
    el.querySelector(".pk-x").addEventListener("click", close);
    el.querySelector(".pk-done").addEventListener("click", close);
    document.addEventListener("pointerdown", function (e) {
      if (!el.hidden && !el.contains(e.target) && !(anchor && anchor.contains(e.target))) close();
    }, true);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !el.hidden) close(); });
    window.addEventListener("resize", function () { if (!el.hidden) place(); });
    drawRecent();
  }

  function place() {
    if (window.innerWidth < 640 || !anchor) { el.classList.add("sheet"); el.style.left = el.style.top = ""; return; }
    el.classList.remove("sheet");
    var r = anchor.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight;
    var x = clamp(r.left + r.width / 2 - w / 2, 8, window.innerWidth - w - 8);
    var y = r.bottom + 8; if (y + h > window.innerHeight - 8) y = Math.max(8, r.top - h - 8);
    el.style.left = x + "px"; el.style.top = y + "px";
  }
  function open(a, hexColor, cb) {
    if (!el) build();
    anchor = a; onChange = null; el.hidden = false; setHex(hexColor || "#000000", true); place(); onChange = cb;
  }
  function close() { if (el && !el.hidden) { remember(); el.hidden = true; onChange = null; anchor = null; } }

  g.HivePicker = { open: open, close: close, isOpen: function () { return !!el && !el.hidden; } };
})(window);
