"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ImageUpload } from "@/components/ImageUpload";
import {
  ImageIcon,
  Smile,
  MapPin,
  Calendar as CalendarIcon,
  X,
  Loader2,
} from "lucide-react";
import { useTypingPlaceholder } from "@/hooks/useTypingPlaceholder";
import { useGeolocation, type LocationData } from "@/hooks/useGeolocation";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface CreatePostProps {
  user: {
    username: string;
    full_name: string;
    avatar_url?: string;
  };
  onPost?: (
    content: string,
    imageUrl?: string,
    location?: LocationData
  ) => void;
}

export function CreatePost({ user, onPost }: CreatePostProps) {
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Hook para geolocalización
  const {
    location,
    isLoading: isLoadingLocation,
    error: locationError,
    getCurrentLocation,
    clearLocation,
  } = useGeolocation();

  // Textos con emojis masculinos para el placeholder
  const placeholderTexts = [
    { text: "¿Qué aventura has vivido hoy? 🚀" },
    { text: "Comparte tu momento épico 💪" },
    { text: "¿Qué te motiva en este momento? 🔥" },
    { text: "Cuéntanos tu historia bro 👨‍💻" },
    { text: "¿Qué logro quieres celebrar? 🏆" },
    { text: "Inspira a la comunidad hermano 🌟" },
    { text: "¿Qué proyecto estás construyendo? 🛠️" },
    { text: "Comparte tu sabiduría 🧠" },
  ];

  const { displayText } = useTypingPlaceholder({
    texts: placeholderTexts,
    typeSpeed: 80,
    deleteSpeed: 40,
    pauseTime: 3000,
  });

  // Lista de emojis populares
  const popularEmojis = [
    "😀",
    "😂",
    "🥰",
    "😍",
    "🤩",
    "😎",
    "🔥",
    "💪",
    "👍",
    "👏",
    "🙌",
    "💯",
    "🚀",
    "⭐",
    "🎉",
    "🏆",
    "❤️",
    "💙",
    "💚",
    "💛",
    "🧡",
    "💜",
    "🖤",
    "🤍",
    "😊",
    "😉",
    "😋",
    "🤔",
    "🙃",
    "😌",
    "✨",
    "🌟",
  ];

  const insertEmoji = (emoji: string) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.slice(0, start) + emoji + content.slice(end);
      setContent(newContent);

      // Restaurar la posición del cursor después del emoji
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    }
    setShowEmojiPicker(false);
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsPosting(true);
    try {
      // Formatear el contenido con la fecha si está seleccionada
      let finalContent = content;
      if (selectedDate) {
        const formattedDate = format(selectedDate, "PPP", { locale: es });
        finalContent += `\n\n📅 Evento: ${formattedDate}`;
      }

      await onPost?.(
        finalContent,
        imageUrl || undefined,
        location || undefined
      );
      setContent("");
      setImageUrl(null);
      setShowImageUpload(false);
      setSelectedDate(undefined);
      clearLocation();
    } catch (error) {
      console.error("Error posting:", error);
    } finally {
      setIsPosting(false);
    }
  };

  const initials =
    user.full_name
      ?.split(" ")
      .map((name) => name[0])
      .join("")
      .toUpperCase() || user.username[0].toUpperCase();

  return (
    <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-0 shadow-lg rounded-2xl overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10 ring-2 ring-pink-100">
            <AvatarImage src={user.avatar_url} />
            <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100 leading-none">
              {user.full_name || user.username}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Share what&apos;s on your mind
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Textarea
          ref={textareaRef}
          placeholder={displayText}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-24 border-0 bg-gray-50 dark:bg-gray-700 resize-none focus:bg-white dark:focus:bg-gray-600 transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
          maxLength={500}
        />

        {/* Image Upload Section */}
        {showImageUpload && (
          <ImageUpload
            bucket="post-images"
            currentImage={imageUrl || undefined}
            onUploadComplete={(url) => setImageUrl(url)}
            onRemove={() => setImageUrl(null)}
            className="mb-4"
          />
        )}

        {/* Location Display Section */}
        {location && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Ubicación agregada
                  </p>
                  {location.address && (
                    <p className="text-xs text-green-600 dark:text-green-400 truncate max-w-xs">
                      {location.address}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearLocation}
                className="h-6 w-6 p-0 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Selected Date Display Section */}
        {selectedDate && (
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <div>
                  <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                    Evento programado
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400">
                    {format(selectedDate, "PPP", { locale: es })}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate(undefined)}
                className="h-6 w-6 p-0 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Location Error Display */}
        {locationError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-800 dark:text-red-200">
                {locationError}
              </p>
            </div>
          </div>
        )}

        {/* Actions and Post Button */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4 text-gray-500 dark:text-gray-400">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowImageUpload(!showImageUpload)}
              className={`h-8 w-8 p-0 transition-colors ${
                showImageUpload
                  ? "bg-pink-50 text-pink-600"
                  : "hover:bg-pink-50 hover:text-pink-600"
              }`}
            >
              {showImageUpload ? (
                <X className="h-4 w-4" />
              ) : (
                <ImageIcon className="h-4 w-4" />
              )}
            </Button>

            {/* Emoji Picker */}
            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 w-8 p-0 transition-colors ${
                    showEmojiPicker
                      ? "bg-yellow-50 text-yellow-600"
                      : "hover:bg-yellow-50 hover:text-yellow-600"
                  }`}
                >
                  <Smile className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-3" align="start">
                <div className="grid grid-cols-8 gap-1">
                  {popularEmojis.map((emoji, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => insertEmoji(emoji)}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              size="sm"
              onClick={location ? clearLocation : getCurrentLocation}
              disabled={isLoadingLocation}
              className={`h-8 w-8 p-0 transition-colors ${
                location
                  ? "bg-green-50 text-green-600"
                  : isLoadingLocation
                  ? "bg-gray-50 text-gray-400"
                  : "hover:bg-green-50 hover:text-green-600"
              }`}
            >
              {isLoadingLocation ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : location ? (
                <X className="h-4 w-4" />
              ) : (
                <MapPin className="h-4 w-4" />
              )}
            </Button>

            {/* Calendar Picker */}
            <Popover open={showCalendar} onOpenChange={setShowCalendar}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 w-8 p-0 transition-colors ${
                    selectedDate
                      ? "bg-purple-50 text-purple-600"
                      : showCalendar
                      ? "bg-purple-50 text-purple-600"
                      : "hover:bg-purple-50 hover:text-purple-600"
                  }`}
                >
                  <CalendarIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setShowCalendar(false);
                  }}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || isPosting}
            size="sm"
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg transition-all duration-200 transform hover:scale-[1.02] disabled:transform-none disabled:opacity-50"
          >
            {isPosting ? "Sharing..." : "Share"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
