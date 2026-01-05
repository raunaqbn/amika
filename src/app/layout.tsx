import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";

export const metadata: Metadata = {
  title: "Amika - Nurture Your Friendships",
  description: "A minimal friendship management app to help you stay connected",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#FFFBF5]">
        <Nav />
        <main className="md:pt-16 pb-20 md:pb-0">
          {children}
        </main>
      </body>
    </html>
  );
}
