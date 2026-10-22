import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ClipboardCheck,
  MapPin,
  Package,
  PackageCheck,
  RefreshCw,
  Truck,
  XCircle,
} from "lucide-react";

import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { useAuth } from "../context/AuthContext";

const API_URL = "http://localhost:3000/orders";
const REFRESH_INTERVAL = 5000;

function formatDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
}

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function normalizeStatus(value) {
  const status = String(value || "Confirmed").trim().toLowerCase();
  if (status === "pending" || status === "order placed" || status === "placed") return "Confirmed";
  if (status === "out for delivery" || status === "out_for_delivery" || status === "out-for-delivery") return "Out for Delivery";
  if (status === "cancelled" || status === "canceled") return "Cancelled";
  if (status === "delivered") return "Delivered";
  if (status === "shipped") return "Shipped";
  if (status === "processing" || status === "packed") return "Processing";
  if (status === "confirmed") return "Confirmed";
  return value || "Confirmed";
}

const TRACKING_STEPS = [
  { label: "Order Confirmed", description: "Your order has been received.", status: "Confirmed", Icon: ClipboardCheck },
  { label: "Processing", description: "Your timepiece is being prepared.", status: "Processing", Icon: Package },
  { label: "Shipped", description: "Your order has left our facility.", status: "Shipped", Icon: PackageCheck },
  { label: "Out for Delivery", description: "The courier is on the way to you.", status: "Out for Delivery", Icon: Truck },
  { label: "Delivered", description: "Your timepiece has been delivered.", status: "Delivered", Icon: CheckCircle2 },
];

function getStepIndex(status) {
  const normalized = normalizeStatus(status);
  return TRACKING_STEPS.findIndex((step) => step.status === normalized);
}

function getStatusStyle(status) {
  const normalized = normalizeStatus(status);
  if (normalized === "Delivered") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (normalized === "Cancelled") return "border-red-200 bg-red-50 text-red-700";
  if (normalized === "Out for Delivery") return "border-blue-200 bg-blue-50 text-blue-800";
  if (normalized === "Shipped") return "border-violet-200 bg-violet-50 text-violet-800";
  return "border-black/10 bg-white text-black";
}

