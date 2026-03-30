type RazorpayConstructor = new (options: {
  key_id: string;
  key_secret: string;
}) => {
  customers: {
    create: (input: Record<string, unknown>) => Promise<{ id: string }>;
  };
  subscriptions: {
    create: (input: Record<string, unknown>) => Promise<{ id: string; status?: string }>;
    cancel: (id: string, input: Record<string, unknown>) => Promise<unknown>;
  };
  plans: {
    create: (input: Record<string, unknown>) => Promise<{ id: string }>;
  };
};

let cachedClient: InstanceType<RazorpayConstructor> | null = null;

export async function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
  }

  if (!cachedClient) {
    let RazorpayModule: { default: RazorpayConstructor };
    try {
      RazorpayModule = await import('razorpay');
    } catch {
      throw new Error('The `razorpay` package is not installed. Run `npm install razorpay` before using billing.');
    }

    cachedClient = new RazorpayModule.default({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  return cachedClient;
}
