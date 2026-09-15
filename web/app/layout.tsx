import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Civic Right — Your Voice, Your Community",
  description:
    "Report infrastructure issues, track government responses, and access reliable civic information — all in one place for Nigerian citizens.",
  keywords: ["civic", "Nigeria", "government", "report issues", "roads", "electricity", "community"],
  openGraph: {
    title: "Civic Right",
    description: "Report issues. Track progress. Get informed.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
