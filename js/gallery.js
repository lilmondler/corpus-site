/* Галерея corpus: любая картинка на странице открывается во весь экран, листается
   свайпом, стрелками и клавиатурой и скачивается карточкой с подписью corpus.
   Без библиотек и внешних адресов. Подключается из base.html. */
(function () {
  "use strict";

  var L = {
    fr: { close: "Fermer", prev: "Précédente", next: "Suivante", dl: "télécharger la carte", of: "sur", label: "Galerie d’images" },
    en: { close: "Close", prev: "Previous", next: "Next", dl: "download card", of: "of", label: "Image gallery" },
    ru: { close: "Закрыть", prev: "Предыдущая", next: "Следующая", dl: "скачать карточку", of: "из", label: "Галерея изображений" }
  };
  var lang = (document.documentElement.lang || "fr").slice(0, 2);
  var T = L[lang] || L.fr;
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var SELECTOR = "img.polaroid-photo, .prose img, img[data-gallery]";
  var items = [], box, stage, img, cap, count, current = 0, lastFocus = null, lastDx = 0;

  function captionOf(el) {
    var fig = el.closest("figure");
    var fc = fig && fig.querySelector("figcaption");
    return (fc && fc.textContent.trim()) || el.getAttribute("alt") || "";
  }

  function collect() {
    items = Array.prototype.filter.call(document.querySelectorAll(SELECTOR), function (el) {
      return !el.closest(".site-header, .site-footer") && el.naturalWidth !== 1;
    });
    items.forEach(function (el, i) {
      el.classList.add("zoomable");
      el.setAttribute("tabindex", "0");
      el.setAttribute("role", "button");
      el.addEventListener("click", function () { open(i); });
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(i); }
      });
    });
  }

  function build() {
    box = document.createElement("div");
    box.className = "lb";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", T.label);
    box.hidden = true;
    box.innerHTML =
      '<div class="lb-top"><span class="lb-mark">corpus</span><span class="lb-count" aria-live="polite"></span>' +
      '<button type="button" class="lb-btn lb-close" aria-label="' + T.close + '">×</button></div>' +
      '<div class="lb-stage"><figure class="lb-card"><img class="lb-img" alt=""><figcaption class="lb-cap"></figcaption></figure></div>' +
      '<button type="button" class="lb-btn lb-prev" aria-label="' + T.prev + '">←</button>' +
      '<button type="button" class="lb-btn lb-next" aria-label="' + T.next + '">→</button>' +
      '<div class="lb-bottom"><button type="button" class="lb-dl">↓ ' + T.dl + '</button></div>';
    document.body.appendChild(box);
    stage = box.querySelector(".lb-stage");
    img = box.querySelector(".lb-img");
    cap = box.querySelector(".lb-cap");
    count = box.querySelector(".lb-count");

    box.querySelector(".lb-close").addEventListener("click", close);
    box.querySelector(".lb-prev").addEventListener("click", function () { go(-1); });
    box.querySelector(".lb-next").addEventListener("click", function () { go(1); });
    box.querySelector(".lb-dl").addEventListener("click", download);
    stage.addEventListener("click", function (e) { if (e.target === stage && Math.abs(lastDx) < 5) close(); });

    document.addEventListener("keydown", function (e) {
      if (box.hidden) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "Tab") trap(e);
    });

    // Свайп одним пальцем или мышью; второй палец (масштаб) отменяет жест.
    var x0 = null, dx = 0, pid = null, active = 0;
    stage.addEventListener("pointerdown", function (e) {
      active++;
      if (active > 1) { cancel(); return; }
      if (e.pointerType === "mouse" && e.button !== 0) return;
      x0 = e.clientX; dx = 0; lastDx = 0; pid = e.pointerId;
    });
    stage.addEventListener("pointermove", function (e) {
      if (x0 === null || e.pointerId !== pid) return;
      dx = e.clientX - x0;
      if (!reduced) box.querySelector(".lb-card").style.transform = "translateX(" + dx + "px) rotate(" + dx / 60 + "deg)";
    });
    function cancel() { x0 = null; pid = null; box.querySelector(".lb-card").style.transform = ""; }
    function end(e) {
      active = Math.max(0, active - 1);
      if (x0 === null || e.pointerId !== pid) return;
      lastDx = dx;
      box.querySelector(".lb-card").style.transform = "";
      if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
      x0 = null; pid = null;
    }
    stage.addEventListener("pointerup", end);
    stage.addEventListener("pointercancel", end);
    stage.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") end(e); });
  }

  function trap(e) {
    var f = Array.prototype.filter.call(box.querySelectorAll("button"), function (b) { return !b.hidden; });
    var first = f[0], last = f[f.length - 1];
    if (!box.contains(document.activeElement)) { e.preventDefault(); first.focus(); return; }
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function show(i, dir) {
    current = (i + items.length) % items.length;
    var src = items[current];
    var card = box.querySelector(".lb-card");
    card.classList.remove("lb-in-l", "lb-in-r", "lb-in");
    void card.offsetWidth;
    card.classList.add(dir > 0 ? "lb-in-r" : dir < 0 ? "lb-in-l" : "lb-in");
    img.src = src.currentSrc || src.src;
    img.alt = src.alt || "";
    cap.textContent = captionOf(src);
    count.textContent = (current + 1) + " " + T.of + " " + items.length;
    var many = items.length > 1;
    box.querySelector(".lb-prev").hidden = !many;
    box.querySelector(".lb-next").hidden = !many;
    // заранее подгружаем соседние кадры
    [current + 1, current - 1].forEach(function (k) {
      var n = items[(k + items.length) % items.length];
      if (n) { var p = new Image(); p.src = n.currentSrc || n.src; }
    });
  }

  function open(i) {
    lastFocus = document.activeElement;
    box.hidden = false;
    document.documentElement.classList.add("lb-open");
    show(i, 0);
    box.querySelector(".lb-close").focus();
  }

  function close() {
    box.hidden = true;
    document.documentElement.classList.remove("lb-open");
    if (lastFocus) lastFocus.focus();
  }

  function go(d) { show(current + d, d); }

  // Карточка для скачивания: кадр на бумаге, подпись, знак corpus и адрес сайта.
  function download() {
    var src = items[current];
    var pic = new Image();
    pic.onload = function () {
      var fonts = document.fonts ? Promise.all([
        document.fonts.load('700 64px "Caveat"'),
        document.fonts.load('400 40px "Caveat"'),
        document.fonts.load('400 28px "Literata"'),
        document.fonts.load('400 22px "Courier Prime"')
      ]).catch(function () {}) : Promise.resolve();
      fonts.then(function () { render(pic, captionOf(src), src); });
    };
    pic.src = src.currentSrc || src.src;
  }

  function wrap(ctx, text, maxW) {
    var words = text.split(/\s+/), lines = [], line = "";
    words.forEach(function (w) {
      var t = line ? line + " " + w : w;
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else { line = t; }
    });
    if (line) lines.push(line);
    return lines.slice(0, 3);
  }

  function render(pic, caption, src) {
    var W = 1600, pad = 80, iw = W - pad * 2;
    var ih = Math.round(iw * pic.naturalHeight / pic.naturalWidth);
    var c = document.createElement("canvas");
    var ctx = c.getContext("2d");
    ctx.font = '400 40px "Caveat", cursive';
    var lines = caption ? wrap(ctx, caption, iw) : [];
    var H = pad + ih + 40 + lines.length * 44 + 150;
    c.width = W; c.height = H;

    ctx.fillStyle = "#f5f1e9"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fdfcf7";
    ctx.shadowColor = "rgba(40,30,10,.18)"; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10;
    ctx.fillRect(pad - 24, pad - 24, iw + 48, ih + 48);
    ctx.shadowColor = "transparent";
    ctx.drawImage(pic, pad, pad, iw, ih);

    var y = pad + ih + 40 + 30;
    ctx.fillStyle = "#3b3934";
    ctx.font = '400 40px "Caveat", cursive';
    lines.forEach(function (l) { ctx.fillText(l, pad, y); y += 48; });

    var base = H - 60;
    ctx.fillStyle = "#233f8f";
    ctx.font = '700 72px "Caveat", cursive';
    ctx.fillText("corpus", pad, base);
    var mw = ctx.measureText("corpus").width;
    ctx.strokeStyle = "#233f8f"; ctx.lineWidth = 5; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(pad, base + 16); ctx.quadraticCurveTo(pad + mw / 2, base + 22, pad + mw, base + 12); ctx.stroke();
    ctx.fillStyle = "#6e695f";
    ctx.font = '400 24px "Courier Prime", monospace';
    ctx.textAlign = "right";
    ctx.fillText("moncorpus.fr", W - pad, base);
    ctx.strokeStyle = "#cf3b2c"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(pad, H - 150 + 20); ctx.lineTo(W - pad, H - 150 + 20); ctx.stroke();

    var name = (src.getAttribute("src") || "image").split("/").pop().split("?")[0].replace(/\.\w+$/, "");
    var file = "corpus-" + name + ".png";
    function save(href, revoke) {
      var a = document.createElement("a");
      a.href = href; a.download = file;
      document.body.appendChild(a); a.click(); a.remove();
      if (revoke) setTimeout(function () { URL.revokeObjectURL(href); }, 4000);
    }
    function fallback() { try { save(c.toDataURL("image/png"), false); } catch (err) { /* кадр недоступен */ } }
    try {
      if (!c.toBlob) { fallback(); return; }
      c.toBlob(function (blob) { if (blob) save(URL.createObjectURL(blob), true); else fallback(); }, "image/png");
    } catch (err) { fallback(); }
  }

  function init() {
    collect();
    if (!items.length) return;
    build();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
