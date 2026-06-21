import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Buffer Direct API + Make Orchestration",
  description:
    "Candidate assignment microsite for Buffer Direct API and Make orchestration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
