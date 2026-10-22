import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ShieldCheck,
  Truck,
} from "lucide-react";

import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

import {
  removeFromCart,
  increaseQuantity,
  decreaseQuantity,
  clearCart,
  selectCartItems,
  selectCartSubtotal,
  selectCartTotal,
  selectCartCount,
} from "../redux/slices/cartSlice";

function Cart() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const cartItems = useSelector(selectCartItems);
  const subtotal = useSelector(selectCartSubtotal);
  const total = useSelector(selectCartTotal);
  const cartCount = useSelector(selectCartCount);

  const formatPrice = (val) => `₹${Number(val).toLocaleString("en-IN")}`;

  // Empty Cart State
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#f4f4f2] text-black">
        <header className="relative z-50 border-b border-black/10 bg-white">
          <Navbar />
        </header>

        <main className="mx-auto flex min-h-[70vh] max-w-[1600px] flex-col items-center justify-center px-6 py-20 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-black/10 bg-white shadow-sm">
            <ShoppingBag size={28} strokeWidth={1.2} className="text-black/40" />
          </div>

          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">
            Your Selection
          </p>

          <h1 className="text-3xl font-black uppercase tracking-tight sm:text-4xl md:text-5xl">
            YOUR CART IS EMPTY
          </h1>

          <p className="mt-3 max-w-sm text-xs leading-relaxed text-black/50">
            Discover your next timepiece.
          </p>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="mt-8 flex items-center gap-3 rounded-full bg-black px-8 py-4 text-[10px] font-bold uppercase tracking-[0.15em] text-white shadow-md transition hover:bg-[#222] active:scale-95"
          >
            SHOP WATCHES
            <ArrowRight size={14} />
          </button>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f4f2] text-black">
      {/* Navbar */}
      <header className="relative z-50 border-b border-black/10 bg-white">
        <Navbar />
      </header>

      <main className="mx-auto max-w-[1600px] px-6 py-12 md:px-10 lg:px-16">
        {/* Header */}
        <div className="mb-10 flex flex-col justify-between gap-4 border-b border-black/10 pb-8 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black uppercase tracking-[-0.04em] sm:text-4xl md:text-5xl">
                SHOPPING CART
              </h1>
              <span className="rounded-full border border-black/15 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-black">
                {cartCount} {cartCount === 1 ? "Item" : "Items"}
              </span>
            </div>
            <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-black/50">
              Review your selected timepieces before proceeding to checkout
            </p>
          </div>

          <button
            type="button"
            onClick={() => dispatch(clearCart())}
            className="text-[10px] font-bold uppercase tracking-[0.15em] text-black/40 transition hover:text-black"
          >
            Clear Cart
          </button>
        </div>

        {/* 2-Column Layout */}
        <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
          {/* LEFT: Cart Items */}
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-6 rounded-2xl border border-black/10 bg-white p-6 shadow-sm transition hover:border-black/20 sm:flex-row sm:items-center sm:justify-between"
              >
                {/* Image & Info */}
                <div className="flex items-center gap-6">
                  <div
                    onClick={() => {
                      navigate(`/product/${item.id}`);
                      window.scrollTo(0, 0);
                    }}
                    className="relative flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-[#f7f7f7] p-2 transition hover:opacity-90 sm:h-28 sm:w-28"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-contain"
                    />
                  </div>

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-black/40">
                      {item.collection || "CHRONOX"} · {item.model}
                    </p>

                    <h3
                      onClick={() => {
                        navigate(`/product/${item.id}`);
                        window.scrollTo(0, 0);
                      }}
                      className="mt-1 cursor-pointer text-sm font-semibold uppercase tracking-wide text-black transition hover:text-black/70"
                    >
                      {item.name}
                    </h3>

                    <p className="mt-2 text-sm font-bold tracking-tight text-black">
                      {formatPrice(item.price)}
                    </p>
                  </div>
                </div>

                {/* Quantity Controls & Remove */}
                <div className="flex items-center justify-between gap-6 border-t border-black/5 pt-4 sm:border-t-0 sm:pt-0">
                  <div className="flex items-center rounded-full border border-black/15 bg-white p-1">
                    <button
                      type="button"
                      onClick={() => dispatch(decreaseQuantity(item.id))}
                      disabled={item.quantity <= 1}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-black/60 transition hover:bg-black/5 hover:text-black disabled:opacity-30"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={13} strokeWidth={2} />
                    </button>

                    <span className="w-8 text-center text-xs font-bold text-black">
                      {item.quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() => dispatch(increaseQuantity(item.id))}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-black/60 transition hover:bg-black/5 hover:text-black"
                      aria-label="Increase quantity"
                    >
                      <Plus size={13} strokeWidth={2} />
                    </button>
                  </div>

                  {/* Subtotal for Item */}
                  <div className="text-right">
                    <p className="text-sm font-black tracking-tight text-black">
                      {formatPrice(Number(item.price || 0) * (item.quantity || 1))}
                    </p>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => dispatch(removeFromCart(item.id))}
                    aria-label="Remove item"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-black/35 transition hover:bg-black/5 hover:text-black"
                  >
                    <Trash2 size={15} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT: Order Summary */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="rounded-2xl border border-black/10 bg-white p-7 shadow-sm">
              <h2 className="border-b border-black/10 pb-4 text-xs font-black uppercase tracking-[0.2em] text-black">
                ORDER SUMMARY
              </h2>

              <div className="mt-6 space-y-4 text-xs">
                <div className="flex justify-between text-black/60">
                  <span>Subtotal</span>
                  <span className="font-semibold text-black">{formatPrice(subtotal)}</span>
                </div>

                <div className="flex justify-between text-black/60">
                  <span>Shipping</span>
                  <span className="font-semibold text-black">Free</span>
                </div>

                <div className="border-t border-black/10 pt-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-black">
                      Total
                    </span>
                    <span className="text-xl font-black tracking-tight text-black">
                      {formatPrice(total)}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-black/40">
                    Includes all applicable taxes and complimentary insurance
                  </p>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                type="button"
                onClick={() => navigate("/checkout")}
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-black py-4 text-[10px] font-bold uppercase tracking-[0.16em] text-white shadow-md transition hover:bg-[#222] active:scale-95"
              >
                CHECKOUT
                <ArrowRight size={14} />
              </button>

              {/* Trust Badges */}
              <div className="mt-6 space-y-3 border-t border-black/10 pt-6 text-[10px] text-black/50">
                <div className="flex items-center gap-2">
                  <Truck size={14} strokeWidth={1.4} />
                  <span>Complimentary Insured Worldwide Shipping</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} strokeWidth={1.4} />
                  <span>2-Year International Manufacturer Warranty</span>
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

export default Cart;