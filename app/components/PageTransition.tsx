'use client';

import { usePathname } from 'next/navigation';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} style={{ animation: 'pageFadeIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards' }}>
      {children}
    </div>
  );
}
