import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";
import { AuthProvider } from "@/lib/auth-context";
import { SWRProvider } from "@/lib/swr-config";

export const viewport: Viewport = {
  themeColor: "#15161E",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://amika.vercel.app"),
  title: "Amika — Keep the days you almost forgot",
  description: "A memory-first social app for saving and sharing everyday moments with friends.",
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
    title: "Amika — Keep the days you almost forgot",
    description: "A memory-first social app for saving and sharing everyday moments with friends.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Amika — Keep the days you almost forgot",
    description: "A memory-first social app for saving and sharing everyday moments with friends.",
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
          <SWRProvider>
            <Nav />
            <main>
              {children}
            </main>
          </SWRProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
