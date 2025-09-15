"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, UserPlus, User, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface User {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
}

interface Notification {
  id: string;
  type: "like" | "comment" | "follow";
  created_at: string;
  read: boolean;
  actor: {
    username: string;
    full_name: string;
    avatar_url?: string;
  };
  post?: {
    id: string;
    content: string;
  };
}

export default function NotificationsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (profile) {
        setUser({
          id: profile.id,
          username: profile.username,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
        });
      }
      setLoading(false);
    };

    getUser();
  }, [router, supabase]);

  useEffect(() => {
    const loadNotifications = async () => {
      if (!user) return;

      try {
        // Create mock notifications for demo purposes
        const mockNotifications: Notification[] = [
          {
            id: "1",
            type: "like",
            created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
            read: false,
            actor: {
              username: "alice_wonder",
              full_name: "Alice Wonderland",
              avatar_url: undefined,
            },
            post: {
              id: "post1",
              content:
                "Just shared my thoughts on mindful living and how it changed my perspective...",
            },
          },
          {
            id: "2",
            type: "follow",
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
            read: false,
            actor: {
              username: "bob_creative",
              full_name: "Bob Creative",
              avatar_url: undefined,
            },
          },
          {
            id: "3",
            type: "comment",
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
            read: true,
            actor: {
              username: "emma_artist",
              full_name: "Emma Artist",
              avatar_url: undefined,
            },
            post: {
              id: "post2",
              content:
                "Beautiful sunset from my balcony today. Nature never fails to inspire!",
            },
          },
        ];

        setNotifications(mockNotifications);
      } catch (error) {
        console.error("Error loading notifications:", error);
      }
    };

    if (user) {
      loadNotifications();
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
        <Navigation user={undefined} />
        <div className="flex items-center justify-center py-12">
          <span className="text-gray-600">Loading notifications...</span>
        </div>
      </div>
    );
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="h-4 w-4 text-pink-500" />;
      case "comment":
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case "follow":
        return <UserPlus className="h-4 w-4 text-green-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationText = (notification: Notification) => {
    const actorName =
      notification.actor.full_name || notification.actor.username;

    switch (notification.type) {
      case "like":
        return `${actorName} liked your post`;
      case "comment":
        return `${actorName} commented on your post`;
      case "follow":
        return `${actorName} started following you`;
      default:
        return "New notification";
    }
  };

  const getPostPreview = (content: string) => {
    if (content.length <= 50) return content;
    return content.substring(0, 50) + "...";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <Navigation user={user} />

      <main className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Notifications
            </h1>
            <p className="text-gray-600">Stay updated with your community</p>
          </div>

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-lg rounded-2xl">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Clock className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  All caught up!
                </h3>
                <p className="text-gray-600">
                  No new notifications right now. Check back later for updates
                  from your community.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => {
                const initials =
                  notification.actor.full_name
                    ?.split(" ")
                    .map((name) => name[0])
                    .join("")
                    .toUpperCase() ||
                  notification.actor.username[0].toUpperCase();

                return (
                  <Card
                    key={notification.id}
                    className="backdrop-blur-sm bg-white/80 border-0 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        {/* Avatar */}
                        <Link href={`/profile/${notification.actor.username}`}>
                          <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                            <AvatarImage src={notification.actor.avatar_url} />
                            <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white text-sm">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                        </Link>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            {getNotificationIcon(notification.type)}
                            <p className="text-sm text-gray-800 font-medium">
                              {getNotificationText(notification)}
                            </p>
                            {!notification.read && (
                              <Badge className="bg-pink-500 text-white text-xs px-2 py-0.5">
                                New
                              </Badge>
                            )}
                          </div>

                          {notification.post && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                              <p className="text-sm text-gray-600 italic">
                                &ldquo;
                                {getPostPreview(notification.post.content)}
                                &rdquo;
                              </p>
                            </div>
                          )}

                          <p className="text-xs text-gray-500 mt-2">
                            {formatDistanceToNow(
                              new Date(notification.created_at),
                              {
                                addSuffix: true,
                              }
                            )}
                          </p>
                        </div>

                        {/* Action Button */}
                        {notification.post ? (
                          <Link href="/feed">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                            >
                              View Post
                            </Button>
                          </Link>
                        ) : (
                          <Link
                            href={`/profile/${notification.actor.username}`}
                          >
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                            >
                              View Profile
                            </Button>
                          </Link>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