function Orders() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadOrders = useCallback(async ({ initial = false } = {}) => {
    if (!user?.id) {
      setOrders([]);
      setLoading(false);
      return;
    }

    if (initial) setLoading(true);
    else setRefreshing(true);
    setError("");

    try {
      const response = await axios.get(API_URL);
      const allOrders = Array.isArray(response.data) ? response.data : [];

      // JSON Server is the source of truth so admin status changes are shown here.
      const userOrders = allOrders.filter(
        (order) => String(order.userId) === String(user.id),
      );

      // Keep legacy local orders only when that ID is not in JSON Server.
      let localOrders = [];
      try {
        const raw =
          localStorage.getItem(`chronox_orders_${user.id}`) ||
          localStorage.getItem(`orders_${user.id}`);
        const parsed = raw ? JSON.parse(raw) : [];
        localOrders = Array.isArray(parsed) ? parsed : [];
      } catch (storageError) {
        console.warn("Could not read legacy local orders:", storageError);
      }

      const merged = [...userOrders];
      const knownIds = new Set(userOrders.map((order) => String(order.id)));
      localOrders.forEach((order) => {
        if (!knownIds.has(String(order.id))) {
          merged.push(order);
          knownIds.add(String(order.id));
        }
      });

      // De-duplicate legacy records with different IDs but identical order data.
      const uniqueIds = [...new Map(merged.map((order) => [String(order.id), order])).values()];
      const normalize = (value) => String(value ?? "").trim().toLowerCase();
      const signature = (order) => JSON.stringify({
        userId: String(order.userId ?? ""),
        email: normalize(order.email || order.shipping?.email),
        fullName: normalize(order.shipping?.fullName || order.customerName || order.userName),
        address: normalize(order.shipping?.address),
        city: normalize(order.shipping?.city),
        postalCode: normalize(order.shipping?.postalCode),
        phone: normalize(order.shipping?.phone),
        total: Number(order.totalAmount ?? order.total ?? 0),
        items: (order.items || []).map((item) => ({
          productId: String(item.productId ?? item.id ?? ""),
          quantity: Number(item.quantity) || 1,
          price: Number(item.price) || 0,
        })).sort((a, b) => a.productId.localeCompare(b.productId)),
      });

      const deduplicated = [];
      for (const order of uniqueIds) {
        const orderTime = new Date(order.createdAt || order.date || 0).getTime();
        const duplicateIndex = deduplicated.findIndex((existing) => {
          const existingTime = new Date(existing.createdAt || existing.date || 0).getTime();
          return signature(existing) === signature(order) &&
            orderTime > 0 && existingTime > 0 &&
            new Date(orderTime).toDateString() === new Date(existingTime).toDateString();
        });

        if (duplicateIndex === -1) deduplicated.push(order);
        else {
          // Prefer the server record, which contains the current admin-managed status.
          const existing = deduplicated[duplicateIndex];
          const orderIsServerRecord = userOrders.some((serverOrder) => String(serverOrder.id) === String(order.id));
          const existingIsServerRecord = userOrders.some((serverOrder) => String(serverOrder.id) === String(existing.id));
          if (orderIsServerRecord && !existingIsServerRecord) deduplicated[duplicateIndex] = order;
        }
      }

      deduplicated.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.date || 0).getTime() || 0;
        const dateB = new Date(b.createdAt || b.date || 0).getTime() || 0;
        return dateB - dateA;
      });

      setOrders(deduplicated);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to load orders from JSON Server:", err);
      setError("Could not refresh orders. Check that JSON Server is running at http://localhost:3000.");
      // Do not replace current state with stale local data on a background refresh.
      if (initial) {
        try {
          const raw =
            localStorage.getItem(`chronox_orders_${user.id}`) ||
            localStorage.getItem(`orders_${user.id}`);
          const parsed = raw ? JSON.parse(raw) : [];
          setOrders(Array.isArray(parsed) ? parsed : []);
        } catch {
          setOrders([]);
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    let active = true;
    loadOrders({ initial: true });

    // Poll JSON Server so changes made by the admin appear without a manual reload.
    const timer = window.setInterval(() => {
      if (active) loadOrders();
    }, REFRESH_INTERVAL);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [loadOrders]);

  const toggleExpanded = (orderId) => {
    setExpandedOrderId((current) => current === String(orderId) ? null : String(orderId));
  };

  const renderTracking = (order) => {
    const status = normalizeStatus(order.status);
    const cancelled = status === "Cancelled";
    const currentStep = getStepIndex(status);
    const updatedAt = order.statusUpdatedAt || order.updatedAt || order.createdAt || order.date;

    return (
      <div className="border-t border-black/10 bg-[#fafafa] px-5 py-6 sm:px-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/40">Live order tracking</p>
            <h3 className="mt-1 text-lg font-black uppercase tracking-tight">{status}</h3>
            <p className="mt-1 text-xs text-black/50">
              Status is read from your saved order. Admin changes appear automatically.
            </p>
          </div>
          <div className={`flex items-center gap-2 rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(status)}`}>
            {cancelled ? <XCircle size={15} /> : status === "Delivered" ? <CheckCircle2 size={15} /> : <Truck size={15} />}
            {status}
          </div>
        </div>

        {cancelled ? (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <XCircle className="mt-0.5 shrink-0" size={20} />
            <div>
              <p className="font-bold">This order was cancelled</p>
              <p className="mt-1 text-xs">If you need help with this order, please contact customer support.</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-5">
            {TRACKING_STEPS.map((step, index) => {
              const complete = currentStep >= 0 && index <= currentStep;
              const active = currentStep === index;
              const Icon = step.Icon;
              return (
                <div key={step.status} className="relative min-w-0">
                  {index < TRACKING_STEPS.length - 1 && (
                    <div className={`absolute left-10 right-[-1.25rem] top-5 hidden h-px sm:block ${currentStep > index ? "bg-black" : "bg-black/10"}`} />
                  )}
                  <div className="relative flex items-start gap-3 sm:flex-col">
                    <div className={`z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${complete ? "border-black bg-black text-white" : "border-black/15 bg-white text-black/30"} ${active ? "ring-4 ring-black/10" : ""}`}>
                      <Icon size={17} />
                    </div>
                    <div className="min-w-0 sm:pt-1">
                      <p className={`text-xs font-bold ${complete ? "text-black" : "text-black/40"}`}>{step.label}</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-black/50">{step.description}</p>
                      {active && (
                        <span className="mt-2 inline-block rounded-full bg-black px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-white">
                          Current status
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-black/10 pt-4 text-[10px] text-black/45">
          <span className="flex items-center gap-1.5"><Clock3 size={13} /> Last status/order update: {formatDateTime(updatedAt) || "Not provided"}</span>
          <span className="flex items-center gap-1.5"><RefreshCw size={12} className={refreshing ? "animate-spin" : ""} /> Auto-refreshes every 5 seconds</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f4f4f2] text-black">
      <header className="relative z-50 border-b border-black/10 bg-white">
        <Navbar />
      </header>

      <main className="mx-auto max-w-[1600px] px-6 py-12 md:px-10 lg:px-16">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-6">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-[-0.04em]">YOUR ORDERS</h1>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.15em] text-black/50">Order history &amp; delivery tracking</p>
            {lastUpdated && <p className="mt-2 text-[10px] text-black/40">Last synced: {lastUpdated.toLocaleTimeString("en-IN")}</p>}
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => loadOrders()}
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-black/50 transition hover:text-black"
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} /> Refresh
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-black/50 transition hover:text-black"
            >
              Explore Watches <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {error && (
          <div role="alert" className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <div className="flex min-h-[35vh] items-center justify-center text-sm text-black/50">Loading your orders...</div>
        ) : orders.length === 0 ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-16 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-black/10 bg-white shadow-sm">
              <Package size={28} strokeWidth={1.2} className="text-black/40" />
            </div>
            <h2 className="text-2xl font-bold uppercase tracking-tight text-black md:text-3xl">No orders placed yet.</h2>
            <p className="mt-3 max-w-sm text-xs leading-relaxed text-black/50">When you purchase a timepiece, your order confirmation and tracking details will appear here.</p>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="mt-8 flex items-center gap-3 rounded-full bg-black px-8 py-4 text-[10px] font-bold uppercase tracking-[0.15em] text-white shadow-md transition hover:bg-[#222] active:scale-95"
            >
              Discover Watches <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const isExpanded = expandedOrderId === String(order.id);
              const status = normalizeStatus(order.status);
              return (
                <section key={order.id} className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 bg-[#fafafa] px-5 py-4 sm:px-6">
                    <div className="flex flex-wrap items-center gap-5 text-xs">
                      <div>
                        <span className="block text-[9px] font-bold uppercase tracking-wider text-black/40">Order ID</span>
                        <span className="font-bold text-black">{order.id}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold uppercase tracking-wider text-black/40">Date Placed</span>
                        <span className="font-medium text-black">{formatDate(order.createdAt || order.date)}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold uppercase tracking-wider text-black/40">Total Amount</span>
                        <span className="font-bold text-black">{formatCurrency(order.totalAmount ?? order.total ?? order.amount)}</span>
                        {order.couponCode && (
                          <span className="mt-0.5 block text-[9px] font-semibold text-emerald-700">
                            Privilege {order.couponCode} {Number(order.discountAmount) > 0 ? `(−${formatCurrency(order.discountAmount)})` : "applied"}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(status)}`}>
                      {status === "Cancelled" ? <XCircle size={13} /> : <CheckCircle2 size={13} />}
                      <span>{status}</span>
                    </div>
                  </div>

                  <div className="divide-y divide-black/5 px-5 sm:px-6">
                    {(Array.isArray(order.items) ? order.items : []).map((item, index) => (
                      <button
                        type="button"
                        key={item.id ?? item.productId ?? index}
                        onClick={() => toggleExpanded(order.id)}
                        aria-expanded={isExpanded}
                        className="flex w-full items-center justify-between gap-4 py-4 text-left transition hover:bg-black/[0.02]"
                      >
                        <span className="flex min-w-0 items-center gap-4">
                          {item.image ? (
                            <img src={item.image} alt={item.name || "Watch"} className="h-20 w-20 shrink-0 object-contain sm:h-24 sm:w-24" />
                          ) : (
                            <span className="flex h-20 w-20 shrink-0 items-center justify-center bg-black/5 text-xs text-black/40">CHX</span>
                          )}
                          <span className="min-w-0">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-black/40">
                              {item.collection || "CHRONOX"}{item.model ? ` · ${item.model}` : ""}
                            </span>
                            <span className="mt-1 block text-sm font-bold uppercase text-black">{item.name || "CHRONOX Watch"}</span>
                            <span className="mt-1 block text-xs text-black/60">Quantity: {item.quantity || 1}</span>
                            <span className="mt-2 block text-[10px] font-bold uppercase tracking-wider text-black/50">
                              {isExpanded ? "Hide tracking" : "Click to track order"}
                            </span>
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-3 text-right">
                          <span className="text-sm font-bold">{formatCurrency(Number(item.price || 0) * (Number(item.quantity) || 1))}</span>
                          <ChevronDown size={17} className={`text-black/45 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        </span>
                      </button>
                    ))}
                  </div>

                  {isExpanded && renderTracking(order)}

                  {order.shipping && (
                    <div className="border-t border-black/5 bg-[#fdfdfd] px-5 py-3 text-[11px] text-black/60 sm:px-6">
                      <span className="font-semibold text-black">Delivering to: </span>
                      {order.shipping.fullName}, {order.shipping.address}, {order.shipping.city} - {order.shipping.postalCode}
                      {order.shipping.phone ? ` · Phone: ${order.shipping.phone}` : ""}
                      {order.paymentMethod ? ` · Payment: ${order.paymentMethod}` : ""}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default Orders;
