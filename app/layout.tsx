import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import LanguageSwitcher from "./components/LanguageSwitcher";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Family Calendar",
  description: "Build your family tree and get a living calendar of birthdays and anniversaries.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        {/* Language switcher — fixed top-right, always accessible */}
        <div className="fixed top-3 right-3 z-40">
          <LanguageSwitcher />
        </div>
        {children}
      </body>
    </html>
  );
}
