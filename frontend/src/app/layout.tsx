import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CoderVu SalesAI — Outbound AI Voice Agent Dashboard",
  description: "Configure multi-tenant voice prompts, manage lead campaigns, run real-time call transcripts and premium RAG knowledge documents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
