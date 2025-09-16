"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { updatePost } from "@/lib/posts";

interface EditPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  initialContent: string;
  onUpdate?: (newContent: string) => void;
}

export function EditPostDialog({
  open,
  onOpenChange,
  postId,
  initialContent,
  onUpdate,
}: EditPostDialogProps) {
  const [content, setContent] = useState(initialContent);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error("El contenido no puede estar vacío");
      return;
    }

    if (content.length > 500) {
      toast.error("El contenido no puede exceder 500 caracteres");
      return;
    }

    if (content.trim() === initialContent.trim()) {
      toast.info("No se han realizado cambios");
      onOpenChange(false);
      return;
    }

    setIsUpdating(true);
    try {
      const result = await updatePost(postId, content);
      
      if (result.success) {
        toast.success("Post actualizado correctamente");
        onUpdate?.(content);
        onOpenChange(false);
      } else {
        toast.error(result.error || "Error al actualizar el post");
      }
    } catch {
      toast.error("Error inesperado al actualizar el post");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setContent(initialContent);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border border-white/20 dark:border-gray-700/30 rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-gray-100">
            Editar post
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="¿Qué estás pensando?"
              className={`min-h-[120px] resize-none border-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm ring-1 ring-white/30 dark:ring-gray-700/30 rounded-xl focus-visible:ring-2 focus-visible:ring-pink-400/50 ${
                content.length > 500 ? "ring-red-400" : ""
              }`}
              disabled={isUpdating}
            />
            <div className="flex justify-between items-center text-sm">
              <span
                className={`${
                  content.length > 500
                    ? "text-red-600 dark:text-red-400"
                    : content.length > 450
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {content.length}/500
              </span>
              {content.trim() !== initialContent.trim() && (
                <span className="text-xs text-pink-600 dark:text-pink-400">
                  • Modificado
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              disabled={isUpdating}
              className="hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isUpdating || !content.trim() || content.length > 500}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
            >
              {isUpdating ? "Actualizando..." : "Actualizar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}