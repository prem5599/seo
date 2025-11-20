import Stripe from 'stripe';
import { isServiceConfigured } from '../config/env.validation';
import { logInfo, logError } from '../config/logger';
import { pool } from '../config/database';

let stripe: Stripe | null = null;

// Initialize Stripe
export const initializeStripe = () => {
  if (!isServiceConfigured('stripe')) {
    console.log('⚠️  Stripe not configured. Payment features will be disabled.');
    return;
  }

  try {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-12-18.acacia',
    });
    logInfo('Stripe initialized successfully');
  } catch (error) {
    logError('Failed to initialize Stripe', error);
  }
};

// Check if Stripe is available
export const isStripeAvailable = (): boolean => {
  return stripe !== null;
};

// Create checkout session
export const createCheckoutSession = async (
  userId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string | null> => {
  if (!stripe) {
    logError('Stripe not initialized');
    return null;
  }

  try {
    // Get user details
    const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const session = await stripe.checkout.sessions.create({
      customer_email: userResult.rows[0].email,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
      },
    });

    return session.url;
  } catch (error) {
    logError('Failed to create checkout session', error);
    return null;
  }
};

// Create customer portal session
export const createCustomerPortalSession = async (
  customerId: string,
  returnUrl: string
): Promise<string | null> => {
  if (!stripe) {
    logError('Stripe not initialized');
    return null;
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session.url;
  } catch (error) {
    logError('Failed to create customer portal session', error);
    return null;
  }
};

// Handle webhook events
export const handleStripeWebhook = async (
  payload: string | Buffer,
  signature: string
): Promise<void> => {
  if (!stripe) {
    throw new Error('Stripe not initialized');
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  try {
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        logInfo(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    logError('Webhook error', error);
    throw error;
  }
};

// Handle checkout completed
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId) {
    logError('No userId in checkout session metadata');
    return;
  }

  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  // Get subscription details
  const subscription = await stripe!.subscriptions.retrieve(subscriptionId);

  // Determine plan type from price
  const planType = getPlanTypeFromPrice(subscription.items.data[0].price.id);

  // Update user subscription
  await pool.query(
    `INSERT INTO subscriptions (user_id, plan_type, status, stripe_customer_id, stripe_subscription_id,
     current_period_start, current_period_end)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (user_id)
     DO UPDATE SET plan_type = $2, status = $3, stripe_customer_id = $4,
                   stripe_subscription_id = $5, current_period_start = $6, current_period_end = $7`,
    [
      userId,
      planType,
      'active',
      customerId,
      subscriptionId,
      new Date(subscription.current_period_start * 1000),
      new Date(subscription.current_period_end * 1000),
    ]
  );

  // Update user subscription plan
  await pool.query('UPDATE users SET subscription_plan = $1 WHERE id = $2', [planType, userId]);

  logInfo(`Subscription created for user ${userId}: ${planType}`);
}

// Handle subscription updated
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const planType = getPlanTypeFromPrice(subscription.items.data[0].price.id);
  const status = subscription.status === 'active' ? 'active' : subscription.status;

  await pool.query(
    `UPDATE subscriptions
     SET plan_type = $1, status = $2, current_period_start = $3, current_period_end = $4, updated_at = NOW()
     WHERE stripe_customer_id = $5`,
    [
      planType,
      status,
      new Date(subscription.current_period_start * 1000),
      new Date(subscription.current_period_end * 1000),
      customerId,
    ]
  );

  logInfo(`Subscription updated for customer ${customerId}`);
}

// Handle subscription deleted
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  await pool.query(
    `UPDATE subscriptions SET status = $1, updated_at = NOW() WHERE stripe_customer_id = $2`,
    ['cancelled', customerId]
  );

  // Downgrade to starter plan
  await pool.query(
    `UPDATE users SET subscription_plan = $1
     WHERE id = (SELECT user_id FROM subscriptions WHERE stripe_customer_id = $2)`,
    ['starter', customerId]
  );

  logInfo(`Subscription cancelled for customer ${customerId}`);
}

// Handle payment succeeded
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  logInfo(`Payment succeeded for invoice ${invoice.id}`);
}

// Handle payment failed
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  await pool.query(
    `UPDATE subscriptions SET status = $1, updated_at = NOW() WHERE stripe_customer_id = $2`,
    ['past_due', customerId]
  );

  logError(`Payment failed for customer ${customerId}`);
}

// Map price ID to plan type
function getPlanTypeFromPrice(priceId: string): string {
  // These should match your Stripe price IDs
  const priceMap: Record<string, string> = {
    [process.env.STRIPE_PRICE_STARTER || '']: 'starter',
    [process.env.STRIPE_PRICE_PRO || '']: 'pro',
    [process.env.STRIPE_PRICE_AGENCY || '']: 'agency',
    [process.env.STRIPE_PRICE_ENTERPRISE || '']: 'enterprise',
  };

  return priceMap[priceId] || 'starter';
}

// Initialize on module load
initializeStripe();
