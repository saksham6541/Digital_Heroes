import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Digital Heroes — Play. Give. Win.",
  description:
    "Track your golf performance, join the monthly prize draw, and support a charity you care about.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className="bg-neutral-950 text-white"
        style={{
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}
