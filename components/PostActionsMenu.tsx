"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Edit3, Trash2, MoreHorizontal, Flag } from "lucide-react";
import { toast } from "sonner";
import { deletePost } from "@/lib/posts";

interface PostActionsMenuProps {
  postId: string;
  isOwner: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function PostActionsMenu({
  postId,
  isOwner,
  onEdit,
  onDelete,
}: PostActionsMenuProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deletePost(postId);

      if (result.success) {
        toast.success("Post eliminado correctamente");
        onDelete?.();
      } else {
        toast.error(result.error || "Error al eliminar el post");
      }
    } catch {
      toast.error("Error inesperado al eliminar el post");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleReport = () => {
    toast.info("Función de reportar en desarrollo");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-full transition-all duration-200"
          >
            <MoreHorizontal className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-48 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border border-white/20 dark:border-gray-700/30 shadow-xl rounded-xl"
        >
          {isOwner ? (
            <>
              <DropdownMenuItem
                onClick={onEdit}
                className="flex items-center gap-2 cursor-pointer hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-lg"
              >
                <Edit3 className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                <span className="text-gray-900 dark:text-gray-100">Editar</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-200/50 dark:bg-gray-700/50" />
              <DropdownMenuItem
                onClick={() => setDeleteDialogOpen(true)}
                className="flex items-center gap-2 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              >
                <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-red-600 dark:text-red-400">Eliminar</span>
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem
              onClick={handleReport}
              className="flex items-center gap-2 cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg"
            >
              <Flag className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <span className="text-gray-900 dark:text-gray-100">Reportar</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border border-white/20 dark:border-gray-700/30 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-gray-100">
              ¿Eliminar post?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
              Esta acción no se puede deshacer. El post y todos sus comentarios
              serán eliminados permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="hover:bg-gray-50 dark:hover:bg-gray-800"
              disabled={isDeleting}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
