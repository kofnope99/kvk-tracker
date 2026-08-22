import "./globals.css";
import { Cinzel, EB_Garamond, IBM_Plex_Mono } from "next/font/google";

const display = Cinzel({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display" });
const body = EB_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body" });
const data = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-data" });

export const metadata = {
  title: "Kingdom 2194",
  description: "Kill/death stats and point tracking for the alliance",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${data.variable}`}>
      <body className="min-h-screen bg-ink text-paper font-body">
        <div className="max-w-4xl mx-auto px-4 py-8">{children}</div>
      </body>
    </html>
  );
}
