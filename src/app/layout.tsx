import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Engineering Studio | Personal Task, Project & Incubator Hub",
  description: "Personal engineering workspace for Harsh - Tasks, SOW, Client Estimations, Sprint Kanban, Product Roadmaps & Learning Hub",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
