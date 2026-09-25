import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verity Sample App",
  description: "Deliberately incomplete sample for the Verity demo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
