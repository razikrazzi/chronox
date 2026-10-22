import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Heart,
  ShoppingBag,
  Package,
  LogOut,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { useAuth } from "../context/AuthContext";
import { selectCartCount } from "../redux/slices/cartSlice";
import { selectWishlistCount } from "../redux/slices/wishlistSlice";

function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const cartCount = useSelector(selectCartCount);
  const wishlistCount = useSelector(selectWishlistCount);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#f4f4f2] text-black">
      <header className="relative z-50 border-b border-black/10 bg-white">
        <Navbar />
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12 md:px-10 lg:px-16">
        <div className="mb-10 flex items-center justify-between border-b border-black/10 pb-6">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-[-0.04em]">
              CLIENT PROFILE
            </h1>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.15em] text-black/50">
              Personal credentials & account overview
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-full border border-black/15 bg-white px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-black transition hover:bg-black hover:text-white"
          >
            <LogOut size={13} />
            Logout
          </button>
        </div>

        <div className="space-y-8">
          {/* User Details Card */}
          <div className="rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-black text-2xl font-bold uppercase text-white">
                {user?.name ? user.name.charAt(0) : "U"}
              </div>

              <div>
                <h2 className="text-xl font-bold uppercase tracking-tight text-black sm:text-2xl">
                  {user?.name || "Distinguished Client"}
                </h2>
                <p className="mt-1 text-xs text-black/60">{user?.email}</p>
                <div className="mt-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-black/40">
                  <ShieldCheck size={13} />
                  <span>Verified ChronoX Member · ID: {user?.id}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics & Links */}
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Wishlist */}
            <div
              onClick={() => navigate("/wishlist")}
              className="group cursor-pointer rounded-2xl border border-black/10 bg-white p-6 shadow-sm transition hover:border-black/30 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <Heart size={20} className="text-black/50 group-hover:text-black" />
                <ArrowRight size={14} className="text-black/30 transition group-hover:translate-x-1 group-hover:text-black" />
              </div>
              <p className="mt-6 text-2xl font-black">{wishlistCount}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-black/50">
                Wishlist Items
              </p>
            </div>

            {/* Cart */}
            <div
              onClick={() => navigate("/cart")}
              className="group cursor-pointer rounded-2xl border border-black/10 bg-white p-6 shadow-sm transition hover:border-black/30 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <ShoppingBag size={20} className="text-black/50 group-hover:text-black" />
                <ArrowRight size={14} className="text-black/30 transition group-hover:translate-x-1 group-hover:text-black" />
              </div>
              <p className="mt-6 text-2xl font-black">{cartCount}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-black/50">
                Items in Cart
              </p>
            </div>

            {/* Orders */}
            <div
              onClick={() => navigate("/orders")}
              className="group cursor-pointer rounded-2xl border border-black/10 bg-white p-6 shadow-sm transition hover:border-black/30 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <Package size={20} className="text-black/50 group-hover:text-black" />
                <ArrowRight size={14} className="text-black/30 transition group-hover:translate-x-1 group-hover:text-black" />
              </div>
              <p className="mt-6 text-2xl font-black">→</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-black/50">
                Order History
              </p>
            </div>
          </div>

          {/* Account Actions */}
          <div className="rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-black">
              Account Preferences
            </h3>

            <div className="mt-6 divide-y divide-black/5 text-xs">
              <div className="flex items-center justify-between py-3">
                <span className="text-black/70">Membership Status</span>
                <span className="font-semibold text-black">Premier Horology Member</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-black/70">Personal Concierge</span>
                <span className="font-semibold text-black">Active · 24/7 Priority</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-black/70">Express Delivery Preference</span>
                <span className="font-semibold text-black">Secured Armored Courier</span>
              </div>
            </div>

            <div className="mt-8 border-t border-black/10 pt-6">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-full border border-black/20 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-black transition hover:bg-black hover:text-white"
              >
                Sign Out of This Session
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Profile;
