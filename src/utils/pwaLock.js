// src/utils/pwaLock.js
/**
 * Detects if the app is running as an installed PWA (standalone / fullscreen)
 * or via testing param (?pwa=true).
 */
export function isPWAMode() {
  if (typeof window === "undefined") return false;

  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    window.navigator.standalone === true ||
    document.referrer.includes("android-app://") ||
    new URLSearchParams(window.location.search).get("pwa") === "true";

  return Boolean(isStandalone);
}

/**
 * Disables zoom and rubber-band / page bouncing in PWA standalone mode only.
 * Normal browser sessions are completely unaffected.
 */
export function initPWALock() {
  if (typeof window === "undefined") return;

  const applyLock = () => {
    if (!isPWAMode()) return;

    // 1. Mark DOM so CSS standalone rules activate
    document.documentElement.classList.add("pwa-mode", "standalone");
    document.body.classList.add("pwa-mode", "standalone");

    // 2. Lock viewport meta tag to disable pinch zoom
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      viewportMeta = document.createElement("meta");
      viewportMeta.name = "viewport";
      document.head.appendChild(viewportMeta);
    }
    viewportMeta.setAttribute(
      "content",
      "width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover"
    );

    // 3. Prevent iOS Safari pinch-to-zoom gesture events
    const preventGesture = (e) => {
      e.preventDefault();
    };
    document.addEventListener("gesturestart", preventGesture, { passive: false });
    document.addEventListener("gesturechange", preventGesture, { passive: false });
    document.addEventListener("gestureend", preventGesture, { passive: false });

    // 4. Prevent multi-touch pinch zoom (two or more fingers)
    document.addEventListener(
      "touchstart",
      (e) => {
        if (e.touches.length > 1) {
          e.preventDefault();
        }
      },
      { passive: false }
    );

    // 5. Prevent document / window level rubber-band scroll and bounce
    let startX = 0;
    let startY = 0;

    document.addEventListener(
      "touchstart",
      (e) => {
        if (e.touches.length === 1) {
          startX = e.touches[0].clientX;
          startY = e.touches[0].clientY;
        }
      },
      { passive: true }
    );

    document.addEventListener(
      "touchmove",
      (e) => {
        // Multi-touch always blocked
        if (e.touches.length > 1) {
          e.preventDefault();
          return;
        }

        let target = e.target;
        let scrollableY = null;
        let scrollableX = null;

        // Traverse up to find any scrollable container
        while (target && target !== document.body && target !== document.documentElement) {
          const style = window.getComputedStyle(target);
          const canY =
            (style.overflowY === "auto" || style.overflowY === "scroll") &&
            target.scrollHeight > target.clientHeight;
          const canX =
            (style.overflowX === "auto" || style.overflowX === "scroll") &&
            target.scrollWidth > target.clientWidth;

          if (!scrollableY && canY) scrollableY = target;
          if (!scrollableX && canX) scrollableX = target;
          if (scrollableY && scrollableX) break;

          target = target.parentElement;
        }

        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const deltaX = Math.abs(currentX - startX);
        const deltaY = Math.abs(currentY - startY);

        // Horizontal swipes: allow if horizontal container or category swipe
        if (deltaX > deltaY) {
          return;
        }

        const isMovingDown = currentY > startY;
        const isMovingUp = currentY < startY;

        // Case A: Inside an inner vertically scrollable element (e.g. product list, cart, modal)
        if (scrollableY) {
          if (isMovingDown && scrollableY.scrollTop <= 0) {
            e.preventDefault();
          } else if (
            isMovingUp &&
            scrollableY.scrollTop + scrollableY.clientHeight >= scrollableY.scrollHeight - 1
          ) {
            e.preventDefault();
          }
          return;
        }

        // Case B: Document-level scrolling (e.g. SettingsPage, OrdersPage, etc.)
        const docHeight = Math.max(
          document.documentElement.scrollHeight,
          document.body.scrollHeight
        );
        const winHeight = window.innerHeight;
        const isDocScrollable = docHeight > winHeight + 10;

        if (isDocScrollable) {
          const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
          if (isMovingDown && scrollY <= 0) {
            e.preventDefault();
          } else if (isMovingUp && scrollY + winHeight >= docHeight - 1) {
            e.preventDefault();
          }
          return;
        }

        // Case C: Page fits entirely in window -> lock completely (zero bounce/drag)
        e.preventDefault();
      },
      { passive: false }
    );
  };

  applyLock();

  // Also listen for display-mode standalone activation
  if (window.matchMedia) {
    const mql = window.matchMedia("(display-mode: standalone)");
    if (mql.addEventListener) {
      mql.addEventListener("change", (e) => {
        if (e.matches) applyLock();
      });
    }
  }
}
