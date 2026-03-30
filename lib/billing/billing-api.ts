import { NextResponse } from 'next/server';

export function billingErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}

