const stepCards = [...document.querySelectorAll(".step-card")];
const stepTrack = document.querySelector(".step-track");
const stepDots = document.querySelector(".carousel-dots");
const previousStep = document.querySelector(".carousel-arrow.prev");
const nextStep = document.querySelector(".carousel-arrow.next");
const mobileLayout = window.matchMedia("(max-width: 700px)");
let currentStep = 0;

function showStep(index) {
  if (!stepCards.length) return;

  currentStep = (index + stepCards.length) % stepCards.length;

  stepCards.forEach((card, cardIndex) => {
    const active = cardIndex === currentStep;
    const previous = cardIndex === (currentStep + stepCards.length - 1) % stepCards.length;
    const next = cardIndex === (currentStep + 1) % stepCards.length;

    card.classList.toggle("active", active);
    card.classList.toggle("previous-card", previous);
    card.classList.toggle("next-card", next);
    card.style.order = previous ? "1" : active ? "2" : next ? "3" : "";
    const visible = active || (!mobileLayout.matches && (previous || next));
    card.setAttribute("aria-hidden", String(!visible));
  });

  [...(stepDots?.children ?? [])].forEach((dot, dotIndex) => {
    dot.setAttribute("aria-current", String(dotIndex === currentStep));
  });
}

if (stepDots && stepCards.length) {
  if (stepTrack) {
    stepTrack.tabIndex = 0;
    stepTrack.setAttribute("role", "region");
    stepTrack.setAttribute("aria-roledescription", "carrossel");
  }

  stepCards.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `Mostrar passo ${index + 1}`);
    dot.addEventListener("click", () => showStep(index));
    stepDots.append(dot);
  });

  previousStep?.addEventListener("click", () => showStep(currentStep - 1));
  nextStep?.addEventListener("click", () => showStep(currentStep + 1));
  stepTrack?.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showStep(currentStep - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      showStep(currentStep + 1);
    }
    if (event.key === "Home") {
      event.preventDefault();
      showStep(0);
    }
    if (event.key === "End") {
      event.preventDefault();
      showStep(stepCards.length - 1);
    }
  });

  let touchStart = null;
  stepTrack?.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "touch") return;
    touchStart = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
    stepTrack.setPointerCapture?.(event.pointerId);
  });
  stepTrack?.addEventListener("pointerup", (event) => {
    if (!touchStart || event.pointerId !== touchStart.pointerId) return;
    const distanceX = event.clientX - touchStart.x;
    const distanceY = event.clientY - touchStart.y;
    if (Math.abs(distanceX) > 45 && Math.abs(distanceX) > Math.abs(distanceY)) {
      showStep(currentStep + (distanceX < 0 ? 1 : -1));
    }
    touchStart = null;
  });
  stepTrack?.addEventListener("pointercancel", () => (touchStart = null));
  stepTrack?.addEventListener("lostpointercapture", () => (touchStart = null));
  mobileLayout.addEventListener("change", () => showStep(currentStep));

  showStep(currentStep);
}

const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");

function setMenuOpen(open) {
  if (!menuToggle || !mainNav) return;
  mainNav.classList.toggle("open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
}

menuToggle?.addEventListener("click", () => {
  setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
});

mainNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setMenuOpen(false));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setMenuOpen(false);
});

document.addEventListener("click", (event) => {
  if (
    mainNav?.classList.contains("open") &&
    !mainNav.contains(event.target) &&
    !menuToggle?.contains(event.target)
  ) {
    setMenuOpen(false);
  }
});

window.addEventListener("resize", () => {
  if (!mobileLayout.matches) setMenuOpen(false);
});

const planTrack = document.querySelector(".plans");
const planCards = [...document.querySelectorAll(".plan")];
const defaultPlan = Math.max(0, planCards.findIndex((card) => card.classList.contains("plan-highlight")));

function highlightPlan(index) {
  planCards.forEach((card, cardIndex) => {
    card.classList.toggle("plan-highlight", cardIndex === index);
  });
}

planCards.forEach((card, index) => {
  card.addEventListener("pointerenter", (event) => {
    if (event.pointerType !== "touch") highlightPlan(index);
  });
  card.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch") highlightPlan(index);
  });
  card.addEventListener("focusin", () => highlightPlan(index));
});

planTrack?.addEventListener("pointerleave", (event) => {
  if (event.pointerType !== "touch") highlightPlan(defaultPlan);
});
planTrack?.addEventListener("focusout", (event) => {
  if (!planTrack.contains(event.relatedTarget)) highlightPlan(defaultPlan);
});

const quoteTrack = document.querySelector(".quotes");
const quotes = [...document.querySelectorAll(".quote")];
const quoteDotsTrack = document.querySelector(".quote-dots");
const quoteDots = [...document.querySelectorAll(".quote-dots i")];
const mobileQuotes = window.matchMedia("(max-width: 700px)");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let currentQuote = Math.max(0, quotes.findIndex((quote) => quote.classList.contains("featured-quote")));
let quoteObserver;
let quoteScrollFrame = null;

function scrollBehavior() {
  return reducedMotion.matches ? "auto" : "smooth";
}

