import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Voice Receptionists | DHCC & C37",
  description: "AI voice receptionists for Dubai Healthcare City and C37",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
