import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    if (password !== process.env.ADMIN_PASSWORD) {
      return Response.json({ error: "Mot de passe incorrect" }, { status: 401 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Get charges for current month
    const monthCharges = await stripe.charges.list({
      created: { gte: Math.floor(startOfMonth.getTime() / 1000) },
      limit: 100,
    });

    // Get charges for last month
    const lastMonthCharges = await stripe.charges.list({
      created: {
        gte: Math.floor(startOfLastMonth.getTime() / 1000),
        lt: Math.floor(startOfMonth.getTime() / 1000),
      },
      limit: 100,
    });

    // Get charges for current year
    const yearCharges = await stripe.charges.list({
      created: { gte: Math.floor(startOfYear.getTime() / 1000) },
      limit: 100,
    });

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      status: "active",
      limit: 100,
    });

    // Get all customers count
    const customers = await stripe.customers.list({ limit: 100 });

    // Calculate MRR from active subscriptions
    let mrr = 0;
    for (const sub of subscriptions.data) {
      for (const item of sub.items.data) {
        const amount = item.price?.unit_amount || 0;
        const interval = item.price?.recurring?.interval;
        if (interval === "month") mrr += amount;
        else if (interval === "year") mrr += Math.round(amount / 12);
      }
    }

    // Revenue calculations (successful charges only)
    const monthRevenue = monthCharges.data
      .filter((c) => c.status === "succeeded")
      .reduce((s, c) => s + c.amount, 0);

    const lastMonthRevenue = lastMonthCharges.data
      .filter((c) => c.status === "succeeded")
      .reduce((s, c) => s + c.amount, 0);

    const yearRevenue = yearCharges.data
      .filter((c) => c.status === "succeeded")
      .reduce((s, c) => s + c.amount, 0);

    // Monthly breakdown for chart (current year)
    const monthlyBreakdown: number[] = Array(12).fill(0);
    for (const charge of yearCharges.data) {
      if (charge.status === "succeeded" && charge.created) {
        const month = new Date(charge.created * 1000).getMonth();
        monthlyBreakdown[month] += charge.amount;
      }
    }

    return Response.json({
      stripe: {
        monthRevenue: monthRevenue / 100,
        lastMonthRevenue: lastMonthRevenue / 100,
        yearRevenue: yearRevenue / 100,
        mrr: mrr / 100,
        activeSubscriptions: subscriptions.data.length,
        totalCustomers: customers.data.length,
        monthlyBreakdown: monthlyBreakdown.map((a) => a / 100),
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Admin API error:", msg);
    return Response.json({ error: `Erreur: ${msg}` }, { status: 500 });
  }
}
