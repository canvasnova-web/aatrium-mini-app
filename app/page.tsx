"use client";

import { useEffect, useState } from "react";
import { RegistrationWizard } from "@/components/registration-wizard";
import { initTelegramWebApp, isTelegramWebApp } from "@/lib/telegram";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [isTelegram, setIsTelegram] = useState<boolean | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    try {
      initTelegramWebApp();
      const hasWebApp = isTelegramWebApp();
      setIsTelegram(hasWebApp);
      if (!hasWebApp) {
        setLoadError("Telegram WebApp topilmadi. Iltimos, Telegram orqali oching.");
      }
    } catch (err: any) {
      setLoadError(err?.message || "Yuklashda xatolik");
      setIsTelegram(false);
    }
  }, []);

  if (isTelegram === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Yuklanmoqda...</p>
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

  return <RegistrationWizard />;
}
