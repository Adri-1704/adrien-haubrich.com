import Stripe from "stripe";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    if (password !== process.env.ADMIN_PASSWORD) {
      return Response.json({ error: "Mot de passe incorrect" }, { status: 401 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      timeout: 10000,
      maxNetworkRetries: 0,
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Run essential calls in parallel
    const [monthCharges, lastMonthCharges, subscriptions] = await Promise.all([
      stripe.charges.list({
        created: { gte: Math.floor(startOfMonth.getTime() / 1000) },
        limit: 100,
      }),
      stripe.charges.list({
        created: {
          gte: Math.floor(startOfLastMonth.getTime() / 1000),
          lt: Math.floor(startOfMonth.getTime() / 1000),
        },
        limit: 100,
      }),
      stripe.subscriptions.list({ status: "active", limit: 100 }),
    ]);

    // MRR
    let mrr = 0;
    for (const sub of subscriptions.data) {
      for (const item of sub.items.data) {
        const amount = item.price?.unit_amount || 0;
        const interval = item.price?.recurring?.interval;
        if (interval === "month") mrr += amount;
        else if (interval === "year") mrr += Math.round(amount / 12);
      }
    }

    const monthRevenue = monthCharges.data
      .filter((c) => c.status === "succeeded")
      .reduce((s, c) => s + c.amount, 0);

    const lastMonthRevenue = lastMonthCharges.data
      .filter((c) => c.status === "succeeded")
      .reduce((s, c) => s + c.amount, 0);

    // Year revenue: sum both months we already have + fetch remaining
    let yearRevenue = monthRevenue + lastMonthRevenue;
    const monthlyBreakdown: number[] = Array(12).fill(0);

    // Fill current and last month in breakdown
    for (const c of monthCharges.data) {
      if (c.status === "succeeded") monthlyBreakdown[now.getMonth()] += c.amount;
    }
    for (const c of lastMonthCharges.data) {
      if (c.status === "succeeded") monthlyBreakdown[now.getMonth() - 1 >= 0 ? now.getMonth() - 1 : 11] += c.amount;
    }

    // Fetch year data separately (non-blocking, ok if it fails)
    try {
      const yearCharges = await stripe.charges.list({
        created: { gte: Math.floor(startOfYear.getTime() / 1000) },
        limit: 100,
      });
      yearRevenue = yearCharges.data
        .filter((c) => c.status === "succeeded")
        .reduce((s, c) => s + c.amount, 0);

      // Recalculate breakdown from full year data
      monthlyBreakdown.fill(0);
      for (const charge of yearCharges.data) {
        if (charge.status === "succeeded" && charge.created) {
          const month = new Date(charge.created * 1000).getMonth();
          monthlyBreakdown[month] += charge.amount;
        }
      }
    } catch { /* use partial data */ }

    return Response.json({
      stripe: {
        monthRevenue: monthRevenue / 100,
        lastMonthRevenue: lastMonthRevenue / 100,
        yearRevenue: yearRevenue / 100,
        mrr: mrr / 100,
        activeSubscriptions: subscriptions.data.length,
        totalCustomers: subscriptions.data.length,
        monthlyBreakdown: monthlyBreakdown.map((a) => a / 100),
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Admin API error:", msg);
    return Response.json({ error: `Erreur: ${msg}` }, { status: 500 });
  }
}
