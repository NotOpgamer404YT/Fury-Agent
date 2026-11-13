import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Fury Agent — Open-Source AI Coding Agent Platform",
  description: "Self-hostable AI coding agent. Connect your own AI keys, GitHub repos and deploy to Vercel.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-ink text-primary antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
