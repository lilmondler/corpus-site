/* Единственный скрипт сайта. Без него всё работает: меню видно строкой, ленты листаются
   пальцем и колесом, блоки видны сразу. С ним — меню под кнопкой на телефоне, кнопки ←/→
   у лент, точки у карусели статей, мягкое появление блоков при прокрутке.
   Движение выключается, если в системе включено «уменьшить движение». */
(function () {
  // Скрипт подключён в <head> без defer: класс js ставится до первой отрисовки, чтобы блоки
  // с плавным появлением не мигали. Всё остальное — после разбора страницы.
  document.documentElement.classList.add("js");
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

function init() {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- Меню на узком экране --- */
  var header = document.querySelector("[data-masthead]");
  if (header) {
    var button = header.querySelector(".menu-toggle");
    header.setAttribute("data-open", "false");
    button.hidden = false;
    var setOpen = function (open) {
      header.setAttribute("data-open", open ? "true" : "false");
      button.setAttribute("aria-expanded", open ? "true" : "false");
      button.textContent = open ? button.getAttribute("data-close") : button.getAttribute("data-open");
    };
    button.addEventListener("click", function () {
      setOpen(header.getAttribute("data-open") !== "true");
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && header.getAttribute("data-open") === "true") {
        setOpen(false);
        button.focus();
      }
    });
  }

  /* --- Ленты (скриншоты, статьи): кнопки ←/→ и точки --- */
  function step(track) {
    var item = track.firstElementChild;
    if (!item) return track.clientWidth;
    var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return item.getBoundingClientRect().width + gap;
  }

  Array.prototype.forEach.call(document.querySelectorAll("[data-strip]"), function (strip) {
    var track = strip.querySelector("[data-track]");
    var controls = strip.querySelector("[data-controls]");
    if (!track || !controls) return;
    var prev = controls.querySelector("[data-prev]");
    var next = controls.querySelector("[data-next]");
    var dots = strip.querySelector("[data-dots]");
    var items = Array.prototype.slice.call(track.children);
    controls.hidden = false;
    var items0 = track.children;
    if (items0.length === 0) return;

    function index() {
      return Math.round(track.scrollLeft / step(track));
    }
    function go(i) {
      track.scrollTo({ left: i * step(track), behavior: reduce ? "auto" : "smooth" });
    }
    function update() {
      var max = track.scrollWidth - track.clientWidth - 4;
      var fits = track.scrollWidth <= track.clientWidth + 8;
      controls.hidden = fits;
      if (dots) dots.hidden = fits;
      prev.disabled = track.scrollLeft <= 8;
      next.disabled = track.scrollLeft >= max;
      if (dots) {
        var current = Math.min(index(), items.length - 1);
        Array.prototype.forEach.call(dots.querySelectorAll("button"), function (dot, i) {
          dot.setAttribute("aria-current", i === current ? "true" : "false");
        });
      }
    }

    prev.addEventListener("click", function () { go(index() - 1); });
    next.addEventListener("click", function () { go(index() + 1); });
    track.addEventListener("scroll", function () { window.requestAnimationFrame(update); }, { passive: true });
    window.addEventListener("resize", update);

    if (dots) {
      items.forEach(function (item, i) {
        var li = document.createElement("li");
        var dot = document.createElement("button");
        dot.type = "button";
        dot.setAttribute("aria-label", (dots.getAttribute("data-label") || "") + " " + (i + 1));
        dot.addEventListener("click", function () { go(i); });
        li.appendChild(dot);
        dots.appendChild(li);
      });
    }
    update();

    /* Карусель статей сама листается раз в 7 секунд, пока на неё не смотрят и не трогают. */
    if (strip.hasAttribute("data-auto") && !reduce && items.length > 1) {
      var paused = false;
      ["mouseenter", "focusin", "touchstart", "pointerdown"].forEach(function (name) {
        strip.addEventListener(name, function () { paused = true; }, { passive: true });
      });
      strip.addEventListener("mouseleave", function () { paused = false; });
      window.setInterval(function () {
        if (paused || document.hidden) return;
        var atEnd = track.scrollLeft >= track.scrollWidth - track.clientWidth - 4;
        go(atEnd ? 0 : index() + 1);
      }, 7000);
    }
  });

  /* --- Мягкое появление блоков --- */
  var blocks = document.querySelectorAll(".reveal");
  if (!reduce && "IntersectionObserver" in window) {
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          seen.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    Array.prototype.forEach.call(blocks, function (block) { seen.observe(block); });
  } else {
    Array.prototype.forEach.call(blocks, function (block) { block.classList.add("is-in"); });
  }
}
})();
