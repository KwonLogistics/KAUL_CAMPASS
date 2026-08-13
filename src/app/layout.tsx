import type { Metadata } from "next";
import "./globals.css";
import GNB from "@/components/GNB";

export const metadata: Metadata = {
  title: "카카오 T 트럭커 프로토타입",
  description: "AI 해커톤 제출용 클론 앱",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <div className="mobile-container">
          <div className="scrollable-content bg-gray-50">
            {children}
          </div>
          <GNB />
        </div>
      </body>
    </html>
  );
}
