import type { CommentStatus } from '@/types';

// Shared by the API (to enforce) and the sidebar (to decide which buttons to show),
// so keep this file free of server-only imports.

export const COMMENT_STATUSES = ['OPEN', 'FIXED', 'VERIFIED'] as const satisfies readonly CommentStatus[];

export type StatusActor = 'owner' | 'share';

type StatusContext = {
  actor: StatusActor;
  // The owner wrote this comment themselves, so there is no reviewer to verify it.
  isOwnComment: boolean;
};

// The owner marks a reviewer's comment fixed, and only the reviewer can verify it.
// Either side can send it back to OPEN. The owner closes their own notes directly.
export function allowedStatusChanges(
  from: CommentStatus,
  { actor, isOwnComment }: StatusContext
): CommentStatus[] {
  if (actor === 'owner') {
    if (isOwnComment) return from === 'VERIFIED' ? ['OPEN'] : ['VERIFIED'];
    if (from === 'OPEN') return ['FIXED'];
    return ['OPEN'];
  }

  if (from === 'FIXED') return ['VERIFIED', 'OPEN'];
  if (from === 'VERIFIED') return ['OPEN'];
  return [];
}

// Prisma include for comments, so every route returns the same shape.
export const withStatusEvents = {
  statusEvents: { orderBy: { createdAt: 'asc' as const } },
};
