import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import getRawBody from "raw-body";

// export const config = {
//   bodyParser: false, // disable Netlify's auto-body parsing
// };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function handler(req) {
  console.log("📩 Webhook received");

  console.log("🧪 typeof req.body:", typeof req.body);
  console.log("🧪 body preview:", JSON.stringify(req.body).slice(0, 200));

  let rawBody;
  try {
    rawBody = await getRawBody(req);
  } catch (err) {
    console.error("❌ Failed to read raw body:", err.message);
    return {
      statusCode: 400,
      body: "Failed to read request body",
    };
  }

  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
    console.log("✅ Stripe event verified:", event.type);
  } catch (err) {
    console.error("❌ Signature verification failed:", err.message);
    return {
      statusCode: 400,
      body: `Webhook Error: ${err.message}`,
    };
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    console.log("💳 Checkout completed for:", session.customer_email);

    try {
      const lineItem = await stripe.checkout.sessions.listLineItems(
        session.id,
        { limit: 1 },
      );
      const priceId = lineItem.data[0]?.price?.id;
      const price = await stripe.prices.retrieve(priceId);
      const tokensToAdd = parseInt(price.metadata.tokens || "0", 10);

      console.log("🧾 Price ID:", priceId);
      console.log("🎟️ Tokens to add:", tokensToAdd);

      const { data: user, error: userErr } = await supabase
        .from("users") // change to 'auth.users' if needed
        .select("id")
        .eq("email", session.customer_email)
        .maybeSingle();

      console.log("👤 Supabase user:", user);

      if (user?.id) {
        const { error: updateErr } = await supabase
          .from("profiles")
          .update({})
          .eq("id", user.id)
          .increment({ credits: tokensToAdd });

        if (updateErr) {
          console.error("❌ Error updating credits:", updateErr);
        } else {
          console.log(`✅ Added ${tokensToAdd} credits to user ${user.id}`);
        }
      } else {
        console.warn(
          "⚠️ No matching user found for email:",
          session.customer_email,
        );
      }
    } catch (err) {
      console.error("❌ Internal webhook error:", err.message);
    }
  }

  return {
    statusCode: 200,
    body: "OK",
  };
}
