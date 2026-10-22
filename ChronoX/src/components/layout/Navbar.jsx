import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Menu,
  Heart,
  UserRound,
  ShoppingBag,
  LogOut,
  X,
  Package,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { selectCartCount } from "../../redux/slices/cartSlice";
import { selectWishlistCount } from "../../redux/slices/wishlistSlice";

const navLinks = [
  {
    name: "Watches",
    path: "/dashboard",
  },
  {
    name: "Warranty & Service",
    path: "/service",
  },
  {
    name: "Orders",
    path: "/orders",
  },
];

function Navbar({ dark = false }) {
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Redux Cart count (total quantity)
  const cartCount = useSelector(selectCartCount);

  // Redux Wishlist count
  const wishlistCount = useSelector(selectWishlistCount);

  const textColor = dark ? "text-white" : "text-black";
  const mutedColor = dark ? "text-white/80" : "text-black/80";
  const navColor = dark ? "text-white/50" : "text-black/50";
  const hoverColor = dark ? "hover:text-white" : "hover:text-black";

  const handleWishlistClick = () => {
    if (!isLoggedIn) {
      navigate("/login", { state: { from: "/wishlist" } });
    } else {
      navigate("/wishlist");
    }
  };

  const handleCartClick = () => {
    if (!isLoggedIn) {
      navigate("/login", { state: { from: "/cart" } });
    } else {
      navigate("/cart");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="absolute left-0 top-0 z-50 w-full">
      <nav className="mx-auto flex items-center justify-between px-6 py-7 lg:px-12">
        {/* LEFT */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link
            to="/"
            className={`
              text-xl
              font-medium
              tracking-[-0.04em]
              ${textColor}
            `}
          >
            CHRONOX
          </Link>

          {/* Mobile Menu Trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className={`
              ${mutedColor}
              transition
              ${hoverColor}
              lg:hidden
            `}
            aria-label="Open menu"
          >
            <Menu size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* CENTER NAVIGATION */}
        <div className="hidden items-center gap-10 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`
                text-[10px]
                font-medium
                uppercase
                tracking-[0.08em]
                ${navColor}
                transition
                ${hoverColor}
              `}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Wishlist */}
          <button
            type="button"
            onClick={handleWishlistClick}
            aria-label="Wishlist"
            className={`
              relative
              p-2
              ${mutedColor}
              transition
              ${hoverColor}
            `}
          >
            <Heart size={18} strokeWidth={1.5} />

            <span
              className={`
                absolute
                -right-0.5
                -top-0.5
                flex
                h-3.5
                w-3.5
                items-center
                justify-center
                rounded-full
                ${
                  dark
                    ? "bg-white text-black font-bold"
                    : "bg-black text-white font-bold"
                }
                text-[7px]
              `}
            >
              {wishlistCount}
            </span>
          </button>

          {/* Cart */}
          <button
            type="button"
            onClick={handleCartClick}
            aria-label="Shopping cart"
            className={`
              relative
              p-2
              ${mutedColor}
              transition
              ${hoverColor}
            `}
          >
            <ShoppingBag size={18} strokeWidth={1.5} />

            <span
              className={`
                absolute
                -right-0.5
                -top-0.5
                flex
                h-3.5
                w-3.5
                items-center
                justify-center
                rounded-full
                ${
                  dark
                    ? "bg-white text-black font-bold"
                    : "bg-black text-white font-bold"
                }
                text-[7px]
              `}
            >
              {cartCount}
            </span>
          </button>

          {/* User Auth Section */}
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              {user?.role === "admin" && (
                <Link
                  to="/admin"
                  className={`
                    rounded-full border px-3 py-1 text-[9px] font-bold uppercase tracking-wider
                    ${
                      dark
                        ? "border-white/30 text-white hover:bg-white hover:text-black"
                        : "border-black/20 text-black hover:bg-black hover:text-white"
                    }
                    transition
                  `}
                >
                  Admin
                </Link>
              )}

              <Link
                to="/profile"
                aria-label="Account Profile"
                className={`
                  flex items-center gap-2 rounded-full border p-1.5 px-3
                  ${
                    dark
                      ? "border-white/20 text-white hover:bg-white/10"
                      : "border-black/15 text-black hover:bg-black/5"
                  }
                  transition
                `}
              >
                <UserRound size={15} strokeWidth={1.5} />
                <span className="hidden text-[10px] font-bold uppercase tracking-wider md:inline">
                  {user?.name?.split(" ")[0] || "Profile"}
                </span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                aria-label="Logout"
                title="Sign out"
                className={`
                  p-2
                  ${mutedColor}
                  transition
                  ${hoverColor}
                `}
              >
                <LogOut size={16} strokeWidth={1.5} />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className={`
                rounded-full border px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider
                ${
                  dark
                    ? "border-white/30 text-white hover:bg-white hover:text-black"
                    : "border-black/20 text-black hover:bg-black hover:text-white"
                }
                transition
              `}
            >
              LOGIN
            </Link>
          )}
        </div>
      </nav>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-sm lg:hidden">
          <div className="relative flex h-full w-80 max-w-[85vw] flex-col justify-between bg-white p-6 shadow-2xl">
            <div>
              <div className="flex items-center justify-between border-b border-black/10 pb-5">
                <span className="text-lg font-bold tracking-tight text-black">
                  CHRONOX
                </span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-full p-1 text-black/60 hover:text-black"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mt-8 flex flex-col space-y-4">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs font-bold uppercase tracking-wider text-black"
                >
                  Home
                </Link>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs font-bold uppercase tracking-wider text-black"
                >
                  Watches
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleWishlistClick();
                  }}
                  className="flex items-center justify-between text-left text-xs font-bold uppercase tracking-wider text-black"
                >
                  <span>Wishlist</span>
                  <span className="rounded-full bg-black/5 px-2 py-0.5 text-[9px] text-black">
                    {wishlistCount}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleCartClick();
                  }}
                  className="flex items-center justify-between text-left text-xs font-bold uppercase tracking-wider text-black"
                >
                  <span>Cart</span>
                  <span className="rounded-full bg-black/5 px-2 py-0.5 text-[9px] text-black">
                    {cartCount}
                  </span>
                </button>

                {isLoggedIn && (
                  <>
                    {user?.role === "admin" && (
                      <Link
                        to="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-xs font-bold uppercase tracking-wider text-black"
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <Link
                      to="/orders"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-xs font-bold uppercase tracking-wider text-black"
                    >
                      Orders
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-xs font-bold uppercase tracking-wider text-black"
                    >
                      Profile
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="border-t border-black/10 pt-5">
              {isLoggedIn ? (
                <div className="space-y-3">
                  <div className="text-[11px] text-black/60">
                    Signed in as <span className="font-semibold text-black">{user?.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full rounded-full border border-black/20 py-2.5 text-[10px] font-bold uppercase tracking-wider text-black hover:bg-black hover:text-white transition"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full rounded-full bg-black py-3 text-center text-[10px] font-bold uppercase tracking-wider text-white"
                >
                  Login / Register
                </Link>
              )}
            </div>
          </div>
          <div
            className="flex-1"
            onClick={() => setMobileMenuOpen(false)}
          />
        </div>
      )}
    </header>
  );
}

export default Navbar;