import "./globals.css";

export const metadata = {
  title: "KvK Governor Tracker",
  description: "Kill/death stats and point tracking for the alliance",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-8">{children}</div>
      </body>
    </html>
  );
}
