import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function handler(event) {
  console.log(event);
  // Optional but good practice: Check HTTP Method
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }

  console.log("Checkout function invoked. Headers:", event.headers); // Log headers for debugging

  try {
    const { priceId } = JSON.parse(event.body);
    if (!priceId) {
      console.error("Missing priceId in request body");
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing priceId" }),
      };
    }

    const userEmail = event.headers["x-user-email"];
    if (!userEmail) {
      // Decide if you want to block the request or just proceed without pre-filling the email
      console.warn(
        "Missing x-user-email header. Proceeding without pre-filled email.",
      );
    } else {
      console.log("Received user email:", userEmail);
    }
    const siteUrl = process.env.SITE_URL || "http://localhost:5173";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      // success_url: `${process.env.SITE_URL}/success`,
      // cancel_url: `${process.env.SITE_URL}/cancel`,
      success_url: `${siteUrl}/index.html?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/index.html?checkout=cancel`,
      customer_email: event.headers["x-user-email"],
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message }),
    };
  }
}
