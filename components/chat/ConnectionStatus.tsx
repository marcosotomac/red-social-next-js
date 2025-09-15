"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff } from "lucide-react";

interface ConnectionStatusProps {
  className?: string;
}

export function ConnectionStatus({ className }: ConnectionStatusProps) {
  const [isConnected, setIsConnected] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase.channel("connection-status");

    channel
      .on("system", { event: "connected" }, () => {
        setIsConnected(true);
        setIsReconnecting(false);
      })
      .on("system", { event: "disconnected" }, () => {
        setIsConnected(false);
        setIsReconnecting(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  if (isConnected && !isReconnecting) {
    return null; // Don't show anything when connected
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 text-sm",
        isConnected
          ? "bg-green-100 text-green-800"
          : "bg-yellow-100 text-yellow-800",
        className
      )}
    >
      {isConnected ? (
        <>
          <Wifi className="h-4 w-4" />
          <span>Conectado</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span>{isReconnecting ? "Reconectando..." : "Sin conexión"}</span>
        </>
      )}
    </div>
  );
}
