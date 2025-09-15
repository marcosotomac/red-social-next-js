"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Navigation } from "@/components/Navigation";
import { ImageUpload } from "@/components/ImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Save, User, Shield, Bell, Palette } from "lucide-react";

interface User {
  id: string;
  username: string;
  full_name: string;
  bio?: string;
  website?: string;
  avatar_url?: string;
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    bio: "",
    website: "",
    avatar_url: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        const userData = {
          id: profile.id,
          username: profile.username,
          full_name: profile.full_name,
          bio: profile.bio,
          website: profile.website,
          avatar_url: profile.avatar_url,
        };
        setUser(userData);
        setFormData({
          full_name: profile.full_name || "",
          bio: profile.bio || "",
          website: profile.website || "",
          avatar_url: profile.avatar_url || "",
        });
      }
      setLoading(false);
    };

    getUser();
  }, [router, supabase]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          bio: formData.bio,
          website: formData.website,
          avatar_url: formData.avatar_url,
        })
        .eq("id", user.id);

      if (error) throw error;

      // Update local state
      setUser({
        ...user,
        full_name: formData.full_name,
        bio: formData.bio,
        website: formData.website,
        avatar_url: formData.avatar_url,
      });

      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error updating profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = (url: string) => {
    setFormData((prev) => ({ ...prev, avatar_url: url }));
  };

  const handleAvatarRemove = () => {
    setFormData((prev) => ({ ...prev, avatar_url: "" }));
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
        <Navigation user={undefined} />
        <div className="flex items-center justify-center py-12">
          <span className="text-gray-600">Loading settings...</span>
        </div>
      </div>
    );
  }

  const initials =
    user.full_name
      ?.split(" ")
      .map((name) => name[0])
      .join("")
      .toUpperCase() || user.username[0].toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <Navigation user={user} />

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-gray-600">Manage your account and preferences</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Settings Navigation */}
            <div className="md:col-span-1">
              <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-lg rounded-2xl">
                <CardContent className="p-6">
                  <nav className="space-y-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start bg-pink-50 text-pink-700"
                    >
                      <User className="h-4 w-4 mr-3" />
                      Profile
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-gray-600"
                      disabled
                    >
                      <Shield className="h-4 w-4 mr-3" />
                      Privacy
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-gray-600"
                      disabled
                    >
                      <Bell className="h-4 w-4 mr-3" />
                      Notifications
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-gray-600"
                      disabled
                    >
                      <Palette className="h-4 w-4 mr-3" />
                      Appearance
                    </Button>
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* Profile Settings */}
            <div className="md:col-span-2 space-y-6">
              <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-lg rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Profile Information</span>
                  </CardTitle>
                  <CardDescription>
                    Update your profile details and how others see you on
                    Softsocial
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar Section */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-gray-700">
                      Profile Picture
                    </Label>
                    <div className="flex items-start space-x-6">
                      <Avatar className="h-20 w-20 ring-4 ring-pink-100">
                        <AvatarImage src={formData.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white font-bold text-xl">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <ImageUpload
                          bucket="avatars"
                          currentImage={formData.avatar_url}
                          onUploadComplete={handleAvatarUpload}
                          onRemove={handleAvatarRemove}
                          className="max-w-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Form Fields */}
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={user.username}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500">
                        Username cannot be changed
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            full_name: e.target.value,
                          }))
                        }
                        placeholder="Your full name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            bio: e.target.value,
                          }))
                        }
                        placeholder="Tell us a bit about yourself..."
                        className="min-h-20"
                        maxLength={160}
                      />
                      <p className="text-xs text-gray-500">
                        {160 - formData.bio.length} characters remaining
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            website: e.target.value,
                          }))
                        }
                        placeholder="https://your-website.com"
                        type="url"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
