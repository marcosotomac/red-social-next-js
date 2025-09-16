"use client";

import { useState, useEffect } from "react";
import { Users, Smartphone, Flame, MessageCircle, Star } from "lucide-react";

interface TypingTextItem {
  text: string;
  icon: string;
}

interface TypingTextProps {
  texts: TypingTextItem[];
  typeSpeed?: number;
  deleteSpeed?: number;
  pauseTime?: number;
  className?: string;
}

const iconMap = {
  Users,
  Smartphone,
  Flame,
  MessageCircle,
  Star,
};

export function TypingText({
  texts,
  typeSpeed = 100,
  deleteSpeed = 50,
  pauseTime = 2000,
  className = "",
}: TypingTextProps) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const targetText = texts[currentTextIndex].text;

    const timeout = setTimeout(() => {
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
    }, isDeleting ? deleteSpeed : typeSpeed);

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, currentTextIndex, texts, typeSpeed, deleteSpeed, pauseTime]);

  // Cursor blinking effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, []);

  const CurrentIcon = iconMap[texts[currentTextIndex]?.icon as keyof typeof iconMap];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {CurrentIcon && (
        <CurrentIcon className="w-6 h-6 text-pink-600 flex-shrink-0" />
      )}
      <span>
        {currentText}
        <span className={`${showCursor ? "opacity-100" : "opacity-0"} transition-opacity duration-100`}>
          |
        </span>
      </span>
    </div>
  );
}