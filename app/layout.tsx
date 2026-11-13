import type { Metadata } from "next";
import "./globals.css";
import "./header-hero.css";
import "./inspiration.css";
import "./inner-pages.css";
import "./site-background.css";
import "./content-library.css";

export const metadata: Metadata = {
  title: "HKL — A more beautiful world begins within",
  description: "Discover Humility, Kindness & Love. Explore weekly practices, inspiring stories, and gatherings with the HKL global community.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
