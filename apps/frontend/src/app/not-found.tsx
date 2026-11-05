import React from 'react';
import Link from 'next/link';
import { Package, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-bg text-text text-center">
      <div className="w-16 h-16 rounded-2xl bg-accent-soft text-accent flex items-center justify-center mb-6 shadow-sm">
        <Package className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight text-text">404</h1>
      <h2 className="text-lg font-bold text-text mt-2">Page Not Found</h2>
      <p className="text-xs text-text-muted mt-1 max-w-sm">
        The page you are looking for does not exist or may have been relocated.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Link href="/app/dashboard">
          <Button size="sm" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Go to Dashboard</span>
          </Button>
        </Link>
        <Link href="/">
          <Button variant="outline" size="sm">
            Catalog Home
          </Button>
        </Link>
      </div>
    </div>
  );
}

