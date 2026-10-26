import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "LETAN Remix Studio", template: "%s · LETAN Remix Studio" },
  description: "An AI-native website builder with structured projects, visual editing, 3D scenes, and publishing.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
