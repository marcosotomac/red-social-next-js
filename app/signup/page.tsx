"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      // Redirect to login with success message
      router.push("/login?message=Check your email for confirmation");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo/Brand */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-lg overflow-hidden">
            <Image
              src="/icon.png"
              alt="QuéFue Logo"
              width={64}
              height={64}
              className="w-full h-full object-cover rounded-2xl"
            />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            QuéFue
          </h1>
          <p className="text-gray-600 text-sm">
            Connect with friends in a gentle way
          </p>
        </div>

        <Card className="backdrop-blur-sm bg-white/70 border-0 shadow-2xl">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl text-center text-gray-800">
              Create account
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              Join our gentle social community
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="h-11 border-gray-200 focus:border-pink-300 focus:ring-pink-200 bg-white/50"
                />
                <Input
                  type="text"
                  placeholder="Full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="h-11 border-gray-200 focus:border-pink-300 focus:ring-pink-200 bg-white/50"
                />
              </div>

              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 border-gray-200 focus:border-pink-300 focus:ring-pink-200 bg-white/50"
              />

              <Input
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-11 border-gray-200 focus:border-pink-300 focus:ring-pink-200 bg-white/50"
              />

              {error && (
                <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
              >
                {loading ? "Creating account..." : "Create account"}
              </Button>
            </form>

            <div className="relative">
              <Separator className="my-4" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-white px-2 text-xs text-gray-500">or</span>
              </div>
            </div>

            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-pink-600 hover:text-pink-700 font-medium hover:underline transition-colors"
              >
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-500">
          By creating an account, you agree to our terms and privacy policy
        </p>
      </div>
    </div>
  );
}
