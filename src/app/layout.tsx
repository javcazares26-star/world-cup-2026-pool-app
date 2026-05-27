import "./globals.css";
import type { Metadata } from "next";
import { NotificationProvider } from "@/components/NotificationContext";

export const metadata: Metadata = {
  title: "World Cup 2026 Pool",
  description: "Pick scores. Earn points. Win bragging rights. Canada · Mexico · USA 2026.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NotificationProvider>
          <div className="host-flag-strip" aria-hidden />
          {children}
        </NotificationProvider>
      </body>
    </html>
  );
}
