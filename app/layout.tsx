import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FairSignal | Career Fair Field Guide",
  description:
    "Rank employers, prepare stronger conversations, capture recruiter notes, and follow up while the details are fresh.",
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
