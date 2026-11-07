'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import AOS from 'aos';
import 'aos/dist/aos.css';

export function AosInitializer() {
  const pathname = usePathname();

  useEffect(() => {
    AOS.init({
      duration: 500,
      once: false,
      easing: 'ease-out-cubic',
      offset: 30,
    });
  }, []);

  useEffect(() => {
    // Refresh AOS on route navigation so every page animates
    const timer = setTimeout(() => {
      AOS.refresh();
    }, 100);
    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
