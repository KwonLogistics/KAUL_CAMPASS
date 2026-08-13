import type { Metadata } from "next";
import "./globals.css";
import GNB from "@/components/GNB";
import { AppStateProvider } from "@/lib/store/AppStateProvider";

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
        {/* 세 사람의 화면이 같은 설정·같은 오더 목록을 보게 만드는 지점. 소유: 순범 */}
        <AppStateProvider>
          <div className="mobile-container">
            <div className="scrollable-content bg-gray-50">
              {children}
            </div>
            <GNB />
          </div>
        </AppStateProvider>
      </body>
    </html>
  );
}
