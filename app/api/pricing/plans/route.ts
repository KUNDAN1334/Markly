import { NextResponse } from 'next/server';
import { getPricingCatalog } from '@/lib/billing/billing-service';
import { serializePlan } from '@/lib/billing/plans';

export async function GET() {
  return NextResponse.json(getPricingCatalog().map(serializePlan));
}

