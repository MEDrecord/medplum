import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Communication Gateway",
  description: "MEDrecord Communication Gateway - Multi-channel patient communication",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
