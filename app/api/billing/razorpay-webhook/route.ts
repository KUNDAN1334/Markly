import { NextRequest, NextResponse } from 'next/server';
import { handleRazorpayWebhook, verifyRazorpayWebhookSignature } from '@/lib/billing/billing-service';

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-razorpay-signature');
  const eventId = req.headers.get('x-razorpay-event-id');

  try {
    if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    console.info('Razorpay webhook received:', payload.event, payload);
    await handleRazorpayWebhook(payload, eventId);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Razorpay webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
