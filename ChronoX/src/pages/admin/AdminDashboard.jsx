import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const API_URL = "http://localhost:3000";
const CHART_COLORS = ["#20cbb5", "#20b52c", "#ff9f0a", "#5046ff", "#f04f8a"];

const money = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const number = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);

function getOrderAmount(order) {
  const direct = Number(order?.totalAmount ?? order?.total ?? order?.amount);
  if (Number.isFinite(direct) && direct > 0) return direct;

  const items = Array.isArray(order?.items)
    ? order.items
    : Array.isArray(order?.products)
      ? order.products
      : [];

  return items.reduce(
    (sum, item) =>
      sum + number(item.price ?? item.unitPrice) * Math.max(1, number(item.quantity ?? item.qty) || 1),
    0,
  );
}

function getOrderItems(order) {
  if (Array.isArray(order?.items)) return order.items;
  if (Array.isArray(order?.products)) return order.products;
  if (order?.product) return [order.product];
  return [];
}

function isCancelled(order) {
  return ["cancelled", "canceled", "refunded"].includes(
    String(order?.status || "").toLowerCase(),
  );
}

function getOrderDate(order) {
  const raw =
    order?.createdAt ||
    order?.created_at ||
    order?.orderDate ||
    order?.date ||
    order?.timestamp;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function monthLabel(date) {
  return date.toLocaleDateString("en-IN", { month: "short" });
}

function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("year");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [productRes, userRes, orderRes] = await Promise.all([
        axios.get(`${API_URL}/products`),
        axios.get(`${API_URL}/users`),
        axios.get(`${API_URL}/orders`),
      ]);
      setProducts(Array.isArray(productRes.data) ? productRes.data : []);
      setUsers(Array.isArray(userRes.data) ? userRes.data : []);
      setOrders(Array.isArray(orderRes.data) ? orderRes.data : []);
    } catch (err) {
      console.error("Admin dashboard loading error:", err);
      setError("Could not load analytics. Check that JSON Server is running at http://localhost:3000 and that products, users, and orders endpoints exist.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    // Refresh the dashboard periodically so new orders and products appear.
    const interval = window.setInterval(loadDashboard, 60000);
    return () => {
      window.clearInterval(interval);
    };
  }, [loadDashboard]);

  const validOrders = useMemo(() => orders.filter((order) => !isCancelled(order)), [orders]);

  const revenue = useMemo(
    () => validOrders.reduce((sum, order) => sum + getOrderAmount(order), 0),
    [validOrders],
  );

  const chartData = useMemo(() => {
    const now = new Date();
    if (period === "month") {
      const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      return Array.from({ length: days }, (_, index) => {
        const day = index + 1;
        const total = validOrders.reduce((sum, order) => {
          const date = getOrderDate(order);
          return date && date.getFullYear() === now.getFullYear() &&
            date.getMonth() === now.getMonth() && date.getDate() === day
            ? sum + getOrderAmount(order)
            : sum;
        }, 0);
        return { label: String(day), revenue: total };
      });
    }

    if (period === "week") {
      return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(now);
        date.setDate(now.getDate() - (6 - index));
        const total = validOrders.reduce((sum, order) => {
          const orderDate = getOrderDate(order);
          return orderDate && orderDate.toDateString() === date.toDateString()
            ? sum + getOrderAmount(order)
            : sum;
        }, 0);
        return {
          label: date.toLocaleDateString("en-IN", { weekday: "short" }),
          revenue: total,
        };
      });
    }

    return Array.from({ length: 12 }, (_, index) => {
      const date = new Date(now.getFullYear(), index, 1);
      const total = validOrders.reduce((sum, order) => {
        const orderDate = getOrderDate(order);
        return orderDate && orderDate.getFullYear() === now.getFullYear() &&
          orderDate.getMonth() === index
          ? sum + getOrderAmount(order)
          : sum;
      }, 0);
      return { label: monthLabel(date), revenue: total };
    });
  }, [validOrders, period]);

  const topProducts = useMemo(() => {
    const map = new Map();
    validOrders.forEach((order) => {
      getOrderItems(order).forEach((item) => {
        const productId = String(item.productId ?? item.id ?? item.product?.id ?? item.name ?? item.productName ?? "unknown");
        const product = products.find((entry) => String(entry.id) === productId);
        const name = item.name ?? item.productName ?? item.product?.name ?? product?.name ?? "Watch";
        const price = number(item.price ?? item.unitPrice ?? product?.price);
        const quantity = Math.max(1, number(item.quantity ?? item.qty) || 1);
        const existing = map.get(productId) || {
          id: productId,
          name,
          image: item.image ?? item.product?.image ?? product?.image ?? "",
          units: 0,
          revenue: 0,
        };
        existing.units += quantity;
        existing.revenue += price * quantity;
        map.set(productId, existing);
      });
    });
    return [...map.values()].sort((a, b) => b.units - a.units).slice(0, 5);
  }, [validOrders, products]);

  const categoryData = useMemo(() => {
    const categoryTotals = new Map();
    validOrders.forEach((order) => {
      getOrderItems(order).forEach((item) => {
        const productId = String(item.productId ?? item.id ?? item.product?.id ?? "");
        const product = products.find((entry) => String(entry.id) === productId);
        const category =
          item.collection ?? item.category ?? item.product?.collection ??
          item.product?.category ?? product?.collection ?? product?.category ?? "Other";
        const amount = number(item.price ?? item.unitPrice ?? product?.price) *
          Math.max(1, number(item.quantity ?? item.qty) || 1);
        categoryTotals.set(category, (categoryTotals.get(category) || 0) + amount);
      });
    });
    return [...categoryTotals.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [validOrders, products]);

  const recentOrders = useMemo(
    () => [...orders].sort((a, b) => {
      const dateA = getOrderDate(a)?.getTime() || 0;
      const dateB = getOrderDate(b)?.getTime() || 0;
      return dateB - dateA;
    }).slice(0, 5),
    [orders],
  );

  const lowStock = useMemo(
    () => products.filter((product) => number(product.stock) <= 5).slice(0, 5),
    [products],
  );

  const orderStatusData = useMemo(() => {
    const counts = new Map();
    orders.forEach((order) => {
      const status = String(order.status || "Pending");
      counts.set(status, (counts.get(status) || 0) + 1);
    });
    return [...counts.entries()].map(([name, value]) => ({ name, value }));
  }, [orders]);

  const customerCount = users.filter((user) => String(user.role || "user").toLowerCase() !== "admin").length;

  const statCards = [
    { title: "Revenue", value: money(revenue), changeLabel: "all-time order value", icon: "₹", accent: "text-violet-300", iconBg: "bg-violet-400/10" },
    { title: "Total customers", value: loading ? "—" : customerCount.toLocaleString("en-IN"), changeLabel: "registered accounts", icon: "♙", accent: "text-emerald-300", iconBg: "bg-emerald-400/10" },
    { title: "Total orders", value: loading ? "—" : orders.length.toLocaleString("en-IN"), changeLabel: "orders recorded", icon: "▣", accent: "text-orange-300", iconBg: "bg-orange-400/10" },
    { title: "Total products", value: loading ? "—" : products.length.toLocaleString("en-IN"), changeLabel: `${lowStock.length} low-stock alerts`, icon: "◇", accent: "text-sky-300", iconBg: "bg-sky-400/10" },
  ];

  const tooltipStyle = {
    backgroundColor: "#191919",
    border: "1px solid #3b3b42",
    borderRadius: "10px",
    color: "#f5f5f5",
  };

  return (
    <div className="min-h-full bg-black text-white">
      <div className="border-b border-white/10 px-5 py-6 sm:px-8">
        <div className="mb-2 flex items-center gap-2 text-xs text-zinc-500">
          <span>CHRONOX</span><span>/</span><span className="text-zinc-300">Analytics dashboard</span>
        </div>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Store overview</h1>
            <p className="mt-2 text-sm text-zinc-400">Sales, customers, orders and inventory in one place.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500">Auto-refreshes every minute</span>
            <button
              type="button"
              onClick={loadDashboard}
              disabled={loading}
              className="border border-white/15 px-3 py-2 text-xs transition hover:bg-black/50 disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh data ↻"}
            </button>
          </div>
        </div>
      </div>

      <main className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {error && <div role="alert" className="border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-200">{error}</div>}

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <div key={card.title} className="rounded-xl border border-white/10 bg-[#191919] p-5 shadow-lg shadow-black/10">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-zinc-400">{card.title}</p>
                <span className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg ${card.iconBg} ${card.accent}`}>{card.icon}</span>
              </div>
              <p className="mt-4 break-words text-2xl font-semibold tracking-tight sm:text-3xl">{loading ? "—" : card.value}</p>
              <p className="mt-2 text-xs text-zinc-500">{card.changeLabel}</p>
            </div>
          ))}
        </section>

        <section className="rounded-xl border border-white/10 bg-[#191919] p-4 sm:p-5">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-base font-semibold">Revenue overview</h2>
              <p className="mt-1 text-xs text-zinc-500">Calculated from non-cancelled, non-refunded orders with usable data.</p>
            </div>
            <select value={period} onChange={(event) => setPeriod(event.target.value)} className="w-full rounded-lg border border-white/15 bg-[#191919] px-3 py-2 text-sm outline-none focus:border-teal-400 sm:w-auto">
              <option value="week">Last 7 days</option>
              <option value="month">This month</option>
              <option value="year">This year</option>
            </select>
          </div>
          <div className="h-[280px] w-full sm:h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="chronoxRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#20cbb5" stopOpacity={0.38} />
                    <stop offset="95%" stopColor="#20cbb5" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#34343a" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="label" stroke="#85858f" tickLine={false} axisLine={false} tick={{ fill: "#a1a1aa", fontSize: 12 }} minTickGap={12} />
                <YAxis stroke="#85858f" tickLine={false} axisLine={false} tick={{ fill: "#a1a1aa", fontSize: 11 }} tickFormatter={(value) => value >= 1000 ? `₹${Math.round(value / 1000)}k` : `₹${value}`} width={55} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => [money(value), "Revenue"]} labelStyle={{ color: "#d4d4d8" }} />
                <Area type="monotone" dataKey="revenue" stroke="#20cbb5" strokeWidth={2} fill="url(#chronoxRevenueGradient)" activeDot={{ r: 5, fill: "#20cbb5", stroke: "#000000", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {chartData.every((item) => item.revenue === 0) && !loading && (
            <p className="mt-2 text-xs text-zinc-500">No dated orders found for this period. Add a date field such as createdAt or orderDate to each order to populate the timeline.</p>
          )}
        </section>

        <section className="grid grid-cols-1 gap-4 2xl:grid-cols-[1.45fr_1fr]">
          <div className="min-w-0 rounded-xl border border-white/10 bg-[#191919] p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Top-selling watches</h2>
                <p className="mt-1 text-xs text-zinc-500">Ranked by units in recorded order items.</p>
              </div>
              <Link to="/admin/products" className="text-xs text-zinc-300 underline underline-offset-4 hover:text-white">Products</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[490px] text-left">
                <thead><tr className="border-y border-white/10 bg-black/40 text-[11px] text-zinc-400">
                  <th className="px-3 py-3 font-medium">Product</th><th className="px-3 py-3 font-medium">Units sold</th><th className="px-3 py-3 text-right font-medium">Revenue</th>
                </tr></thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {topProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-black/30">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          {product.image ? <img src={product.image} alt="" className="h-10 w-10 rounded-lg border border-white/10 bg-black object-contain" /> : <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/50 text-zinc-500">⌚</div>}
                          <span className="max-w-[210px] truncate text-sm">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm text-zinc-300">{product.units}</td>
                      <td className="px-3 py-3 text-right text-sm tabular-nums">{money(product.revenue)}</td>
                    </tr>
                  ))}
                  {!loading && topProducts.length === 0 && <tr><td colSpan={3} className="px-3 py-10 text-center text-sm text-zinc-500">No product-level order items found yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#191919] p-4 sm:p-5">
            <h2 className="text-base font-semibold">Sales by collection</h2>
            <p className="mt-1 text-xs text-zinc-500">Revenue distribution from order items.</p>
            {categoryData.length ? (
              <>
                <div className="h-[230px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={57} outerRadius={88} paddingAngle={3} stroke="none">
                        {categoryData.map((entry, index) => <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} formatter={(value) => money(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {categoryData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between gap-3 text-xs">
                      <span className="flex min-w-0 items-center gap-2 text-zinc-300"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} /><span className="truncate">{item.name}</span></span>
                      <span className="shrink-0 tabular-nums text-zinc-400">{money(item.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <div className="flex h-[260px] items-center justify-center text-center text-sm text-zinc-500">Collection sales appear when order items include product names or IDs and quantities.</div>}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-[#191919] p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div><h2 className="text-base font-semibold">Recent orders</h2><p className="mt-1 text-xs text-zinc-500">Latest recorded customer orders.</p></div>
              <Link to="/admin/orders" className="text-xs text-zinc-300 underline underline-offset-4 hover:text-white">View all</Link>
            </div>
            <div className="space-y-1">
              {recentOrders.map((order, index) => {
                const status = String(order.status || "Pending");
                const statusLower = status.toLowerCase();
                const statusColor = statusLower.includes("deliver") ? "text-emerald-300 bg-emerald-400/10" : statusLower.includes("cancel") || statusLower.includes("refund") ? "text-red-300 bg-red-400/10" : statusLower.includes("ship") ? "text-sky-300 bg-sky-400/10" : "text-amber-300 bg-amber-400/10";
                return <div key={order.id ?? index} className="flex flex-wrap items-center justify-between gap-3 rounded-lg px-3 py-3 hover:bg-black/40">
                  <div className="min-w-0"><p className="text-sm font-medium">Order #{order.id ?? "—"}</p><p className="mt-1 truncate text-xs text-zinc-500">{order.customerName || order.userName || order.email || order.userId || "Customer"}{getOrderDate(order) ? ` · ${getOrderDate(order).toLocaleDateString("en-IN")}` : ""}</p></div>
                  <div className="ml-auto flex items-center gap-3"><span className={`rounded-full px-2.5 py-1 text-[10px] ${statusColor}`}>{status}</span><span className="text-sm tabular-nums">{money(getOrderAmount(order))}</span></div>
                </div>;
              })}
              {!loading && recentOrders.length === 0 && <p className="py-8 text-center text-sm text-zinc-500">No orders found.</p>}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#191919] p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div><h2 className="text-base font-semibold">Inventory alerts</h2><p className="mt-1 text-xs text-zinc-500">Watches with five or fewer units in stock.</p></div>
              <Link to="/admin/products" className="text-xs text-zinc-300 underline underline-offset-4 hover:text-white">Manage stock</Link>
            </div>
            <div className="space-y-1">
              {lowStock.map((product) => {
                const stock = number(product.stock);
                return <div key={product.id} className="flex items-center justify-between gap-3 rounded-lg px-3 py-3 hover:bg-black/40">
                  <div className="flex min-w-0 items-center gap-3">
                    {product.image ? <img src={product.image} alt="" className="h-10 w-10 rounded-lg border border-white/10 bg-black object-contain" /> : <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/50 text-zinc-500">⌚</div>}
                    <div className="min-w-0"><p className="truncate text-sm font-medium">{product.name || "Unnamed watch"}</p><p className="mt-1 truncate text-xs text-zinc-500">{product.collection || product.category || "Watch"}</p></div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${stock === 0 ? "bg-red-400/10 text-red-300" : "bg-amber-400/10 text-amber-300"}`}>{stock === 0 ? "Out of stock" : `${stock} left`}</span>
                </div>;
              })}
              {!loading && lowStock.length === 0 && <p className="py-8 text-center text-sm text-zinc-500">All products have more than five items in stock.</p>}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-[#191919] p-4 sm:p-5">
            <h2 className="text-base font-semibold">Order status</h2>
            <p className="mt-1 text-xs text-zinc-500">Current order workflow distribution.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {orderStatusData.map((item, index) => <div key={item.name} className="min-w-[100px] flex-1 rounded-lg border border-white/10 bg-black/30 p-3"><p className="truncate text-xs text-zinc-400">{item.name}</p><p className="mt-2 text-xl font-semibold">{item.value}</p><div className="mt-2 h-1 rounded-full bg-white/10"><div className="h-1 rounded-full" style={{ width: `${orders.length ? (item.value / orders.length) * 100 : 0}%`, backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} /></div></div>)}
              {!loading && orderStatusData.length === 0 && <p className="py-6 text-sm text-zinc-500">No order status data available.</p>}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#191919] p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div><h2 className="text-base font-semibold">Quick management</h2><p className="mt-1 text-xs text-zinc-500">Jump to the admin tools you use most.</p></div>
              <span className="text-xl text-zinc-500">↗</span>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Link to="/admin/products" className="rounded-lg border border-white/10 p-4 transition hover:border-white/25 hover:bg-black/40"><p className="text-sm font-medium">Manage products</p><p className="mt-1 text-xs text-zinc-500">Catalogue, pricing and stock →</p></Link>
              <Link to="/admin/users" className="rounded-lg border border-white/10 p-4 transition hover:border-white/25 hover:bg-black/40"><p className="text-sm font-medium">Manage customers</p><p className="mt-1 text-xs text-zinc-500">Accounts and access →</p></Link>
              <Link to="/admin/orders" className="rounded-lg border border-white/10 p-4 transition hover:border-white/25 hover:bg-black/40"><p className="text-sm font-medium">Manage orders</p><p className="mt-1 text-xs text-zinc-500">Order details and statuses →</p></Link>
              <Link to="/admin/offers" className="rounded-lg border border-white/10 p-4 transition hover:border-white/25 hover:bg-black/40"><p className="text-sm font-medium">Promotional offers</p><p className="mt-1 text-xs text-zinc-500">Storefront banner and offers →</p></Link>
            </div>
          </div>
        </section>

        <p className="border-t border-white/10 pt-4 text-[11px] leading-5 text-zinc-600">
          Analytics are calculated from the current JSON Server records. Revenue is an estimate from order totals or item prices and excludes cancelled, canceled and refunded orders. Historical charts need valid order date fields (for example createdAt, orderDate or date).
        </p>
      </main>
    </div>
  );
}

export default AdminDashboard;
