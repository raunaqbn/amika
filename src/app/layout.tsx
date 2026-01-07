import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";
import { AuthProvider } from "@/lib/auth-context";

export const viewport: Viewport = {
  themeColor: "#A8C5A8",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://amika.vercel.app"),
  title: "Amika - Nurture Your Friendships",
  description: "A beautiful app to help you stay connected with the people who matter most",
  applicationName: "Amika",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Amika",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Amika",
    title: "Amika - Nurture Your Friendships",
    description: "A beautiful app to help you stay connected with the people who matter most",
  },
  twitter: {
    card: "summary_large_image",
    title: "Amika - Nurture Your Friendships",
    description: "A beautiful app to help you stay connected with the people who matter most",
  },
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
