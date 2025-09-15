"use client";

import { useState } from "react";
import { useUserSearch } from "@/hooks/useConversations";
import { User } from "@/lib/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Search, MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectUser: (user: User) => void;
}

export function UserSearch({
  open,
  onOpenChange,
  onSelectUser,
}: UserSearchProps) {
  const [query, setQuery] = useState("");
  const { users, loading, searchUsers, clearSearch } = useUserSearch();

  const handleSearch = (value: string) => {
    setQuery(value);
    if (value.trim().length >= 2) {
      searchUsers(value.trim());
    } else {
      clearSearch();
    }
  };

  const handleSelectUser = (user: User) => {
    onSelectUser(user);
    setQuery("");
    clearSearch();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva conversación</DialogTitle>
          <DialogDescription>
            Busca un usuario para comenzar una nueva conversación.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuarios..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-10"
              autoFocus
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
                onClick={() => handleSearch("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Search results */}
          <div className="min-h-[200px] max-h-[400px]">
            {query.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <Search className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Escribe al menos 2 caracteres para buscar usuarios
                </p>
              </div>
            ) : loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 animate-pulse"
                  >
                    <div className="w-10 h-10 bg-muted rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="w-3/4 h-4 bg-muted rounded" />
                      <div className="w-1/2 h-3 bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <MessageCircle className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No se encontraron usuarios con &quot;{query}&quot;
                </p>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="space-y-1">
                  {users.map((user) => (
                    <Button
                      key={user.id}
                      variant="ghost"
                      className={cn(
                        "w-full h-auto p-3 justify-start rounded-lg",
                        "hover:bg-muted/50 transition-colors"
                      )}
                      onClick={() => handleSelectUser(user)}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback>
                            {user.full_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 text-left min-w-0">
                          <h4 className="font-medium truncate">
                            {user.full_name}
                          </h4>
                          <p className="text-sm text-muted-foreground truncate">
                            @{user.username}
                          </p>
                        </div>

                        <MessageCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
