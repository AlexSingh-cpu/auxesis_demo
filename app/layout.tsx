import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: {
    default: "Margin",
    template: "%s · Margin",
  },
  description:
    "Submit problems from your textbooks, filter them by topic and difficulty, and track what you actually understand.",
};

// Runs during HTML parse, before first paint. The server already renders the
// dark class, so this only does work for readers who chose light.
const themeScript = `(function(){try{if(localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY
)})==="light"){var e=document.documentElement;e.classList.remove("dark");e.classList.add("light")}}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} ${bricolage.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
