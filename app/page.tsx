import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Softsocial
          </h1>
        </div>
        <div className="space-x-3">
          <Button
            variant="ghost"
            asChild
            className="text-gray-600 hover:text-pink-600"
          >
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
      <main className="container mx-auto px-4 py-12">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <div className="space-y-4">
            <Badge
              variant="secondary"
              className="bg-pink-100 text-pink-700 border-pink-200"
            >
              ✨ A gentler way to connect
            </Badge>
            <h2 className="text-5xl md:text-6xl font-bold leading-tight">
              Social media that{" "}
              <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                cares about you
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Experience social networking designed with kindness, mindfulness,
              and genuine connections at its heart.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              asChild
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-xl h-12 px-8 transition-all duration-200 transform hover:scale-105"
            >
              <Link href="/signup">Start your journey</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 px-8 border-gray-300 hover:border-pink-300 hover:bg-pink-50"
            >
              Learn more
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="backdrop-blur-sm bg-white/70 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-600 rounded-2xl mx-auto flex items-center justify-center">
                <span className="text-2xl">💝</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800">
                Mindful Sharing
              </h3>
              <p className="text-gray-600">
                Share moments that matter with thoughtful prompts and gentle
                reminders to post with intention.
              </p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-white/70 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl mx-auto flex items-center justify-center">
                <span className="text-2xl">🌸</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800">
                Gentle Interactions
              </h3>
              <p className="text-gray-600">
                Connect through kindness with positive-only reactions and
                supportive comment experiences.
              </p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-white/70 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center">
                <span className="text-2xl">🌱</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800">
                Personal Growth
              </h3>
              <p className="text-gray-600">
                Reflect on your connections and digital wellness with insights
                that help you grow.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="mt-24 text-center space-y-6 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-3xl p-12 backdrop-blur-sm">
          <h3 className="text-3xl font-bold text-gray-800">
            Ready to experience social media differently?
          </h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Join thousands who have found a more meaningful way to connect
            online.
          </p>
          <Button
            size="lg"
            asChild
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-xl h-12 px-8"
          >
            <Link href="/signup">Join Softsocial today</Link>
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-16 border-t border-gray-200">
        <div className="text-center text-gray-500 text-sm">
          <p>
            &copy; 2025 Softsocial. Made with 💜 for meaningful connections.
          </p>
        </div>
      </footer>
    </div>
  );
}
