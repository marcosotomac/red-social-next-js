"use client";

import { useState, useEffect } from "react";
import { useConversations } from "@/hooks/useConversations";
import { Conversation, User } from "@/lib/chat";
import { ChatList } from "@/components/chat/ChatList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { UserSearch } from "@/components/chat/UserSearch";
import { Navigation } from "@/components/Navigation";
import { createClient } from "@/lib/supabase/client";
import { MessageCircle } from "lucide-react";

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const { conversations, loading, error, createConversation } =
    useConversations();

  const supabase = createClient();

  // Get current user ID
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });
  }, [supabase]);

  // Handle responsive design
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const handleNewChat = () => {
    setShowUserSearch(true);
  };

  const handleSelectUser = async (user: User) => {
    try {
      // Create or find existing conversation with this user
      const conversation = await createConversation([user.id]);
      if (conversation) {
        setSelectedConversation(conversation);
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">
              Error al cargar mensajes
            </h2>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="h-[calc(100vh-4rem)] flex">
        {/* Mobile layout */}
        {isMobile ? (
          <>
            {!selectedConversation ? (
              <div className="w-full">
                <ChatList
                  conversations={conversations}
                  selectedConversationId={selectedConversation?.id}
                  onSelectConversation={handleSelectConversation}
                  onNewChat={handleNewChat}
                  loading={loading}
                  currentUserId={currentUserId || undefined}
                />
              </div>
            ) : (
              <div className="w-full">
                <ChatWindow
                  conversation={selectedConversation}
                  onBack={handleBackToList}
                />
              </div>
            )}
          </>
        ) : (
          /* Desktop layout */
          <>
            {/* Sidebar */}
            <div className="w-80 border-r bg-card">
              <ChatList
                conversations={conversations}
                selectedConversationId={selectedConversation?.id}
                onSelectConversation={handleSelectConversation}
                onNewChat={handleNewChat}
                loading={loading}
                currentUserId={currentUserId || undefined}
              />
            </div>

            {/* Main chat area */}
            <div className="flex-1">
              {selectedConversation ? (
                <ChatWindow
                  conversation={selectedConversation}
                  className="h-full"
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
                  <h2 className="text-xl font-semibold mb-2">
                    Selecciona una conversación
                  </h2>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    Elige una conversación de la lista para comenzar a chatear,
                    o inicia una nueva conversación.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* User search modal */}
      <UserSearch
        open={showUserSearch}
        onOpenChange={setShowUserSearch}
        onSelectUser={handleSelectUser}
      />
    </div>
  );
}
