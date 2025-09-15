"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ImageIcon, X, Upload, Loader2 } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
  bucket: "avatars" | "post-images";
  currentImage?: string;
  onUploadComplete: (url: string) => void;
  onRemove?: () => void;
  className?: string;
  accept?: string;
  maxSize?: number; // in MB
  disabled?: boolean;
}

export function ImageUpload({
  bucket,
  currentImage,
  onUploadComplete,
  onRemove,
  className = "",
  accept = "image/*",
  maxSize = 5,
  disabled = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const uploadFile = async (file: File) => {
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size must be less than ${maxSize}MB`);
      return;
    }

    setUploading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      setPreview(urlData.publicUrl);
      onUploadComplete(urlData.publicUrl);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error uploading file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }
    uploadFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleRemove = () => {
    setPreview(null);
    onRemove?.();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || uploading}
      />

      {preview ? (
        <Card className="relative group overflow-hidden">
          <Image
            src={preview}
            alt="Upload preview"
            width={400}
            height={300}
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Change
            </Button>
            {onRemove && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRemove}
                disabled={disabled || uploading}
              >
                <X className="h-4 w-4 mr-2" />
                Remove
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <Card
          className={`border-2 border-dashed transition-colors cursor-pointer ${
            dragOver
              ? "border-pink-400 bg-pink-50"
              : "border-gray-300 hover:border-pink-300 hover:bg-pink-50"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={() =>
            !disabled && !uploading && fileInputRef.current?.click()
          }
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            {uploading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-pink-600 mb-3" />
                <p className="text-sm text-gray-600">Uploading...</p>
              </>
            ) : (
              <>
                <ImageIcon className="h-8 w-8 text-gray-400 mb-3" />
                <p className="text-sm font-medium text-gray-900 mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF up to {maxSize}MB
                </p>
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
