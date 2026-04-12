import { useEffect } from "react";

import "./advanced-cursor.css";

export function 高级高标() {
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    if (window.matchMedia("(hover: none) and (pointer: coarse)").matches) return undefined;

    const root = document.documentElement;
    root.classList.add("cursor-effect-enabled");

    const cursor = document.createElement("div");
    cursor.className = "custom-cursor custom-cursor--hidden";
    document.body.appendChild(cursor);

    let currentX = -100;
    let currentY = -100;
    let targetX = -100;
    let targetY = -100;
    let cursorRaf = 0;
    const contractSelector =
      'a, button, [role="button"], input[type="submit"], input[type="button"], .nav__toggle, [data-cursor-hover]:not([data-cursor-hover="extend"])';
    const extendSelector = '[data-cursor-hover="extend"], h1, h2, h3';

    const syncCursorVariant = (target) => {
      if (!(target instanceof Element)) {
        cursor.classList.remove("custom-cursor--contract", "custom-cursor--extend");
        return;
      }

      if (target.closest(contractSelector)) {
        cursor.classList.add("custom-cursor--contract");
        cursor.classList.remove("custom-cursor--extend");
        return;
      }

      if (target.closest(extendSelector)) {
        cursor.classList.add("custom-cursor--extend");
        cursor.classList.remove("custom-cursor--contract");
        return;
      }

      cursor.classList.remove("custom-cursor--contract", "custom-cursor--extend");
    };

    const onMouseMove = (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
      cursor.classList.remove("custom-cursor--hidden");
      syncCursorVariant(event.target);
    };

    const onPointerMove = (event) => {
      if (event.pointerType && event.pointerType !== "mouse") return;
      targetX = event.clientX;
      targetY = event.clientY;
      syncCursorVariant(event.target);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("pointermove", onPointerMove);

    const animateCursor = () => {
      currentX += (targetX - currentX) * 0.16;
      currentY += (targetY - currentY) * 0.16;
      cursor.style.transform = `translate(${currentX}px, ${currentY}px) translate(-50%, -50%)`;
      cursorRaf = window.requestAnimationFrame(animateCursor);
    };

    animateCursor();

    return () => {
      window.cancelAnimationFrame(cursorRaf);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("pointermove", onPointerMove);
      cursor.remove();
      root.classList.remove("cursor-effect-enabled");
    };
  }, []);

  return null;
}

export default 高级高标;
