"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  Search,
  Heart,
  User,
  Bell,
  LogOut,
  Settings,
  Bookmark,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";

interface NavigationProps {
  user?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
}

export function Navigation({ user }: NavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const notifications = 3; // Mock notification count

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const navItems = [
    { href: "/feed", icon: Home, label: "Home", count: 0 },
    { href: "/search", icon: Search, label: "Discover", count: 0 },
    {
      href: "/notifications",
      icon: Bell,
      label: "Notifications",
      count: notifications,
    },
    { href: "/bookmarks", icon: Bookmark, label: "Bookmarks", count: 0 },
    { href: "/likes", icon: Heart, label: "Liked Posts", count: 0 },
  ];

  const initials =
    user?.full_name
      ?.split(" ")
      .map((name) => name[0])
      .join("")
      .toUpperCase() ||
    user?.username[0]?.toUpperCase() ||
    "U";

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/feed"
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Softsocial
            </h1>
          </Link>

          {/* Navigation Items - Desktop */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`relative flex items-center space-x-2 h-10 px-4 transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 text-pink-600 dark:text-pink-400 shadow-sm"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${
                        isActive ? "text-pink-600 dark:text-pink-400" : ""
                      }`}
                    />
                    <span className="font-medium">{item.label}</span>
                    {item.count > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-1 h-5 w-5 p-0 bg-pink-500 text-white text-xs flex items-center justify-center"
                      >
                        {item.count > 9 ? "9+" : item.count}
                      </Badge>
                    )}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          {user ? (
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full ring-2 ring-pink-100 hover:ring-pink-200 transition-all duration-200"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white font-semibold text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 mt-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-gray-200 dark:border-gray-700 shadow-xl"
                >
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {user.full_name || user.username}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        @{user.username}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/profile/${user.username}`}
                      className="flex items-center cursor-pointer"
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/settings"
                      className="flex items-center cursor-pointer"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-red-600 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Button variant="ghost" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button
                asChild
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
              >
                <Link href="/signup">Sign up</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Navigation */}
        {user && (
          <div className="md:hidden mt-3 flex items-center justify-around border-t border-gray-100 dark:border-gray-700 pt-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`relative flex flex-col items-center space-y-1 h-12 w-16 p-0 transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-b from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 text-pink-600 dark:text-pink-400"
                        : "text-gray-500 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${
                        isActive ? "text-pink-600 dark:text-pink-400" : ""
                      }`}
                    />
                    <span className="text-xs font-medium">{item.label}</span>
                    {item.count > 0 && (
                      <Badge
                        variant="secondary"
                        className="absolute -top-1 -right-1 h-4 w-4 p-0 bg-pink-500 text-white text-xs flex items-center justify-center"
                      >
                        {item.count > 9 ? "9+" : item.count}
                      </Badge>
                    )}
                  </Button>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
