"use client";

import { useState, useEffect } from "react";

export interface TypingPlaceholderItem {
  text: string;
}

interface UseTypingPlaceholderProps {
  texts: TypingPlaceholderItem[];
  typeSpeed?: number;
  deleteSpeed?: number;
  pauseTime?: number;
}

export function useTypingPlaceholder({
  texts,
  typeSpeed = 100,
  deleteSpeed = 50,
  pauseTime = 2000,
}: UseTypingPlaceholderProps) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    if (texts.length === 0) return;

    const targetText = texts[currentTextIndex].text;

    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          // Typing
          if (currentText.length < targetText.length) {
            setCurrentText(targetText.slice(0, currentText.length + 1));
          } else {
            // Finished typing, wait then start deleting
            setTimeout(() => setIsDeleting(true), pauseTime);
          }
        } else {
          // Deleting
          if (currentText.length > 0) {
            setCurrentText(currentText.slice(0, -1));
          } else {
            // Finished deleting, move to next text
            setIsDeleting(false);
            setCurrentTextIndex((prev) => (prev + 1) % texts.length);
          }
        }
      },
      isDeleting ? deleteSpeed : typeSpeed
    );

    return () => clearTimeout(timeout);
  }, [
    currentText,
    isDeleting,
    currentTextIndex,
    texts,
    typeSpeed,
    deleteSpeed,
    pauseTime,
  ]);

  // Cursor blinking effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, []);

  const displayText = currentText + (showCursor ? "|" : "");

  return {
    displayText,
    currentText,
    isTyping:
      !isDeleting && currentText.length < texts[currentTextIndex]?.text.length,
    isDeleting,
    currentIndex: currentTextIndex,
  };
}
