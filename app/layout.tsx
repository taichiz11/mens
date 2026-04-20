import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "メンズエステ一覧",
  description: "信頼できるメンズエステ店舗情報を、ノイズなく探せる",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={`${geistSans.variable}`}>
      <body className="bg-gray-50">{children}</body>
    </html>
  );
}
