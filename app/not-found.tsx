import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-4">
          <div className="w-24 h-24 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full mx-auto flex items-center justify-center"></div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            404
          </h1>
          <h2 className="text-2xl font-semibold text-gray-800">
            Page not found
          </h2>
          <p className="text-gray-600 leading-relaxed">
            This page seems to have wandered off into the gentle void.
            Let&apos;s get you back to somewhere peaceful.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            asChild
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg"
          >
            <Link href="/">Go home</Link>
          </Button>
          <Button
            variant="outline"
            asChild
            className="border-gray-300 hover:border-pink-300 hover:bg-pink-50"
          >
            <Link href="/feed">View feed</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
