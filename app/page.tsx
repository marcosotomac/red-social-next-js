import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TypingText } from "@/components/ui/typing-text";

export default function HomePage() {
  return (
    <div className="h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            SocialApp
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button 
            asChild
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg"
          >
            <Link href="/signup">Get started</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 container mx-auto px-4 flex flex-col justify-center items-center text-center">
        <div className="space-y-8 max-w-4xl">
          <div className="space-y-6">
            <Badge
              variant="secondary"
              className="bg-purple-100 text-purple-800 border-purple-200"
            >
              🚀 The smarter way to connect
            </Badge>
            <h2 className="text-5xl md:text-6xl font-bold leading-tight">
              Social media that{" "}
              <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                works for you
              </span>
            </h2>
            <div className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed min-h-[3.5rem] flex items-center justify-center">
              <TypingText
                texts={[
                  { text: "Connect with friends and family", icon: "Users" },
                  { text: "Share your thoughts and moments", icon: "Smartphone" }, 
                  { text: "Discover interesting content daily", icon: "Flame" },
                  { text: "Join conversations that matter", icon: "MessageCircle" },
                  { text: "Build your community online", icon: "Star" }
                ]}
                typeSpeed={80}
                deleteSpeed={40}
                pauseTime={2000}
                className="text-xl text-gray-600"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              asChild
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg text-lg px-8 py-4"
            >
              <Link href="/signup">Join SocialApp</Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              asChild
              className="border-2 border-purple-200 hover:bg-purple-50 text-purple-700 text-lg px-8 py-4"
            >
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </main>

      {/* Glassmorphism decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000"></div>
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-4000"></div>
    </div>
  );
}
