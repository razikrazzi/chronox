import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  Share2,
  ShoppingBag,
  ShieldCheck,
  Truck,
  Check,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { useRequireAuth } from "../hooks/useRequireAuth";
import { fetchProducts } from "../redux/slices/productSlice";
import {
  addWishlistItem,
  removeWishlistItem,
} from "../redux/slices/wishlistSlice";
import { addToCart } from "../redux/slices/cartSlice";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { requireAuth } = useRequireAuth();

  const [justAdded, setJustAdded] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const { products, loading, error, status } = useSelector(
    (state) => state.products,
  );

  const isLiked = useSelector((state) =>
    state.wishlist?.items?.some((item) => String(item.id) === String(id)),
  );

  const handleToggleWishlist = () => {
    if (!product) return;

    requireAuth(() => {
      const action = isLiked
        ? removeWishlistItem(product.id)
        : addWishlistItem(product);

      dispatch(action)
        .unwrap()
        .catch((error) => {
          console.error("Failed to update wishlist:", error);
        });
    });
  };

  const handleAddToCart = () => {
    if (!product) return;
    requireAuth(() => {
      dispatch(addToCart(product));
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1800);
    });
  };

  const handleBuyNow = () => {
    if (!product) return;

    requireAuth(() => {
      navigate("/checkout", {
        state: {
          buyNowItem: {
            ...product,
            quantity: 1,
          },
        },
      });
    });
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: product?.name || "CHRONOX Timepiece",
          text: `Explore the ${product?.name} on ChronoX`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      }
    } catch {
      // User cancelled or clipboard fallback
    }
  };

  /* =====================================================
     FETCH PRODUCTS
  ===================================================== */

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchProducts());
    }
  }, [dispatch, status]);

  /* =====================================================
     CURRENT PRODUCT
  ===================================================== */

  const product = useMemo(() => {
    return products.find(
      (item) => String(item.id) === String(id),
    );
  }, [products, id]);

  /* =====================================================
     RELATED PRODUCTS
  ===================================================== */

  const relatedProducts = useMemo(() => {
    if (!product) return [];

    return products
      .filter((item) => String(item.id) !== String(product.id))
      .slice(0, 3);
  }, [products, product]);

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading && !product) {
    return (
      <div className="min-h-screen bg-[#f4f4f2] text-black">
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">
            Loading product
          </p>
        </div>
      </div>
    );
  }

  /* =====================================================
     ERROR
  ===================================================== */

  if (error && !product) {
    return (
      <div className="min-h-screen bg-[#f4f4f2] text-black">
        <div className="flex min-h-screen flex-col items-center justify-center text-center">
          <h1 className="text-3xl font-black uppercase">
            Product unavailable
          </h1>

          <button
            onClick={() => navigate("/dashboard")}
            className="mt-7 rounded-full bg-black px-7 py-4 text-[10px] font-bold uppercase tracking-[0.1em] text-white"
          >
            Back to Watches
          </button>
        </div>
      </div>
    );
  }

  /* =====================================================
     PRODUCT NOT FOUND
  ===================================================== */

  if (!product) {
    return (
      <div className="min-h-screen bg-[#f4f4f2] text-black">
        <div className="flex min-h-screen flex-col items-center justify-center text-center">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">
            404
          </p>

          <h1 className="text-5xl font-black uppercase tracking-[-0.05em]">
            Watch not found
          </h1>

          <button
            onClick={() => navigate("/dashboard")}
            className="mt-8 rounded-full bg-black px-7 py-4 text-[10px] font-bold uppercase tracking-[0.1em] text-white"
          >
            Shop All Watches
          </button>
        </div>
      </div>
    );
  }

  const price = Number(product.price || 0);

  return (
    <div className="min-h-screen bg-[#f4f4f2] text-black">

      <main className="px-2 pb-2 pt-2 md:px-3 md:pt-3">

        {/* =====================================================
            PRODUCT HERO
        ===================================================== */}

        <section
          className="
            relative
            min-h-[calc(100vh-16px)]
            overflow-hidden
            rounded-[32px]
            bg-black
            text-white
            md:min-h-[720px]
          "
        >

          {/* =================================================
              SINGLE NAVBAR
          ================================================= */}

          <div className="fixed left-0 right-0 top-0 z-[100]">
             <Navbar dark />
           </div>

          {/* =================================================
              BACKGROUND
          ================================================= */}

          <div className="pointer-events-none absolute inset-0">

            <div
              className="
                absolute
                -left-40
                -top-40
                h-[600px]
                w-[600px]
                rounded-full
                bg-white/[0.06]
                blur-[140px]
              "
            />

            <div
              className="
                absolute
                bottom-[-250px]
                right-[-150px]
                h-[600px]
                w-[600px]
                rounded-full
                bg-white/[0.04]
                blur-[140px]
              "
            />

            <div
              className="
                absolute
                bottom-[10%]
                right-[10%]
                h-[180px]
                w-[55%]
                rounded-full
                bg-black
                opacity-80
                blur-[70px]
              "
            />

          </div>

          {/* =================================================
              LIMITED BADGE
          ================================================= */}

          {product.limited && (
            <div className="absolute left-8 top-28 z-20 md:left-12">

              <span
                className="
                  rounded-full
                  border
                  border-white/20
                  bg-white/10
                  px-4
                  py-2
                  text-[8px]
                  font-semibold
                  uppercase
                  tracking-[0.12em]
                  text-white
                  backdrop-blur-md
                "
              >
                Limited to {product.limited} pieces
              </span>

            </div>
          )}

          {/* =================================================
              AVAILABILITY
          ================================================= */}

          <div className="absolute right-8 top-28 z-20 md:right-12">

            <div className="flex items-center gap-2">

              <span className="h-1.5 w-1.5 rounded-full bg-white" />

              <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white/70">
                Available
              </span>

            </div>

          </div>

          {/* =================================================
              PRODUCT IMAGE
          ================================================= */}

          <div
            className="
              absolute
              inset-x-0
              bottom-[90px]
              top-[100px]
              z-10
              flex
              items-center
              justify-center
              md:left-[24%]
              md:right-[3%]
            "
          >

            <img
              src={product.image}
              alt={product.name}
              className="
                h-full
                w-full
                object-contain
                p-8
                transition
                duration-700
                hover:scale-[1.03]
                md:p-4
                lg:p-0
              "
            />

          </div>

          {/* =================================================
              PRODUCT INFORMATION
          ================================================= */}

          <div
            className="
              absolute
              bottom-20
              left-8
              z-20
              max-w-[430px]
              md:left-12
              lg:bottom-24
            "
          >

            <p className="mb-4 text-[9px] font-medium uppercase tracking-[0.2em] text-white/45">
              {product.model}
            </p>

            <h1
              className="
                max-w-[600px]
                text-5xl
                font-light
                uppercase
                leading-[0.86]
                tracking-[-0.055em]
                sm:text-6xl
                md:text-7xl
                lg:text-[82px]
              "
            >
              {product.name}
            </h1>

            <p className="mt-5 text-[10px] font-medium uppercase tracking-[0.18em] text-white/40">
              {product.collection}
            </p>

            <p className="mt-7 text-sm font-medium tracking-wide text-white/80">
              ₹{Number(product.price || 0).toLocaleString("en-IN")}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">

              <button
                type="button"
                onClick={handleBuyNow}
                className="
                  rounded-full
                  bg-white
                  px-7
                  py-3.5
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-[0.1em]
                  text-black
                  transition
                  hover:bg-white/80
                  active:scale-95
                "
              >
                Buy Now
              </button>

              <button
                type="button"
                onClick={handleAddToCart}
                className={`
                  flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  px-6
                  py-3.5
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-[0.1em]
                  transition
                  active:scale-95
                  ${
                    justAdded
                      ? "border-white bg-white text-black"
                      : "border-white/20 text-white hover:bg-white hover:text-black"
                  }
                `}
              >
                {justAdded ? (
                  <>
                    <Check size={13} strokeWidth={2.5} />
                    Added to Cart
                  </>
                ) : (
                  <>
                    <ShoppingBag size={13} strokeWidth={1.5} />
                    Add to Cart
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleToggleWishlist}
                aria-label={isLiked ? "Remove from wishlist" : "Add to wishlist"}
                className={`
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-white/20
                  transition
                  hover:bg-white
                  hover:text-black
                  ${isLiked ? "bg-white text-black" : "text-white"}
                `}
              >
                <Heart
                  size={16}
                  fill={isLiked ? "currentColor" : "none"}
                />
              </button>

            </div>

          </div>

          {/* =================================================
              RIGHT SIDE ACTIONS
          ================================================= */}

          <div
            className="
              absolute
              bottom-24
              right-8
              z-30
              hidden
              flex-col
              gap-5
              md:flex
            "
          >

            <button
              type="button"
              onClick={handleToggleWishlist}
              title={isLiked ? "Remove from Wishlist" : "Add to Wishlist"}
              className="text-white/50 transition hover:text-white"
            >
              <Heart
                size={18}
                strokeWidth={1.3}
                fill={isLiked ? "currentColor" : "none"}
                className={isLiked ? "text-white" : ""}
              />
            </button>

            <button
              type="button"
              onClick={handleShare}
              title={shareSuccess ? "Link Copied!" : "Share Timepiece"}
              className="text-white/50 transition hover:text-white"
            >
              {shareSuccess ? (
                <Check size={18} className="text-white" />
              ) : (
                <Share2 size={18} strokeWidth={1.3} />
              )}
            </button>

            <button
              type="button"
              onClick={handleAddToCart}
              title="Add to Cart"
              className="text-white/50 transition hover:text-white"
            >
              {justAdded ? (
                <Check size={18} className="text-white" />
              ) : (
                <ShoppingBag size={18} strokeWidth={1.3} />
              )}
            </button>

          </div>

          {/* =================================================
              BOTTOM PRODUCT NAVIGATION
          ================================================= */}

          <div
            className="
              absolute
              bottom-6
              left-8
              right-8
              z-30
              flex
              items-center
              justify-between
              md:left-12
              md:right-12
            "
          >

            {/* Previous */}

            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="
                flex
                items-center
                gap-2
                text-[9px]
                font-semibold
                uppercase
                tracking-[0.15em]
                text-white/40
                transition
                hover:text-white
              "
            >
              <ArrowLeft size={13} />
              Watches
            </button>

            {/* Indicators */}

            <div className="hidden items-center gap-2 md:flex">

              {products.slice(0, 5).map((item) => (

                <button
                  type="button"
                  key={item.id}
                  onClick={() =>
                    navigate(`/product/${item.id}`)
                  }
                  className={`
                    h-1
                    transition-all
                    ${
                      String(item.id) === String(product.id)
                        ? "w-8 bg-white"
                        : "w-3 bg-white/20"
                    }
                  `}
                />

              ))}

            </div>

            {/* Next */}

            <button
              type="button"
              onClick={() => {

                const currentIndex = products.findIndex(
                  (item) =>
                    String(item.id) === String(product.id),
                );

                const nextProduct =
                  products[currentIndex + 1];

                if (nextProduct) {
                  navigate(`/product/${nextProduct.id}`);
                }

              }}
              className="
                flex
                items-center
                gap-2
                text-[9px]
                font-semibold
                uppercase
                tracking-[0.15em]
                text-white/40
                transition
                hover:text-white
              "
            >
              Next
              <ArrowRight size={13} />
            </button>

          </div>

        </section>

        {/* =====================================================
            PRODUCT INFORMATION
        ===================================================== */}

        <section className="mx-auto max-w-[1600px] px-6 py-16 md:px-10 lg:px-16">

          <div className="grid gap-12 md:grid-cols-[1fr_1.2fr]">

            <div>

              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-black/40">
                {product.collection} · {product.model}
              </p>

              <h2 className="mt-4 text-3xl font-semibold uppercase tracking-[-0.04em] md:text-4xl">
                Designed around
                <br />
                precision.
              </h2>

            </div>

            <div className="max-w-xl">

              <p className="text-sm leading-7 text-black/55">
                {product.description ||
                  `The ${product.name} represents the CHRONOX approach to modern watchmaking. Every element has been considered around proportion, movement and performance.`}
              </p>

              <p className="mt-5 text-sm leading-7 text-black/55">
                Contemporary materials, precise engineering and a distinctive
                silhouette come together to create a timepiece designed to
                stand apart.
              </p>

            </div>

          </div>

        </section>

        {/* =====================================================
            SPECIFICATIONS
        ===================================================== */}

        <section className="border-y border-black/10 bg-white">

          <div className="mx-auto max-w-[1600px] px-6 py-14 md:px-10 lg:px-16">

            <div className="grid sm:grid-cols-2 lg:grid-cols-4">

              <div className="border-b border-black/10 py-7 lg:border-b-0 lg:border-r lg:pr-8">
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-black/35">
                  Collection
                </p>

                <p className="mt-3 text-sm font-semibold uppercase">
                  {product.collection || "CHRONOX"}
                </p>
              </div>

              <div className="border-b border-black/10 py-7 sm:pl-8 lg:border-b-0 lg:border-r">
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-black/35">
                  Model
                </p>

                <p className="mt-3 text-sm font-semibold uppercase">
                  {product.model || "CH-0000"}
                </p>
              </div>

              <div className="border-b border-black/10 py-7 lg:border-b-0 lg:border-r lg:pl-8">
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-black/35">
                  Movement
                </p>

                <p className="mt-3 text-sm font-semibold uppercase">
                  Automatic
                </p>
              </div>

              <div className="py-7 sm:pl-8">
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-black/35">
                  Warranty
                </p>

                <p className="mt-3 text-sm font-semibold uppercase">
                  2 Years
                </p>
              </div>

            </div>

          </div>

        </section>

        {/* =====================================================
            SERVICE BENEFITS
        ===================================================== */}

        <section className="mx-auto max-w-[1600px] px-6 py-16 md:px-10 lg:px-16">

          <div className="grid gap-4 md:grid-cols-3">

            <div className="border border-black/10 p-7">
              <Truck size={20} strokeWidth={1.3} />

              <h3 className="mt-7 text-xs font-bold uppercase tracking-wide">
                Free Delivery
              </h3>

              <p className="mt-2 text-xs leading-5 text-black/45">
                Complimentary delivery on all orders.
              </p>
            </div>

            <div className="border border-black/10 p-7">
              <ShieldCheck size={20} strokeWidth={1.3} />

              <h3 className="mt-7 text-xs font-bold uppercase tracking-wide">
                International Warranty
              </h3>

              <p className="mt-2 text-xs leading-5 text-black/45">
                Two years of international warranty coverage.
              </p>
            </div>

            <div className="border border-black/10 p-7">
              <ShoppingBag size={20} strokeWidth={1.3} />

              <h3 className="mt-7 text-xs font-bold uppercase tracking-wide">
                Secure Shopping
              </h3>

              <p className="mt-2 text-xs leading-5 text-black/45">
                Secure checkout and protected payments.
              </p>
            </div>

          </div>

        </section>

        {/* =====================================================
            RELATED PRODUCTS
        ===================================================== */}

        {relatedProducts.length > 0 && (

          <section className="bg-black text-white">

            <div className="mx-auto max-w-[1600px] px-6 py-20 md:px-10 md:py-28 lg:px-16">

              <div className="mb-10 flex items-end justify-between">

                <div>

                  <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">
                    More to explore
                  </p>

                  <h2 className="text-4xl font-light uppercase tracking-[-0.05em] md:text-6xl">
                    Various Models
                  </h2>

                </div>

                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="
                    hidden
                    items-center
                    gap-2
                    text-[9px]
                    font-bold
                    uppercase
                    tracking-[0.1em]
                    text-white/50
                    transition
                    hover:text-white
                    md:flex
                  "
                >
                  View All
                  <ArrowRight size={13} />
                </button>

              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

                {relatedProducts.map((item) => (

                  <article
                    key={item.id}
                    onClick={() => {
                      navigate(`/product/${item.id}`);
                      window.scrollTo(0, 0);
                    }}
                    className="group cursor-pointer"
                  >

                    <div className="relative aspect-square overflow-hidden bg-[#111]">

                      <img
                        src={item.image}
                        alt={item.name}
                        className="
                          h-full
                          w-full
                          object-contain
                          p-8
                          grayscale
                          transition
                          duration-700
                          group-hover:scale-105
                          group-hover:grayscale-0
                        "
                      />

                    </div>

                    <div className="pt-5">

                      <p className="text-[9px] uppercase tracking-[0.15em] text-white/35">
                        {item.collection}
                      </p>

                      <div className="mt-2 flex items-start justify-between gap-4">

                        <h3 className="text-sm font-medium uppercase">
                          {item.name}
                        </h3>

                        <p className="shrink-0 text-sm font-medium">
                          ₹
                          {Number(item.price || 0).toLocaleString(
                            "en-IN",
                          )}
                        </p>

                      </div>

                      <p className="mt-2 text-[9px] uppercase tracking-[0.12em] text-white/30">
                        {item.model}
                      </p>

                    </div>

                  </article>

                ))}

              </div>

            </div>

          </section>

        )}

      </main>

      <Footer />

    </div>
  );
}

export default ProductDetails;