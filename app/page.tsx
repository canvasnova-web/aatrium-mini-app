"use client";

import { useEffect, useState } from "react";
import { RegistrationWizard } from "@/components/registration-wizard";
import { initTelegramWebApp, isTelegramWebApp } from "@/lib/telegram";
import { Button } from "@/components/ui/button";

function getLeadIdFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get("lead_id");
}

export default function Home() {
  const [isTelegram, setIsTelegram] = useState<boolean | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);

  useEffect(() => {
    try {
      initTelegramWebApp();
      const hasWebApp = isTelegramWebApp();
      setIsTelegram(hasWebApp);
      const lid = getLeadIdFromUrl();
      setLeadId(lid);
      if (!hasWebApp) {
        setLoadError("Telegram WebApp topilmadi. Iltimos, Telegram orqali oching.");
      } else if (!lid) {
        setLoadError("Lead ID topilmadi. Iltimos, bot orqali qayta kiring.");
      }
    } catch (err: any) {
      setLoadError(err?.message || "Yuklashda xatolik");
      setIsTelegram(false);
    }
  }, []);

  if (isTelegram === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <p className="text-muted-foreground mb-2">Yuklanmoqda...</p>
        <p className="text-xs text-muted-foreground">
          Telegram: {typeof window !== "undefined" && (window as any).Telegram ? "ha" : "yo'q"}
          {" | "}
          WebApp: {typeof window !== "undefined" && (window as any).Telegram?.WebApp ? "ha" : "yo'q"}
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <h1 className="text-xl font-semibold mb-2 text-destructive">Xatolik</h1>
        <p className="text-muted-foreground mb-4">{loadError}</p>
        <Button onClick={() => window.location.href = "https://t.me/Germaniya_Ish_bot"}>
          @Germaniya_Ish_bot
        </Button>
      </div>
    );
  }

  return <RegistrationWizard leadId={leadId} />;
}
