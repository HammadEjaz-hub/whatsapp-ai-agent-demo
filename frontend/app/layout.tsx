import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hammad Fabrics — AI Assistant Demo",
  description: "WhatsApp AI customer-support agent demo (web chat, no real WhatsApp)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
