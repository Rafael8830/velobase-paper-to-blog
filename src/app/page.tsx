"use client";

import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/header";
import { Background } from "@/components/layout/background";
import { SiteFooter } from "@/components/layout/site-footer";
import { PaperConverterPage } from "@/modules/paper-to-blog/components/paper-converter-page";

export default function HomePage() {
  return (
    <div
      className={cn(
        "bg-background text-foreground selection:bg-primary/30 relative w-full font-sans",
        "min-h-screen overflow-x-hidden overflow-y-auto",
      )}
    >
      <Background />
      <Header />

      <PaperConverterPage />

      <SiteFooter />
    </div>
  );
}
