"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface User {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
}

export default function NotificationsPage() {
  const [user, setUser] = useState<User | null>(null);
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
    };

    getUser();
  }, [router, supabase]);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <Navigation user={user} />

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="text-2xl bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-12 space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full mx-auto flex items-center justify-center">
              <span className="text-2xl">🔔</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800">
              All caught up!
            </h3>
            <p className="text-gray-600">
              You&apos;ll see notifications here when people interact with your
              posts or follow you.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
