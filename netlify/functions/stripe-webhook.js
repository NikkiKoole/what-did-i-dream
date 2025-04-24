import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import getRawBody from "raw-body";

export const config = {
  bodyParser: false,
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function handler(req) {
  const sig = req.headers["stripe-signature"];
  console.log(req);
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    return {
      statusCode: 400,
      body: `Webhook Error: ${err.message}`,
    };
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    // Get how many tokens from the associated price
    const lineItem = await stripe.checkout.sessions.listLineItems(session.id, {
      limit: 1,
    });
    const priceId = lineItem.data[0]?.price?.id;

    const price = await stripe.prices.retrieve(priceId);
    const tokensToAdd = parseInt(price.metadata.tokens);

    const customerEmail = session.customer_email;

    // Get user from Supabase
    const { data: user } = await supabase
      .from("users") // or auth.users if you query directly
      .select("id")
      .eq("email", customerEmail)
      .single();

    if (user?.id) {
      // await supabase
      //   .from("profiles")
      //   .update({ credits: supabase.raw(`credits + ${tokensToAdd}`) })
      //   .eq("id", user.id);

      await supabase
        .from("profiles")
        .update({}) // must provide at least an empty object
        .eq("id", user.id)
        .increment({ credits: tokensToAdd });
    }
  }

  return { statusCode: 200, body: "OK" };
}
