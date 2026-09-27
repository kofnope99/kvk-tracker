import { Cinzel, EB_Garamond, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel", weight: ["400", "600", "700", "900"] });
const garamond = EB_Garamond({ subsets: ["latin"], variable: "--font-garamond", weight: ["400", "500", "600"] });
const mono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500", "600"] });

export const metadata = {
  title: "Kingdom 2194",
  description: "Kingdom 2194 alliance KvK stat tracker",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${cinzel.variable} ${garamond.variable} ${mono.variable}`}>
      <body className="font-body min-h-screen">{children}</body>
    </html>
  );
}
