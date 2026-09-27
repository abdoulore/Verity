import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verity | Requirement audits",
  description: "Run acceptance checks against working code and inspect the evidence behind every verdict.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
