import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Package, Clock, CheckCircle2 } from "lucide-react";

import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { useAuth } from "../context/AuthContext";

function Orders() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (user?.id) {
      try {
        const raw =
          localStorage.getItem(`chronox_orders_${user.id}`) ||
          localStorage.getItem(`orders_${user.id}`);
        if (raw) {
          setOrders(JSON.parse(raw));
        }
      } catch (err) {
        console.error("Failed to load orders:", err);
      }
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-[#f4f4f2] text-black">
      <header className="relative z-50 border-b border-black/10 bg-white">
        <Navbar />
      </header>

      <main className="mx-auto max-w-[1600px] px-6 py-12 md:px-10 lg:px-16">
        <div className="mb-10 flex items-center justify-between border-b border-black/10 pb-6">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-[-0.04em]">
              YOUR ORDERS
            </h1>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.15em] text-black/50">
              Order history & delivery tracking
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-black/50 transition hover:text-black"
          >
            Explore Watches
            <ArrowRight size={13} />
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-16 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-black/10 bg-white shadow-sm">
              <Package size={28} strokeWidth={1.2} className="text-black/40" />
            </div>

            <h2 className="text-2xl font-bold uppercase tracking-tight text-black md:text-3xl">
              No orders placed yet.
            </h2>

            <p className="mt-3 max-w-sm text-xs leading-relaxed text-black/50">
              When you purchase a timepiece, your order confirmation and tracking details will appear here.
            </p>

            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="mt-8 flex items-center gap-3 rounded-full bg-black px-8 py-4 text-[10px] font-bold uppercase tracking-[0.15em] text-white shadow-md transition hover:bg-[#222] active:scale-95"
            >
              Discover Watches
              <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm"
              >
                {/* Order Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 bg-[#fafafa] px-6 py-4">
                  <div className="flex flex-wrap items-center gap-6 text-xs">
                    <div>
                      <span className="block text-[9px] font-bold uppercase tracking-wider text-black/40">
                        Order ID
                      </span>
                      <span className="font-bold text-black">{order.id}</span>
                    </div>

                    <div>
                      <span className="block text-[9px] font-bold uppercase tracking-wider text-black/40">
                        Date Placed
                      </span>
                      <span className="font-medium text-black">
                        {new Date(order.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[9px] font-bold uppercase tracking-wider text-black/40">
                        Total Amount
                      </span>
                      <span className="font-bold text-black">
                        ₹{Number(order.total || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-black">
                    <CheckCircle2 size={13} />
                    <span>{order.status || "Confirmed"}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="divide-y divide-black/5 px-6 py-4">
                  {order.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-4"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-16 w-16 object-contain"
                        />
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-black/40">
                            {item.collection || "CHRONOX"} · {item.model}
                          </p>
                          <h4 className="text-sm font-bold uppercase text-black">
                            {item.name}
                          </h4>
                          <p className="text-xs text-black/60">
                            Quantity: {item.quantity || 1}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-bold">
                          ₹{Number(item.price || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Delivery Address */}
                {order.shipping && (
                  <div className="border-t border-black/5 bg-[#fdfdfd] px-6 py-3 text-[11px] text-black/60">
                    <span className="font-semibold text-black">Delivering to: </span>
                    {order.shipping.fullName}, {order.shipping.address}, {order.shipping.city} - {order.shipping.postalCode}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default Orders;
