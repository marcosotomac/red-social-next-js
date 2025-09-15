"use client";

import { useEffect } from "react";

export function useImageModal(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return;

    let isClosingAllowed = false;
    const allowCloseTimer = setTimeout(() => {
      isClosingAllowed = true;
    }, 600); // Match the animation duration

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isClosingAllowed) {
        onClose();
      }
    };

    const preventScroll = (e: TouchEvent) => {
      e.preventDefault();
    };

    // Store scroll position and fix body
    const scrollY = window.scrollY;
    document.body.setAttribute("data-scroll-y", scrollY.toString());
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    // Prevent scrolling on touch devices
    document.addEventListener("touchmove", preventScroll, { passive: false });
    document.addEventListener("keydown", handleKeydown);

    return () => {
      clearTimeout(allowCloseTimer);

      // Restore scroll position
      const savedScrollY = document.body.getAttribute("data-scroll-y");
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.removeAttribute("data-scroll-y");

      if (savedScrollY) {
        window.scrollTo(0, parseInt(savedScrollY, 10));
      }

      document.removeEventListener("touchmove", preventScroll);
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [isOpen, onClose]);
}
