import Razorpay from 'razorpay';

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  throw new Error('Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET before running this script.');
}

const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

const desiredPlans = [
  {
    key: 'RAZORPAY_PRO_PLAN_ID',
    item: {
      name: 'Markly Pro Monthly',
      amount: 99900,
      currency: 'INR',
      description: 'Markly Pro monthly subscription',
    },
  },
  {
    key: 'RAZORPAY_TEAM_PLAN_ID',
    item: {
      name: 'Markly Team Monthly',
      amount: 299900,
      currency: 'INR',
      description: 'Markly Team monthly subscription',
    },
  },
];

for (const plan of desiredPlans) {
  const created = await razorpay.plans.create({
    period: 'monthly',
    interval: 1,
    item: plan.item,
  });

  console.log(`${plan.key}=${created.id}`);
}
