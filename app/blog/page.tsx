import type { Metadata } from 'next';
import BlogPageClient from '@/components/blog/BlogPageClient';

export const metadata: Metadata = {
  title: 'Why I built Markly — Markly Blog',
  description:
    'The problem behind Markly: a PDF annotation and async review platform built to fix a review loop that lived in email and WhatsApp. Architecture, hard problems, and use cases.',
  openGraph: {
    title: 'Why I built Markly',
    description:
      'A PDF annotation and async review platform built solo — login-free review links, direct-to-storage uploads, and exports that match the screen exactly.',
    type: 'article',
  },
};

export default function BlogPage() {
  return <BlogPageClient />;
}
