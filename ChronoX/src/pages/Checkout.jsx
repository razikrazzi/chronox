import { useState, useMemo, useRef, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Truck,
  Tag,
  Check,
  X,
} from "lucide-react";

import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { useAuth } from "../context/AuthContext";
import { clearCart } from "../redux/slices/cartSlice";
import {
  normalizeCoupon,
  isCouponExpired,
  calculateCheckoutDiscount,
  validateCoupon,
  formatExpiryDate,
} from "../utils/couponUtils";

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

  // Hydrate coupon passed from ProductDetails (Buy Now) if present
  const initialCoupon = location.state?.appliedCoupon || null;
  const [appliedCoupon, setAppliedCoupon] = useState(initialCoupon);
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [availableOffers, setAvailableOffers] = useState([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [offersError, setOffersError] = useState("");

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
  const [placedOrderData, setPlacedOrderData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const submissionLock = useRef(false);

  // Preserve confirmation only for this exact checkout navigation. If the
  // user starts a new checkout, React Router gives it a new location.key and
  // the previous confirmation will not be shown.
  useEffect(() => {
    const markerKey = "chronox_checkout_confirmation";
    try {
      const saved = sessionStorage.getItem(markerKey);
      if (!saved) return;

      const confirmation = JSON.parse(saved);
      if (confirmation.locationKey === location.key && confirmation.orderId) {
        setPlacedOrderId(String(confirmation.orderId));
        setPlacedOrderData(confirmation);
        setOrderPlaced(true);
      } else {
        sessionStorage.removeItem(markerKey);
        setOrderPlaced(false);
        setPlacedOrderId("");
        setPlacedOrderData(null);
        setError("");
        setSubmitting(false);
        submissionLock.current = false;
      }
    } catch (storageError) {
      sessionStorage.removeItem(markerKey);
      setOrderPlaced(false);
      setPlacedOrderId("");
      setPlacedOrderData(null);
    }
  }, [location.key]);

  // Dynamically load active offers and revalidate any initial coupon
  useEffect(() => {
    let active = true;

    async function loadOffers() {
      setLoadingOffers(true);
      setOffersError("");
      try {
        const response = await axios.get("http://localhost:3000/offers");
        if (!active) return;
        const fetchedOffers = Array.isArray(response.data) ? response.data : [];
        setAvailableOffers(fetchedOffers);

        // If a coupon was previously passed, revalidate against server offers & checkout items
        if (initialCoupon) {
          const validation = validateCoupon(initialCoupon.code, fetchedOffers, {
            items: checkoutItems,
          });

          if (validation.valid) {
            setAppliedCoupon(validation.coupon);
            setCouponSuccess(validation.message);
            setCouponError("");
          } else {
            setAppliedCoupon(null);
            setCouponError(
              `Coupon "${initialCoupon.code}" could not be applied: ${validation.message}`
            );
            setCouponSuccess("");
          }
        }
      } catch (err) {
        if (!active) return;
        console.error("Could not load offers during checkout:", err);
        setOffersError("Unable to load available offers.");
      } finally {
        if (active) setLoadingOffers(false);
      }
    }

    loadOffers();
    return () => {
      active = false;
    };
  }, [location.key]);

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

  // Filter available offers based on current checkout items
  const eligibleOffers = useMemo(() => {
    if (checkoutItems.length === 0 || availableOffers.length === 0) return [];
    return availableOffers
      .map(normalizeCoupon)
      .filter((coupon) => {
        if (!coupon) return false;
        if (coupon.status === "Paused" || isCouponExpired(coupon)) return false;
        const discountRes = calculateCheckoutDiscount(checkoutItems, coupon);
        return discountRes.eligible;
      });
  }, [availableOffers, checkoutItems]);

  // Dynamic discount calculation based on current checkout items and applied coupon
  const discountDetails = useMemo(() => {
    if (!appliedCoupon || checkoutItems.length === 0) {
      return { discountAmount: 0, finalAmount: subtotal, isService: false, eligible: false };
    }
    return calculateCheckoutDiscount(checkoutItems, appliedCoupon);
  }, [checkoutItems, appliedCoupon, subtotal]);

  const discountAmount = discountDetails.discountAmount || 0;
  const total = Math.max(0, subtotal - discountAmount);

  // Single unified validation function for both manual entry and coupon card clicks
  const applyCouponCode = (codeArg) => {
    setCouponError("");
    setCouponSuccess("");

    const code = String(codeArg || "").trim();
    if (!code) {
      setCouponError("Please enter a coupon code.");
      return;
    }

    if (appliedCoupon && appliedCoupon.code.toUpperCase() === code.toUpperCase()) {
      setCouponError("This coupon is already applied to your order.");
      return;
    }

    const result = validateCoupon(code, availableOffers, { items: checkoutItems });
    if (!result.valid) {
      setCouponError(result.message);
      return;
    }

    setAppliedCoupon(result.coupon);
    setCouponSuccess(
      result.isService
        ? "Complimentary privilege applied successfully!"
        : `Coupon applied successfully: Saved ₹${result.discountAmount.toLocaleString("en-IN")}`
    );
    setCouponInput("");
  };

  const handleApplyCoupon = (e) => {
    e?.preventDefault();
    applyCouponCode(couponInput);
  };

  const handleApplyOfferCard = (couponCode) => {
    applyCouponCode(couponCode);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError("");
    setCouponSuccess("Coupon removed from order.");
  };

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

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (submissionLock.current || submitting || orderPlaced) return;
    setError("");

    // Validate before locking so a validation error does not permanently lock checkout.
    if (!formData.fullName.trim()) return setError("Please provide your full name.");
    if (!formData.email.trim()) return setError("Please provide your email address.");
    if (!formData.address.trim()) return setError("Please provide your delivery address.");
    if (!formData.city.trim()) return setError("Please provide your city.");
    if (!formData.postalCode.trim()) return setError("Please provide your postal code.");
    if (!formData.phone.trim()) return setError("Please provide your contact number.");
    if (checkoutItems.length === 0) {
      return setError("Your cart is empty. Please add items before checking out.");
    }

    submissionLock.current = true;
    setSubmitting(true);

    const orderId = `CHX-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    // Merge duplicate entries for the same product into one order line.
    const itemMap = new Map();
    checkoutItems.forEach((item) => {
      const productId = String(item.productId ?? item.id);
      const key = productId;
      const quantity = Math.max(1, Number(item.quantity) || 1);
      const existing = itemMap.get(key);

      if (existing) {
        existing.quantity += quantity;
      } else {
        itemMap.set(key, {
          id: item.id,
          productId: item.productId ?? item.id,
          name: item.name || "CHRONOX Watch",
          image: item.image || "",
          collection: item.collection || item.category || "CHRONOX",
          model: item.model || "",
          price: Number(item.price) || 0,
          quantity,
        });
      }
    });
    const items = [...itemMap.values()];
    const orderOriginalTotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // Authoritative discount recalculation on the frontend before saving
    const serverDiscount = appliedCoupon
      ? calculateCheckoutDiscount(items, appliedCoupon)
      : { discountAmount: 0, finalAmount: orderOriginalTotal, isService: false };

    const calculatedDiscount = serverDiscount.discountAmount || 0;
    const finalOrderTotal = Math.max(0, orderOriginalTotal - calculatedDiscount);

    const newOrder = {
      id: orderId,
      userId: user?.id ?? null,
      userName: formData.fullName.trim(),
      customerName: formData.fullName.trim(),
      email: formData.email.trim(),
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      items,
      originalAmount: Number(orderOriginalTotal) || 0,
      discountAmount: Number(calculatedDiscount) || 0,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      couponId: appliedCoupon ? appliedCoupon.id : null,
      couponTitle: appliedCoupon ? appliedCoupon.title : null,
      total: Number(finalOrderTotal) || 0,
      totalAmount: Number(finalOrderTotal) || 0,
      shipping: {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        postalCode: formData.postalCode.trim(),
        phone: formData.phone.trim(),
      },
      paymentMethod: formData.paymentMethod,
      status: "Confirmed",
    };

    try {
      // Check for a very recent matching order before POSTing. This protects
      // against double clicks, retries, and duplicate submits from stale UI code.
      // The 2-minute window avoids blocking a later intentional purchase.
      const recentResponse = await axios.get("http://localhost:3000/orders");
      const existingOrders = Array.isArray(recentResponse.data) ? recentResponse.data : [];
      const now = Date.now();
      const normalize = (value) => String(value ?? "").trim().toLowerCase();
      const orderSignature = (order) => JSON.stringify({
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
      const currentSignature = orderSignature(newOrder);
      const recentDuplicate = existingOrders.find((order) => {
        const orderTime = new Date(order.createdAt || order.date || 0).getTime();
        return orderSignature(order) === currentSignature &&
          orderTime > 0 && now - orderTime >= 0 && now - orderTime < 2 * 60 * 1000;
      });

      // If the matching order already exists, treat it as placed instead of
      // creating a second JSON Server record.
      const savedOrder = recentDuplicate || (await axios.post("http://localhost:3000/orders", newOrder)).data;
      const confirmedId = String(savedOrder.id || orderId);

      // Keep the confirmation through a same-navigation remount/refresh, but
      // do not carry it into a later checkout navigation.
      try {
        sessionStorage.setItem(
          "chronox_checkout_confirmation",
          JSON.stringify({
            orderId: confirmedId,
            locationKey: location.key,
            couponCode: savedOrder.couponCode || null,
            discountAmount: savedOrder.discountAmount || 0,
            totalAmount: savedOrder.totalAmount ?? savedOrder.total ?? finalOrderTotal,
          }),
        );
      } catch (storageError) {
        console.warn("Could not preserve checkout confirmation:", storageError);
      }

      // Keep a local copy for compatibility with the existing app.
      if (user?.id) {
        const storageKey = `chronox_orders_${user.id}`;
        const legacyKey = `orders_${user.id}`;
        try {
          const raw = localStorage.getItem(storageKey) || localStorage.getItem(legacyKey);
          const existing = raw ? JSON.parse(raw) : [];
          const existingArray = Array.isArray(existing) ? existing : [];
          const updated = [
            savedOrder,
            ...existingArray.filter((order) => String(order.id) !== confirmedId),
          ];
          localStorage.setItem(storageKey, JSON.stringify(updated));
          localStorage.setItem(legacyKey, JSON.stringify(updated));
        } catch (storageError) {
          console.error("Order was saved to JSON Server, but localStorage backup failed:", storageError);
        }
      }

      if (!buyNowItem) dispatch(clearCart());
      setPlacedOrderId(confirmedId);
      setPlacedOrderData(savedOrder);
      setOrderPlaced(true);
    } catch (err) {
      console.error("Failed to save order to JSON Server:", err);
      setError(
        "Your order could not be saved. Make sure JSON Server is running at http://localhost:3000 and the /orders endpoint exists, then try again.",
      );
      submissionLock.current = false;
    } finally {
      setSubmitting(false);
    }
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
            YOUR ORDER HAS BEEN PLACED
          </h1>

          <p className="mt-3 text-xs leading-relaxed text-black/60">
            Order reference{" "}
            <span className="font-bold text-black">
              {placedOrderId}
            </span>{" "}
            has been placed successfully. Your order details and delivery address have been saved.
          </p>

          {placedOrderData?.couponCode && (
            <div className="mt-4 flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold text-black shadow-sm">
              <Tag size={13} className="text-black/60" />
              <span>Privilege {placedOrderData.couponCode} applied</span>
              {Number(placedOrderData.discountAmount) > 0 && (
                <span className="font-bold text-emerald-700">
                  (−₹{Number(placedOrderData.discountAmount).toLocaleString("en-IN")})
                </span>
              )}
            </div>
          )}

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
  <div
    role="alert"
    className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-50 px-4 py-3"
  >
    <svg
      className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="10" strokeWidth="2" />
      <path
        d="M12 8v4m0 4h.01"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>

    <p className="text-sm font-medium text-red-600">
      {error}
    </p>
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
              disabled={submitting || orderPlaced}
              className="w-full rounded-full bg-black py-4 text-[10px] font-bold uppercase tracking-[0.16em] text-white shadow-md transition hover:bg-[#222] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "PLACING YOUR ORDER..." : `PLACE ORDER · ₹${total.toLocaleString("en-IN")}`}
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

              {/* =====================================================
                  COUPON SECTION (APPLY A COUPON)
              ===================================================== */}
              <div className="mt-6 border-t border-black/10 pt-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-black">
                      APPLY A COUPON
                    </h3>
                    <p className="mt-0.5 text-[10px] text-black/50">
                      Unlock exclusive privileges on your timepiece.
                    </p>
                  </div>
                  {appliedCoupon && (
                    <span className="rounded-full border border-black/20 bg-black/5 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-black">
                      Applied
                    </span>
                  )}
                </div>

                {/* When coupon is applied */}
                {appliedCoupon ? (
                  <div className="mt-4 rounded-xl border border-black/15 bg-[#fafafa] p-4 text-xs shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tag size={13} className="text-black/70" />
                        <span className="font-mono text-xs font-bold uppercase tracking-wider text-black">
                          {appliedCoupon.code}
                        </span>
                        <span className="rounded-full bg-black px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white">
                          Applied
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-[10px] font-bold uppercase tracking-wider text-black/50 underline underline-offset-2 transition hover:text-black"
                      >
                        Remove Coupon
                      </button>
                    </div>

                    <p className="mt-1.5 text-xs font-medium text-black/70">
                      {appliedCoupon.title}
                    </p>

                    {discountDetails.isService ? (
                      <p className="mt-1.5 text-[11px] font-semibold text-emerald-700">
                        ✓ Complimentary Privilege Included
                      </p>
                    ) : (
                      <p className="mt-1.5 text-[11px] font-semibold text-emerald-700">
                        ✓ Discount Applied: Saved ₹{discountAmount.toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Manual Coupon Input */}
                    <form onSubmit={handleApplyCoupon} className="mt-4 flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => {
                          setCouponInput(e.target.value.toUpperCase());
                          if (couponError) setCouponError("");
                        }}
                        placeholder="Enter coupon code"
                        aria-label="Enter coupon code"
                        className="h-10 flex-1 rounded-lg border border-black/15 bg-[#f7f7f7] px-3 font-mono text-xs uppercase tracking-wider outline-none focus:border-black focus:bg-white"
                      />
                      <button
                        type="submit"
                        disabled={!couponInput.trim()}
                        className="rounded-lg bg-black px-4 text-[10px] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#222] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        APPLY
                      </button>
                    </form>

                    {/* Feedback Messages */}
                    {couponError && (
                      <p className="mt-2 text-[11px] font-medium text-red-600">
                        {couponError}
                      </p>
                    )}
                    {couponSuccess && (
                      <p className="mt-2 text-[11px] font-medium text-emerald-700">
                        {couponSuccess}
                      </p>
                    )}

                    {/* Available Offers */}
                    <div className="mt-5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/50">
                        AVAILABLE OFFERS
                      </p>

                      {/* Loading State */}
                      {loadingOffers && (
                        <p className="mt-2 text-[10px] uppercase tracking-wider text-black/40">
                          Loading available offers...
                        </p>
                      )}

                      {/* Error State */}
                      {offersError && !loadingOffers && (
                        <p className="mt-2 text-[10px] text-amber-700">
                          {offersError}
                        </p>
                      )}

                      {/* Empty State */}
                      {!loadingOffers && !offersError && eligibleOffers.length === 0 && (
                        <p className="mt-2 text-[11px] italic text-black/45">
                          No offers currently available for your selected items.
                        </p>
                      )}

                      {/* Eligible Offer Cards */}
                      {!loadingOffers && eligibleOffers.length > 0 && (
                        <div className="mt-2.5 max-h-56 space-y-2.5 overflow-y-auto pr-1">
                          {eligibleOffers.map((offer) => (
                            <div
                              key={offer.id || offer.code}
                              className="group relative rounded-xl border border-black/10 bg-[#fafafa] p-3.5 transition hover:border-black/30 hover:bg-white"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <h4 className="text-xs font-bold uppercase tracking-tight text-black">
                                    {offer.title}
                                  </h4>
                                  <p className="mt-0.5 text-xs font-black text-black">
                                    {offer.discount}
                                  </p>
                                  <p className="mt-1 font-mono text-[10px] font-semibold text-black/60">
                                    Code: <span className="font-bold text-black">{offer.code}</span>
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleApplyOfferCard(offer.code)}
                                  className="shrink-0 rounded-full bg-black px-3.5 py-1.5 text-[8px] font-bold uppercase tracking-wider text-white transition hover:bg-[#222] active:scale-95"
                                >
                                  APPLY COUPON
                                </button>
                              </div>

                              <div className="mt-2 flex items-center justify-between border-t border-black/5 pt-2 text-[9px] text-black/50">
                                <span>{offer.scope || "Eligible items"}</span>
                                <span>Valid until {formatExpiryDate(offer.validTill)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
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

                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-700">
                    <span className="flex items-center gap-1 font-medium">
                      <Tag size={11} />
                      Privilege ({appliedCoupon.code})
                    </span>

                    <span className="font-bold">
                      {discountDetails.isService
                        ? "Complimentary"
                        : `−₹${discountAmount.toLocaleString("en-IN")}`}
                    </span>
                  </div>
                )}

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

                  <div className="text-right">
                    <span className="text-xl font-black">
                      ₹
                      {total.toLocaleString(
                        "en-IN"
                      )}
                    </span>
                    {discountAmount > 0 && (
                      <p className="text-[10px] font-medium text-emerald-700">
                        You saved ₹{discountAmount.toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>
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