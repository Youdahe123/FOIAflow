import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { SubscriptionTier } from "@/generated/prisma/client";
import Stripe from "stripe";

const priceIdToTier: Record<string, SubscriptionTier> = {
  price_1TGxeAAlU9dXVkEBSZaGFiNH: "STARTER",
  price_1TGxeEAlU9dXVkEBuy9AobZm: "PRO",
  price_1TGxeNAlU9dXVkEBhzi4sCP8: "NEWSROOM",
};

function tierFromSubscription(
  subscription: Stripe.Subscription
): SubscriptionTier {
  const priceId = subscription.items.data[0]?.price?.id;
  if (priceId && priceIdToTier[priceId]) {
    return priceIdToTier[priceId];
  }
  return "STARTER";
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (userId && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          await prisma.user.update({
            where: { id: userId },
            data: {
              stripeCustomerId: session.customer as string,
              subscriptionId: session.subscription as string,
              subscriptionTier: tierFromSubscription(subscription),
            },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;

        await prisma.user.update({
          where: { subscriptionId: subscription.id },
          data: {
            subscriptionTier: tierFromSubscription(subscription),
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        await prisma.user.update({
          where: { subscriptionId: subscription.id },
          data: {
            subscriptionTier: "FREE_TRIAL",
            subscriptionId: null,
          },
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        if (customerId) {
          await prisma.activity.create({
            data: {
              userId: (
                await prisma.user.findUnique({
                  where: { stripeCustomerId: customerId },
                  select: { id: true },
                })
              )!.id,
              action: "payment_failed",
              metadata: {
                invoiceId: invoice.id,
                amountDue: invoice.amount_due,
              },
            },
          });
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
