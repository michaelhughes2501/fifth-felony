import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: "Open Road — Reentry Support",
  description:
    "Holistic support for life after incarceration: jobs, housing, mental health, legal aid, and community.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <Nav />
          <main className="min-h-[70vh]">{children}</main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
