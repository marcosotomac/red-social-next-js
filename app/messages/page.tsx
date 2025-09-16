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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const { conversations, loading, error, createConversation } =
    useConversations();

  const supabase = createClient();

  // Get current user ID and profile
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        setCurrentUserId(authUser.id);

        // Get profile data
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();

        if (profile) {
          setCurrentUser({
            id: profile.id,
            username: profile.username,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
          });
        }
      }
    };

    getUser();
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
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Navigation user={currentUser || undefined} />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20 rounded-full mx-auto flex items-center justify-center">
              <MessageCircle className="h-8 w-8 text-pink-600 dark:text-pink-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              Error al cargar mensajes
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden">
      <Navigation user={currentUser || undefined} />

      <div className="h-[calc(100vh-4rem)] container mx-auto px-4 py-2 max-w-7xl flex flex-col">
        <div className="backdrop-blur-sm bg-white/60 dark:bg-gray-900/60 border border-white/20 dark:border-gray-700/30 rounded-3xl shadow-xl flex-1 overflow-hidden flex flex-col">
          {/* Mobile layout */}
          {isMobile ? (
            <div className="flex flex-col h-full overflow-hidden">
              {!selectedConversation ? (
                <ChatList
                  conversations={conversations}
                  selectedConversationId={
                    (selectedConversation as Conversation | null)?.id
                  }
                  onSelectConversation={handleSelectConversation}
                  onNewChat={handleNewChat}
                  loading={loading}
                  currentUserId={currentUserId || undefined}
                />
              ) : (
                <ChatWindow
                  conversation={selectedConversation}
                  onBack={handleBackToList}
                  className="flex-1"
                />
              )}
            </div>
          ) : (
            /* Desktop layout */
            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar */}
              <div className="w-80 border-r border-white/20 dark:border-gray-700/30 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm flex-shrink-0">
                <ChatList
                  conversations={conversations}
                  selectedConversationId={
                    (selectedConversation as Conversation | null)?.id
                  }
                  onSelectConversation={handleSelectConversation}
                  onNewChat={handleNewChat}
                  loading={loading}
                  currentUserId={currentUserId || undefined}
                />
              </div>

              {/* Main chat area */}
              <div className="flex-1 bg-white/20 dark:bg-gray-900/20 backdrop-blur-sm">
                {selectedConversation ? (
                  <ChatWindow
                    conversation={selectedConversation}
                    className="h-full"
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20 rounded-full mx-auto flex items-center justify-center shadow-lg">
                      <MessageCircle className="h-12 w-12 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div className="space-y-3">
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                        Selecciona una conversación
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 max-w-md leading-relaxed">
                        Elige una conversación de la lista para comenzar a
                        chatear, o inicia una nueva conversación.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
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
