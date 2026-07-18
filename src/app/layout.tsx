import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "px.ar — URL shortener",
  description: "Quickly shorten long URLs into https://px.ar/{code} links.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