function rotateDesktopQuotes(previousRects) {
  if (quotes.length !== 3) return;

  const leftIndex = (currentQuote + quotes.length - 1) % quotes.length;
  const rightIndex = (currentQuote + 1) % quotes.length;
  quotes.forEach((quote, index) => {
    const order = index === leftIndex ? 1 : index === currentQuote ? 2 : index === rightIndex ? 3 : index + 3;
    quote.style.order = String(order);
  });

  if (!previousRects || reducedMotion.matches) return;
  quotes.forEach((quote, index) => {
    const nextRect = quote.getBoundingClientRect();
    const offsetX = previousRects[index].left - nextRect.left;
    const offsetY = previousRects[index].top - nextRect.top;
    if ((!offsetX && !offsetY) || typeof quote.animate !== "function") return;

    const finalTransform = getComputedStyle(quote).transform;
    const startTransform =
      finalTransform === "none"
        ? `translate(${offsetX}px, ${offsetY}px)`
        : `translate(${offsetX}px, ${offsetY}px) ${finalTransform}`;
    quote.animate(
      [{ transform: startTransform }, { transform: finalTransform }],
      { duration: 420, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    );
  });
}

function selectQuote(index, scroll = false) {
  if (!quotes.length) return;

  const previousRects = !mobileQuotes.matches
    ? quotes.map((quote) => quote.getBoundingClientRect())
    : null;
  currentQuote = (index + quotes.length) % quotes.length;
  quotes.forEach((quote, quoteIndex) => {
    const selected = quoteIndex === currentQuote;
    quote.classList.toggle("is-active", selected);
    quote.classList.toggle("featured-quote", selected);
    quote.setAttribute("aria-current", String(selected));
  });
  if (mobileQuotes.matches) {
    quotes.forEach((quote) => quote.style.removeProperty("order"));
  } else {
    rotateDesktopQuotes(previousRects);
  }
  quoteDots.forEach((dot, dotIndex) => {
    const selected = dotIndex === currentQuote;
    dot.setAttribute("aria-current", String(selected));
    dot.setAttribute("aria-label", `Mostrar depoimento ${dotIndex + 1} de ${quotes.length}`);
  });
  quoteDotsTrack?.setAttribute("aria-label", `Depoimento ${currentQuote + 1} de ${quotes.length}`);

  if (scroll && mobileQuotes.matches && quoteTrack) {
    const quote = quotes[currentQuote];
    const trackRect = quoteTrack.getBoundingClientRect();
    const quoteRect = quote.getBoundingClientRect();
    const left =
      quoteTrack.scrollLeft +
      quoteRect.left -
      trackRect.left -
      (quoteTrack.clientWidth - quoteRect.width) / 2;
    quoteTrack.scrollTo({ left: Math.max(0, left), behavior: scrollBehavior() });
  }
}

function updateQuoteFromScroll() {
  if (quoteScrollFrame !== null || !quoteTrack) return;
  quoteScrollFrame = requestAnimationFrame(() => {
    quoteScrollFrame = null;
    const trackRect = quoteTrack.getBoundingClientRect();
    let bestIndex = 0;
    let bestRatio = 0;

    quotes.forEach((quote, index) => {
      const rect = quote.getBoundingClientRect();
      const visibleWidth = Math.max(0, Math.min(trackRect.right, rect.right) - Math.max(trackRect.left, rect.left));
      const ratio = visibleWidth / Math.max(1, rect.width);
      if (ratio > bestRatio) {
        bestIndex = index;
        bestRatio = ratio;
      }
    });

    selectQuote(bestIndex);
  });
}

function observeQuotes(initial = false) {
  quoteObserver?.disconnect();
  quoteObserver = null;
  if (quoteScrollFrame !== null) cancelAnimationFrame(quoteScrollFrame);
  quoteScrollFrame = null;
  quoteTrack?.removeEventListener("scroll", updateQuoteFromScroll);

  if (!quotes.length || !quoteTrack) return;
  if (!mobileQuotes.matches) {
    selectQuote(currentQuote);
    return;
  }

  if (initial) selectQuote(0);
  else selectQuote(currentQuote, true);

  if ("IntersectionObserver" in window) {
    quoteObserver = new IntersectionObserver(
      (entries) => {
        const mostVisible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];
        if (mostVisible) selectQuote(quotes.indexOf(mostVisible.target));
      },
      { root: quoteTrack, threshold: [0.35, 0.55, 0.75, 0.9] },
    );
    quotes.forEach((quote) => quoteObserver.observe(quote));
    return;
  }

  quoteTrack.addEventListener("scroll", updateQuoteFromScroll, { passive: true });
}

quoteDots.forEach((dot, index) => {
  dot.tabIndex = 0;
  dot.setAttribute("role", "button");
  dot.addEventListener("click", () => selectQuote(index, true));
  dot.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    selectQuote(index, true);
  });
});

mobileQuotes.addEventListener("change", () => observeQuotes());
observeQuotes(true);

function findAnchorTarget(hash) {
  if (hash === "#") return document.documentElement;
  if (!hash || hash[0] !== "#") return null;

  try {
    return document.getElementById(decodeURIComponent(hash.slice(1)));
  } catch {
    return null;
  }
}

document.addEventListener("click", (event) => {
  const link = event.target.closest?.('a[href^="#"]');
  if (
    !link ||
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    (link.target && link.target !== "_self") ||
    link.hasAttribute("download")
  ) {
    return;
  }

  const hash = link.getAttribute("href");
  const target = findAnchorTarget(hash);
  if (!target) return;

  event.preventDefault();
  const nextUrl = hash === "#" ? `${location.pathname}${location.search}` : hash;
  if (location.hash !== hash) history.pushState(null, "", nextUrl);
  target.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
});
