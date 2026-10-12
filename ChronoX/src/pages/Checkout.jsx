import { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Truck,
} from "lucide-react";

import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { useAuth } from "../context/AuthContext";
import { clearCart } from "../redux/slices/cartSlice";

function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { user } = useAuth();

  // Normal Redux cart
  const cartItems = useSelector(
    (state) => state.cart?.items || []
  );

  // Product coming from "Buy Now"
  const buyNowItem = location.state?.buyNowItem || null;

  /*
    If Buy Now was clicked:
      checkoutItems = only the selected product

    If user came from Cart:
      checkoutItems = all cart products
  */
  const checkoutItems = buyNowItem
    ? [buyNowItem]
    : cartItems;

  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    address: "",
    city: "",
    postalCode: "",
    phone: "",
    paymentMethod: "card",
  });

  const [error, setError] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState("");

  // Calculate subtotal from the products being checked out
  const subtotal = useMemo(() => {
    return checkoutItems.reduce((acc, item) => {
      return (
        acc +
        (Number(item.price) || 0) *
          (Number(item.quantity) || 1)
      );
    }, 0);
  }, [checkoutItems]);

  const total = subtotal;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    setError("");

    // Full name validation
    if (!formData.fullName.trim()) {
      setError("Please provide your full name.");
      return;
    }

    // Address validation
    if (!formData.address.trim()) {
      setError("Please provide your delivery address.");
      return;
    }

    // City validation
    if (!formData.city.trim()) {
      setError("Please provide your city.");
      return;
    }

    // Postal code validation
    if (!formData.postalCode.trim()) {
      setError("Please provide your postal code.");
      return;
    }

    // Phone validation
    if (!formData.phone.trim()) {
      setError("Please provide your contact number.");
      return;
    }

    // Checkout items validation
    if (checkoutItems.length === 0) {
      setError(
        "Your cart is empty. Please add items before checking out."
      );
      return;
    }

    // Generate order ID
    const orderId = `CHX-${Math.floor(
      100000 + Math.random() * 900000
    )}`;

    // Create order
    const newOrder = {
      id: orderId,
      date: new Date().toISOString(),

      // IMPORTANT:
      // Save only the products being checked out
      items: [...checkoutItems],

      total,
      shipping: formData,
      status: "Confirmed",
    };

    // Save order to user's localStorage
    if (user?.id) {
      const storageKey = `chronox_orders_${user.id}`;
      const legacyKey = `orders_${user.id}`;

      try {
        const existingRaw =
          localStorage.getItem(storageKey) ||
          localStorage.getItem(legacyKey);

        const existingOrders = existingRaw
          ? JSON.parse(existingRaw)
          : [];

        const updatedOrders = [
          newOrder,
          ...existingOrders,
        ];

        localStorage.setItem(
          storageKey,
          JSON.stringify(updatedOrders)
        );

        localStorage.setItem(
          legacyKey,
          JSON.stringify(updatedOrders)
        );
      } catch (err) {
        console.error(
          "Failed to save order:",
          err
        );
      }
    }

    /*
      IMPORTANT:

      If this is a normal Cart checkout,
      clear the Redux cart.

      If this is Buy Now,
      DON'T clear the cart because the Buy Now
      product was never added to the cart.
    */
    if (!buyNowItem) {
      dispatch(clearCart());
    }

    setPlacedOrderId(orderId);
    setOrderPlaced(true);
  };

  // ============================================
  // ORDER CONFIRMED
  // ============================================

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-[#f4f4f2] text-black">
        <header className="relative z-50 border-b border-black/10 bg-white">
          <Navbar />
        </header>

        <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 py-20 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-black text-white">
            <CheckCircle2
              size={36}
              strokeWidth={1.5}
            />
          </div>

          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">
            Order Confirmed
          </p>

          <h1 className="mt-2 text-3xl font-black uppercase tracking-tight sm:text-4xl">
            THANK YOU FOR YOUR PURCHASE
          </h1>

          <p className="mt-3 text-xs leading-relaxed text-black/60">
            Order reference{" "}
            <span className="font-bold text-black">
              {placedOrderId}
            </span>{" "}
            has been confirmed. A concierge will prepare
            your timepiece for insured complimentary
            delivery.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate("/orders")}
              className="rounded-full bg-black px-7 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#222]"
            >
              View My Orders
            </button>

            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="rounded-full border border-black/15 bg-white px-7 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-black transition hover:bg-black/5"
            >
              Back to Collection
            </button>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // ============================================
  // CHECKOUT PAGE
  // ============================================

  return (
    <div className="min-h-screen bg-[#f4f4f2] text-black">
      <header className="relative z-50 border-b border-black/10 bg-white">
        <Navbar />
      </header>

      <main className="mx-auto max-w-[1600px] px-6 py-12 md:px-10 lg:px-16">
        <div className="mb-10 flex items-center justify-between border-b border-black/10 pb-6">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-[-0.04em]">
              CHECKOUT
            </h1>

            <p className="mt-1 text-xs font-medium uppercase tracking-[0.15em] text-black/50">
              Complete your acquisition
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/cart")}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-black/50 transition hover:text-black"
          >
            <ArrowLeft size={13} />
            Back to Cart
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-8 rounded-xl border border-black/10 bg-white p-4 text-center text-xs font-semibold text-black shadow-sm">
            {error}
          </div>
        )}

        <div className="grid gap-12 lg:grid-cols-[1fr_420px]">
          {/* ======================================
              LEFT: SHIPPING + PAYMENT
          ====================================== */}

          <form
            onSubmit={handlePlaceOrder}
            className="space-y-10"
          >
            {/* Delivery Details */}
            <div className="rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
              <h2 className="mb-6 text-xs font-black uppercase tracking-[0.2em] text-black">
                1. Delivery Details
              </h2>

              <div className="grid gap-5 sm:grid-cols-2">
                {/* Full Name */}
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-black/70">
                    Full Name
                  </label>

                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="h-11 w-full rounded-lg border border-black/15 bg-[#f7f7f7] px-4 text-sm outline-none focus:border-black focus:bg-white"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-black/70">
                    Email Address
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="h-11 w-full rounded-lg border border-black/15 bg-[#f7f7f7] px-4 text-sm outline-none focus:border-black focus:bg-white"
                  />
                </div>

                {/* Address */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-black/70">
                    Street Address
                  </label>

                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="House / Apartment number, Street name"
                    className="h-11 w-full rounded-lg border border-black/15 bg-[#f7f7f7] px-4 text-sm outline-none focus:border-black focus:bg-white"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-black/70">
                    City
                  </label>

                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="h-11 w-full rounded-lg border border-black/15 bg-[#f7f7f7] px-4 text-sm outline-none focus:border-black focus:bg-white"
                  />
                </div>

                {/* Postal Code */}
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-black/70">
                    Postal Code
                  </label>

                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    className="h-11 w-full rounded-lg border border-black/15 bg-[#f7f7f7] px-4 text-sm outline-none focus:border-black focus:bg-white"
                  />
                </div>

                {/* Phone */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-black/70">
                    Contact Phone Number
                  </label>

                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="h-11 w-full rounded-lg border border-black/15 bg-[#f7f7f7] px-4 text-sm outline-none focus:border-black focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
              <h2 className="mb-6 text-xs font-black uppercase tracking-[0.2em] text-black">
                2. Payment Method
              </h2>

              <div className="space-y-3">
                {[
                  {
                    id: "card",
                    label: "Credit / Debit Card (Visa, MasterCard, Amex)",
                  },
                  {
                    id: "upi",
                    label: "UPI (Google Pay, PhonePe, Paytm)",
                  },
                  {
                    id: "netbanking",
                    label: "Net Banking",
                  },
                  {
                    id: "cod",
                    label: "Cash on Delivery (Courier Assisted)",
                  },
                ].map((method) => (
                  <label
                    key={method.id}
                    className={`
                      flex cursor-pointer items-center justify-between rounded-xl border p-4 transition
                      ${
                        formData.paymentMethod ===
                        method.id
                          ? "border-black bg-black/5 font-semibold"
                          : "border-black/10 hover:border-black/30"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={
                          formData.paymentMethod ===
                          method.id
                        }
                        onChange={handleChange}
                        className="h-4 w-4 accent-black"
                      />

                      <span className="text-xs text-black">
                        {method.label}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Place Order */}
            <button
              type="submit"
              className="w-full rounded-full bg-black py-4 text-[10px] font-bold uppercase tracking-[0.16em] text-white shadow-md transition hover:bg-[#222] active:scale-95"
            >
              PLACE ORDER · ₹
              {total.toLocaleString("en-IN")}
            </button>
          </form>

          {/* ======================================
              RIGHT: ORDER SUMMARY
          ====================================== */}

          <div>
            <div className="sticky top-24 rounded-2xl border border-black/10 bg-white p-7 shadow-sm">
              <h2 className="border-b border-black/10 pb-4 text-xs font-black uppercase tracking-[0.2em] text-black">
                Summary ({checkoutItems.length}{" "}
                {checkoutItems.length === 1
                  ? "item"
                  : "items"}
                )
              </h2>

              <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
                {checkoutItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 border-b border-black/5 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-12 w-12 object-contain"
                      />

                      <div>
                        <p className="text-xs font-bold uppercase">
                          {item.name}
                        </p>

                        <p className="text-[10px] text-black/50">
                          Qty:{" "}
                          {item.quantity || 1}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-bold">
                      ₹
                      {(
                        Number(item.price || 0) *
                        (item.quantity || 1)
                      ).toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Summary */}
              <div className="mt-6 space-y-3 border-t border-black/10 pt-4 text-xs">
                <div className="flex justify-between text-black/60">
                  <span>Subtotal</span>

                  <span className="font-semibold text-black">
                    ₹
                    {subtotal.toLocaleString(
                      "en-IN"
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-black/60">
                  <span>Shipping</span>

                  <span className="font-semibold text-black">
                    Free
                  </span>
                </div>

                <div className="flex items-baseline justify-between border-t border-black/10 pt-3">
                  <span className="font-bold uppercase tracking-wider">
                    Total
                  </span>

                  <span className="text-xl font-black">
                    ₹
                    {total.toLocaleString(
                      "en-IN"
                    )}
                  </span>
                </div>
              </div>

              {/* Benefits */}
              <div className="mt-6 space-y-2 border-t border-black/10 pt-6 text-[10px] text-black/50">
                <div className="flex items-center gap-2">
                  <Truck size={13} />
                  <span>
                    Complimentary express delivery
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <ShieldCheck size={13} />
                  <span>
                    Full transit insurance included
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Checkout;