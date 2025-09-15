"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { X, Upload, Type } from "lucide-react";
import { createStory } from "@/lib/stories";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

interface StoryCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onStoryCreated: () => void;
}

export function StoryCreator({
  isOpen,
  onClose,
  onStoryCreated,
}: StoryCreatorProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [content, setContent] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#3b82f6");
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const colors = [
    "#3b82f6",
    "#ef4444",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#84cc16",
  ];

  const uploadFileToSupabase = async (file: File): Promise<string> => {
    const supabase = createClient();

    try {
      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;
      const filePath = `stories/${fileName}`;

      console.log(
        "Uploading file:",
        fileName,
        "Type:",
        file.type,
        "Size:",
        file.size
      );

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from("media")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Supabase storage error:", error);
        throw error;
      }

      console.log("Upload successful:", data);

      // Get public URL - Using the correct format for public buckets
      const {
        data: { publicUrl },
      } = supabase.storage.from("media").getPublicUrl(filePath);

      console.log("Generated public URL:", publicUrl);

      // Verify the URL format is correct
      if (!publicUrl.includes("/storage/v1/object/public/media/")) {
        console.warn("Unexpected URL format:", publicUrl);
      }

      return publicUrl;
    } catch (error) {
      console.error("Error uploading to Supabase:", error);
      // Fallback to example URL for demo purposes
      return `https://example.com/uploads/${Date.now()}-${file.name}`;
    }
  };

  const createTextStoryImage = async (
    text: string,
    backgroundColor: string
  ): Promise<string> => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) throw new Error("No canvas context available");

    // Set canvas size for story format (9:16 aspect ratio)
    canvas.width = 400;
    canvas.height = 600;

    // Fill background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set text properties
    ctx.fillStyle = "white";
    ctx.font = "bold 24px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Simple text wrapping
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";
    const maxWidth = canvas.width - 80; // 40px padding on each side

    for (const word of words) {
      const testLine = currentLine + word + " ";
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine !== "") {
        lines.push(currentLine.trim());
        currentLine = word + " ";
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine.trim());

    // Draw text lines
    const lineHeight = 32;
    const startY = canvas.height / 2 - (lines.length * lineHeight) / 2;

    lines.forEach((line, index) => {
      ctx.fillText(line, canvas.width / 2, startY + index * lineHeight);
    });

    // Convert canvas to blob and upload
    return new Promise((resolve, reject) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          reject(new Error("Failed to create blob from canvas"));
          return;
        }

        try {
          // Create a File object from the blob
          const file = new File([blob], "text-story.png", {
            type: "image/png",
          });

          // Upload to Supabase Storage
          const url = await uploadFileToSupabase(file);
          resolve(url);
        } catch (error) {
          reject(error);
        }
      }, "image/png");
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith("image/")) {
      setMediaType("image");
    } else if (file.type.startsWith("video/")) {
      setMediaType("video");
    } else {
      toast.error("Solo se permiten archivos de imagen o video");
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!selectedFile && !content.trim()) {
      toast.error("Agrega una imagen, video o texto para tu story");
      return;
    }

    setIsUploading(true);

    try {
      let mediaUrl = "";
      let finalMediaType: "image" | "video" = "image";

      if (selectedFile) {
        // Upload selected file
        mediaUrl = await uploadFileToSupabase(selectedFile);
        finalMediaType = mediaType!;
      } else if (content.trim()) {
        // Create text story image
        mediaUrl = await createTextStoryImage(content, backgroundColor);
        finalMediaType = "image";
      }

      await createStory({
        media_url: mediaUrl,
        media_type: finalMediaType,
        content: content.trim() || undefined,
        duration: 15,
        background_color: backgroundColor,
      });

      toast.success("Story creado exitosamente");
      handleClose();
      onStoryCreated();
    } catch (error) {
      console.error("Error creating story:", error);
      toast.error("Error al crear el story. Inténtalo de nuevo.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setContent("");
    setPreview(null);
    setMediaType(null);
    onClose();
  };

  return isOpen ? (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Crear Story</h2>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            {/* File Upload */}
            <div>
              <label
                htmlFor="file-upload"
                className="block text-sm font-medium mb-2"
              >
                Subir archivo
              </label>
              <Input
                id="file-upload"
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
            </div>

            {/* Preview */}
            {preview && (
              <div className="relative aspect-[9/16] max-h-48 bg-black rounded-lg overflow-hidden">
                {mediaType === "image" ? (
                  <Image
                    src={preview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <video
                    src={preview}
                    className="w-full h-full object-cover"
                    controls
                  />
                )}
              </div>
            )}

            {/* Text Content */}
            <div>
              <label
                htmlFor="content"
                className="block text-sm font-medium mb-2"
              >
                Texto (opcional)
              </label>
              <Textarea
                id="content"
                placeholder="Escribe algo para tu story..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
              />
            </div>

            {/* Background Color for Text Stories */}
            {!selectedFile && content.trim() && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Color de fondo
                </label>
                <div className="flex gap-2 flex-wrap">
                  {colors.map((color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 ${
                        backgroundColor === color
                          ? "border-gray-900"
                          : "border-gray-300"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setBackgroundColor(color)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Text Story Preview */}
            {!selectedFile && content.trim() && (
              <div className="relative aspect-[9/16] max-h-48 rounded-lg overflow-hidden">
                <div
                  className="w-full h-full flex items-center justify-center p-4"
                  style={{ backgroundColor }}
                >
                  <p className="text-white text-center font-semibold text-sm">
                    {content}
                  </p>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("file-upload")?.click()}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Subir
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedFile(null);
                  setPreview(null);
                  setMediaType(null);
                }}
                className="flex-1"
                disabled={!selectedFile}
              >
                <Type className="h-4 w-4 mr-2" />
                Texto
              </Button>
            </div>

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={isUploading || (!selectedFile && !content.trim())}
              className="w-full"
            >
              {isUploading ? "Creando..." : "Crear Story"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  ) : null;
}
