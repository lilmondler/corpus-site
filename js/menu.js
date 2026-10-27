/* Мобильное меню. Без этого файла сайт работает: ссылки меню просто видны строкой.
   С ним на узком экране меню прячется под кнопку «меню». */
(function () {
  var header = document.querySelector("[data-masthead]");
  if (!header) return;
  var button = header.querySelector(".menu-toggle");
  document.documentElement.classList.add("js");
  header.setAttribute("data-open", "false");
  button.hidden = false;

  function setOpen(open) {
    header.setAttribute("data-open", open ? "true" : "false");
    button.setAttribute("aria-expanded", open ? "true" : "false");
  }
  button.addEventListener("click", function () {
    setOpen(header.getAttribute("data-open") !== "true");
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && header.getAttribute("data-open") === "true") {
      setOpen(false);
      button.focus();
    }
  });
})();
