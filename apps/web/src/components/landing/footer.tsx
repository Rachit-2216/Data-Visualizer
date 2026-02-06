'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#030712]">
      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-white/60">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">DataCanvas</span>
          <span>(c) 2026</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/docs" className="hover:text-white">Docs</Link>
          <Link href="/privacy" className="hover:text-white">Privacy</Link>
          <Link href="/terms" className="hover:text-white">Terms</Link>
        </div>
      </div>
    </footer>
  );
}
