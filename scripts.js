const express = require('express');
const stripe = require('stripe')('your_stripe_secret_key');

const app = express();
app.use(express.json());

// Endpoint to create a new subscription
app.post('/subscribe', async (req, res) => {
  const { email, plan } = req.body;

  try {
    // Create a customer in Stripe
    const customer = await stripe.customers.create({
      email: email,
      payment_method: req.body.payment_method,
      invoice_settings: {
        default_payment_method: req.body.payment_method,
      },
    });

    // Create a subscription for the customer
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: 'your_price_id_for_plan' }],
      expand: ['latest_invoice.payment_intent'],
    });

    // Return the subscription details to the client
    res.json({ subscription });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Webhook endpoint to handle events like payment success, failure, etc.
app.post('/webhook', (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, 'your_stripe_endpoint_secret');
  } catch (err) {
    console.error(err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object; // contains a payment_intent
      console.log('PaymentIntent was successful!');
      break;
    case 'payment_intent.payment_failed':
      const paymentFailedIntent = event.data.object; // contains a payment_intent
      console.log('PaymentIntent failed!');
      break;
    // Add more event handlers as needed

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
