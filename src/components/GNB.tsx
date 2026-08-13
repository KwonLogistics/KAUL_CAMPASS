"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function GNB() {
  const pathname = usePathname();
  
  const navItems = [
    { name: '홈', path: '/', icon: '🏠' },
    { name: '화물 정보', path: '/cargo', icon: '🧭' },
    { name: '내 운송', path: '/transport', icon: '📋' },
    { name: '정산', path: '/settlement', icon: '₩' },
    { name: '메뉴', path: '/menu', icon: '≡' },
  ];

  return (
    <nav className="absolute bottom-0 w-full max-w-[480px] h-[60px] bg-white border-t border-gray-200 flex justify-around items-center text-[10px] text-gray-400 z-50">
      {navItems.map((item) => {
        const isActive = pathname === item.path || (pathname.startsWith('/cargo') && item.path === '/cargo');
        return (
          <Link href={item.path} key={item.name} className={`flex flex-col items-center justify-center w-full h-full ${isActive ? 'text-gray-900 font-bold' : ''}`}>
            <span className={`text-xl mb-1 ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>{item.icon}</span>
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
