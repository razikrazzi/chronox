import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowRight, Heart, Trash2, ShoppingBag, Check } from "lucide-react";

import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { removeFromWishlist } from "../redux/slices/wishlistSlice";
import { addToCart } from "../redux/slices/cartSlice";

function Wishlist() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const wishlistItems = useSelector((state) => state.wishlist?.items || []);
  const [addedItems, setAddedItems] = useState({});

  const handleAddToCart = (product) => {
    dispatch(addToCart(product));
    setAddedItems((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [product.id]: false }));
    }, 1500);
  };

  const handleRemove = (productId) => {
    dispatch(removeFromWishlist(productId));
  };

  return (
    <div className="min-h-screen bg-[#f4f4f2] text-black">
      {/* Header / Navbar */}
      <header className="relative z-50 border-b border-black/10 bg-white">
        <Navbar />
      </header>

      <main className="mx-auto max-w-[1600px] px-6 py-12 md:px-10 lg:px-16">
        {/* Page Title */}
        <div className="mb-12 flex flex-col justify-between gap-4 border-b border-black/10 pb-8 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black uppercase tracking-[-0.04em] sm:text-4xl md:text-5xl">
                WISHLIST
              </h1>
              <span className="rounded-full border border-black/15 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-black">
                {wishlistItems.length} {wishlistItems.length === 1 ? "Item" : "Items"}
              </span>
            </div>
            <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-black/50">
              Your saved timepieces
            </p>
          </div>

          {wishlistItems.length > 0 && (
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-black/60 transition hover:text-black"
            >
              Continue Browsing
              <ArrowRight size={13} />
            </button>
          )}
        </div>

        {/* Empty State */}
        {wishlistItems.length === 0 ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-16 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-black/10 bg-white shadow-sm">
              <Heart size={28} strokeWidth={1.2} className="text-black/40" />
            </div>

            <h2 className="text-2xl font-bold uppercase tracking-tight text-black md:text-3xl">
              Your wishlist is empty.
            </h2>

            <p className="mt-3 max-w-sm text-xs leading-relaxed text-black/50">
              Save your favorite timepieces to revisit them anytime and track your coveted selections.
            </p>

            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="mt-8 flex items-center gap-3 rounded-full bg-black px-8 py-4 text-[10px] font-bold uppercase tracking-[0.15em] text-white shadow-md transition hover:bg-[#222] active:scale-95"
            >
              Explore Watches
              <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          /* Wishlist Items Grid */
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {wishlistItems.map((product) => (
              <div
                key={product.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-black/10 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-black/25 hover:shadow-md"
              >
                {/* Remove Quick Button */}
                <button
                  type="button"
                  onClick={() => handleRemove(product.id)}
                  aria-label="Remove timepiece"
                  className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-white/90 text-black/40 backdrop-blur-sm transition hover:border-black/30 hover:bg-black hover:text-white"
                >
                  <Trash2 size={13} strokeWidth={1.5} />
                </button>

                {/* Product Image Area */}
                <div
                  onClick={() => {
                    navigate(`/product/${product.id}`);
                    window.scrollTo(0, 0);
                  }}
                  className="relative flex h-60 w-full cursor-pointer items-center justify-center overflow-hidden py-4"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-48 w-48 object-contain transition-transform duration-700 group-hover:scale-105"
                  />
                </div>

                {/* Details */}
                <div className="mt-4 flex flex-1 flex-col justify-between border-t border-black/5 pt-4">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-black/40">
                      {product.collection || "CHRONOX"} · {product.model}
                    </p>

                    <h3
                      onClick={() => {
                        navigate(`/product/${product.id}`);
                        window.scrollTo(0, 0);
                      }}
                      className="mt-1.5 cursor-pointer text-sm font-semibold uppercase tracking-wide text-black transition hover:text-black/70"
                    >
                      {product.name}
                    </h3>

                    <p className="mt-3 text-base font-bold tracking-tight text-black">
                      ₹{Number(product.price || 0).toLocaleString("en-IN")}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddToCart(product)}
                      className={`
                        flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-[10px] font-bold uppercase tracking-[0.12em] transition-all
                        ${
                          addedItems[product.id]
                            ? "bg-black text-white"
                            : "bg-black text-white hover:bg-[#222] active:scale-95"
                        }
                      `}
                    >
                      {addedItems[product.id] ? (
                        <>
                          <Check size={12} strokeWidth={2.5} />
                          Added
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={12} strokeWidth={1.5} />
                          Add to Cart
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemove(product.id)}
                      className="flex items-center justify-center rounded-full border border-black/15 bg-white px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-black transition hover:bg-black/5 active:scale-95"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default Wishlist;
