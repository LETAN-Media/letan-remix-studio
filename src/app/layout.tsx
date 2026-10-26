import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Create a Site in Seconds · LETAN Remix", template: "%s · LETAN Remix" },
  description: "Shape a structured website project through a live five-step builder with responsive WebGL scenes.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
