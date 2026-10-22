import { memo, useCallback, useState } from "react";
import { Heart, ShoppingBag, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useRequireAuth } from "../../hooks/useRequireAuth";

import {
  addWishlistItem,
  removeWishlistItem,
} from "../../redux/slices/wishlistSlice";

import { addToCart } from "../../redux/slices/cartSlice";

function ProductCard({ product }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { requireAuth } = useRequireAuth();

  const [justAdded, setJustAdded] = useState(false);

  const isLiked = useSelector((state) =>
    state.wishlist?.items?.some(
      (item) => String(item.id) === String(product.id)
    )
  );

  // Optimistic wishlist update.
  const handleWishlistClick = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();

      requireAuth(() => {
        const action = isLiked
          ? removeWishlistItem(product.id)
          : addWishlistItem(product);

        // Do not wait before updating the UI.
        // Redux updates the heart in the thunk's pending reducer.
        dispatch(action).unwrap().catch((error) => {
          console.error("Wishlist update failed:", error);
        });
      });
    },
    [isLiked, product, requireAuth, dispatch]
  );

  // Add the product to the cart.
  const handleAddToCartClick = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();

      requireAuth(() => {
        dispatch(addToCart(product));

        setJustAdded(true);

        setTimeout(() => {
          setJustAdded(false);
        }, 1400);
      });
    },
    [dispatch, product, requireAuth]
  );

  // Open product details.
  const handleProductClick = useCallback(() => {
    navigate(`/product/${product.id}`);

    requestAnimationFrame(() => {
      window.scrollTo({
        top: 0,
        behavior: "instant",
      });
    });
  }, [navigate, product.id]);

  return (
    <div
      onClick={handleProductClick}
      className="
        group relative flex h-[380px] w-full cursor-pointer
        flex-col overflow-hidden rounded-[28px] border
        border-white/10 bg-gradient-to-br
        from-[#29201f] via-[#171313] to-[#080808]
        transition-all duration-500 hover:-translate-y-1
        hover:border-white/20
      "
    >
      {/* Background Glow */}
      <div
        className="
          pointer-events-none absolute -left-20 -top-20
          h-48 w-48 rounded-full bg-[#d88955]/10 blur-3xl
        "
      />

      {/* Limited Badge */}
      <div
        className="
          absolute left-5 top-5 z-20 rounded-full border
          border-white/10 bg-white/10 px-3 py-1.5
          text-[9px] uppercase tracking-wide text-white/60
          backdrop-blur-md
        "
      >
        Limited to{" "}
        <span className="text-white">
          {product.limited || 50} Pieces
        </span>
      </div>

      {/* Wishlist Button */}
      <button
        type="button"
        onClick={handleWishlistClick}
        aria-label={
          isLiked ? "Remove from wishlist" : "Add to wishlist"
        }
        aria-pressed={isLiked}
        className={`
          absolute right-5 top-5 z-20 flex h-9 w-9
          items-center justify-center rounded-full border
          border-white/10 bg-black/40 backdrop-blur-md
          transition-all duration-200
          hover:scale-110 hover:bg-white/15
          active:scale-90
          ${isLiked ? "text-red-500" : "text-white/60"}
        `}
      >
        <Heart
          size={16}
          strokeWidth={1.5}
          fill={isLiked ? "currentColor" : "none"}
          className="transition-colors duration-200"
        />
      </button>

      {/* Product Image */}
      <div className="relative flex h-[240px] w-full items-center justify-center overflow-hidden pt-8">
        <img
          src={product.image}
          alt={product.name || "CHRONOX watch"}
          loading="lazy"
          className="
            h-[250px] w-[250px] object-contain
            transition-transform duration-700
            group-hover:scale-105
          "
        />
      </div>

      {/* Product Information */}
      <div className="relative z-10 mt-auto px-6 pb-6">
        {/* Model */}
        <p
          className="
            text-[9px] uppercase tracking-[0.18em]
            text-white/40
          "
        >
          {product.model}
        </p>

        {/* Product Name */}
        <h3
          className="
            mt-1 text-[13px] font-medium uppercase
            tracking-wide text-white
          "
        >
          {product.name}
        </h3>

        {/* Price + Add to Cart */}
        <div className="mt-4 flex items-center justify-between">
          <p
            className="
              text-[17px] font-medium tracking-wide
              text-[#e09a68]
            "
          >
            ₹{Number(product.price).toLocaleString("en-IN")}
          </p>

          {/* Add to Cart Button */}
          <button
            type="button"
            onClick={handleAddToCartClick}
            className={`
              flex items-center gap-2 rounded-full border
              px-4 py-2 text-[9px] font-medium uppercase
              tracking-wide transition-all
              ${
                justAdded
                  ? "border-white bg-white text-black"
                  : "border-white/15 bg-white/5 text-white hover:border-white/30 hover:bg-white/10"
              }
            `}
          >
            {justAdded ? (
              <>
                <Check size={12} strokeWidth={2} />
                ADDED
              </>
            ) : (
              <>
                <ShoppingBag size={12} strokeWidth={1.5} />
                ADD
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(ProductCard);

