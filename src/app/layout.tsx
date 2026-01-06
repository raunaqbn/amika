import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";
import { AuthProvider } from "@/lib/auth-context";

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
      <body className="antialiased">
        <AuthProvider>
          <Nav />
          <main>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
