// ---------- Preloader ----------
(function () {
  const pre = document.querySelector(".preloader");
  if (!pre) return;
  document.body.classList.add("preload-lock");

  function hide() {
    pre.classList.add("done");
    document.body.classList.remove("preload-lock");
  }
  // Hide once everything (including images) has loaded, with a small minimum
  // display time so it doesn't just flash on fast connections.
  const shown = Date.now();
  window.addEventListener("load", () => {
    const elapsed = Date.now() - shown;
    setTimeout(hide, Math.max(0, 450 - elapsed));
  });
  // Safety net in case 'load' is delayed by a slow third-party resource
  setTimeout(hide, 2500);
})();

// ---------- Header shadow on scroll ----------
(function () {
  const header = document.querySelector(".site-header");
  if (!header) return;
  function onScroll() {
    header.classList.toggle("scrolled", window.scrollY > 12);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
})();

// ---------- Scroll reveal ----------
(function () {
  const targets = document.querySelectorAll(".reveal");
  if (!targets.length) return;

  if (!("IntersectionObserver" in window)) {
    targets.forEach((t) => t.classList.add("in-view"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );
  targets.forEach((t) => io.observe(t));
})();

// ---------- Typewriter effect for highlighted words ----------
(function () {
  const targets = document.querySelectorAll(".type-target");
  if (!targets.length) return;

  targets.forEach((el, i) => {
    const full = el.textContent;
    el.textContent = "";
    el.setAttribute("aria-label", full);
    let charIndex = 0;
    const speed = 55;
    const startDelay = 500 + i * 700;

    function typeChar() {
      if (charIndex <= full.length) {
        el.textContent = full.slice(0, charIndex);
        charIndex++;
        window.setTimeout(typeChar, speed);
      } else {
        el.classList.add("type-done");
      }
    }
    window.setTimeout(typeChar, startDelay);
  });
})();

// ---------- Back to top ----------
(function () {
  const btn = document.querySelector(".back-to-top");
  if (!btn) return;
  function onScroll() {
    btn.classList.toggle("show", window.scrollY > 480);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();

// ---------- Gallery lightbox ----------
(function () {
  const items = document.querySelectorAll(".catalog-item img, .gallery img");
  if (!items.length) return;

  const overlay = document.createElement("div");
  overlay.className = "lightbox-overlay";
  overlay.innerHTML =
    '<button class="lightbox-close" aria-label="Close">&times;</button><img alt=""><span class="lightbox-caption"></span>';
  document.body.appendChild(overlay);
  const imgEl = overlay.querySelector("img");
  const captionEl = overlay.querySelector(".lightbox-caption");
  const closeBtn = overlay.querySelector(".lightbox-close");

  function open(src, alt) {
    imgEl.src = src;
    imgEl.alt = alt || "";
    captionEl.textContent = alt || "";
    overlay.classList.add("show");
  }
  function close() {
    overlay.classList.remove("show");
    imgEl.src = "";
  }

  items.forEach((img) => {
    img.style.cursor = "zoom-in";
    img.addEventListener("click", (e) => {
      // Don't hijack images that are inside plain links meant to navigate
      if (img.closest(".gallery")) return;
      e.preventDefault();
      const full = img.getAttribute("src").replace(/w=\d+/, "w=1600");
      open(full, img.getAttribute("alt"));
    });
  });

  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
})();

// ---------- Mobile nav ----------
(function () {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  // Close mobile nav when a link is tapped
  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => nav.classList.remove("open"));
  });
})();

// ---------- Gallery category filter ----------
(function () {
  const buttons = document.querySelectorAll("[data-filter]");
  const items = document.querySelectorAll("[data-category]");
  if (!buttons.length || !items.length) return;

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const filter = btn.getAttribute("data-filter");

      items.forEach((item) => {
        const show = filter === "all" || item.getAttribute("data-category") === filter;
        item.hidden = !show;
      });
    });
  });
})();

// ---------- First-visit popup ----------
(function () {
  const overlay = document.querySelector("[data-popup]");
  if (!overlay) return;

  const closeBtn = overlay.querySelector("[data-popup-close]");
  const SESSION_KEY = "whetstone_popup_seen";

  function openPopup() {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    overlay.classList.add("show");
  }
  function closePopup() {
    overlay.classList.remove("show");
    sessionStorage.setItem(SESSION_KEY, "1");
  }

  window.setTimeout(openPopup, 1800);
  closeBtn.addEventListener("click", closePopup);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closePopup();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePopup();
  });
})();
