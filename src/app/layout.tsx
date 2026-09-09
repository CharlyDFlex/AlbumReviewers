import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  const t = await getTranslations("Footer");

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>
          <Navbar />
          <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6">
            {children}
          </main>
          <footer className="border-t border-border py-6 text-center text-xs text-muted">
            <nav className="mb-2 flex justify-center gap-4">
              <Link href="/mentions-legales" className="hover:text-foreground transition">
                {t("legalNotice")}
              </Link>
              <Link href="/confidentialite" className="hover:text-foreground transition">
                {t("privacy")}
              </Link>
              <Link href="/cgu" className="hover:text-foreground transition">
                {t("terms")}
              </Link>
            </nav>
            <p>{t("tagline")}</p>
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
