'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import CatalogPage from '../page';

export default function CategoryDynamicPage() {
  const params = useParams();
  // Simply re-uses CatalogPage with category path parameters
  return <CatalogPage />;
}

