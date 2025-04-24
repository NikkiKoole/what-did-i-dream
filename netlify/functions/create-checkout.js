import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function handler(event) {
  const { priceId } = JSON.parse(event.body);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.URL}/success`,
    cancel_url: `${process.env.URL}/cancel`,
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ url: session.url }),
  };
}
