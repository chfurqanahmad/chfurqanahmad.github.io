(() => {
  const navToggle = document.querySelector(".nav-toggle");
  const navMenu = document.querySelector(".nav-menu");
  const navLinks = document.querySelectorAll(".nav-menu a");

  if (navToggle && navMenu) {
    const closeMenu = (restoreFocus = false) => {
      const wasOpen = navMenu.classList.contains("open");
      navMenu.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Open navigation");
      document.body.classList.remove("menu-open");
      if (restoreFocus && wasOpen) navToggle.focus();
    };

    const openMenu = () => {
      navMenu.classList.add("open");
      navToggle.setAttribute("aria-expanded", "true");
      navToggle.setAttribute("aria-label", "Close navigation");
      document.body.classList.add("menu-open");
    };

    navToggle.addEventListener("click", (event) => {
      event.stopPropagation();
      if (navMenu.classList.contains("open")) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        closeMenu();
        const target = document.querySelector(link.getAttribute("href"));
        if (target) {
          if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
          target.focus({ preventScroll: true });
        }
      });
    });

    document.addEventListener("pointerdown", (event) => {
      if (
        navMenu.classList.contains("open") &&
        !navMenu.contains(event.target) &&
        !navToggle.contains(event.target)
      ) {
        closeMenu();
      }
    });

    window.addEventListener("hashchange", () => closeMenu());

    window.addEventListener("resize", () => {
      if (window.innerWidth > 980) closeMenu();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu(true);
    });

    navMenu.addEventListener("focusout", () => {
      window.setTimeout(() => {
        if (!navMenu.contains(document.activeElement) && document.activeElement !== navToggle) closeMenu();
      }, 0);
    });
    document.documentElement.classList.add("nav-ready");
  }

  document.querySelectorAll("[data-copy-email]").forEach((button) => {
    const label = button.querySelector("[data-copy-label]");
    let resetTimer;
    button.addEventListener("click", async () => {
      const email = button.getAttribute("data-copy-email");
      try {
        if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error("Clipboard unavailable");
        await navigator.clipboard.writeText(email);
        if (label) {
          label.textContent = "Email copied";
          window.clearTimeout(resetTimer);
          resetTimer = window.setTimeout(() => { label.textContent = "Copy email address"; }, 2200);
        }
      } catch {
        window.prompt("Copy this email address:", email);
      }
    });
  });

  const year = document.querySelector("[data-current-year]");
  if (year) year.textContent = new Date().getFullYear();
})();
