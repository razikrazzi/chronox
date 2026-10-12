import { useEffect } from "react";
import { ArrowRight, ChevronRight } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import heroWatch from "../assets/images/image-home.png";

import { fetchProducts } from "../redux/slices/productSlice";

function Home() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { products, loading, error } = useSelector(
    (state) => state.products,
  );

  useEffect(() => {
    if (products.length === 0) {
      dispatch(fetchProducts());
    }
  }, [dispatch, products.length]);

  const featuredWatches = products.filter(
    (product) => product.collection === "Space Timer",
  );

  const tourbillonWatches = products.filter(
    (product) => product.collection === "Tourbillon",
  );

  return (
    <div className="min-h-screen bg-white text-black">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="relative z-50 border-b border-black/10 bg-white">
        <Navbar />
      </header>

      <main>

        {/* =====================================================
            HERO
        ===================================================== */}

        <section className="relative min-h-[calc(100vh-36px)] overflow-hidden bg-[#f3f3f1]">

          {/* Background Image */}

          <div className="absolute inset-0">

           <img
  src={heroWatch}
  alt="Open Gear Flying Tourbillon Paraiba"
  className="
    absolute
    right-0
    top-1/2
    z-0
    h-[50%]
    w-[50%]
    -translate-y-1/2
    object-contain
    object-right
    md:h-[88%]
    md:w-[70%]
    lg:h-[92%]
    lg:w-[68%]
    xl:h-[95%]
    xl:w-[70%]
  "
/>

          </div>

          {/* Subtle Image Overlay */}

          <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-[#f3f3f1] via-[#f3f3f1]/80 to-transparent lg:w-[60%]" />

          {/* Hero Content */}

          <div className="relative z-10 mx-auto flex min-h-[calc(100vh-36px)] max-w-[1600px] items-end px-6 pb-14 md:items-center md:px-10 md:pb-0 lg:px-16">

            <div className="max-w-480px">

              <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.25em] text-black/45">
                New Release · 2026
              </p>

              <h1 className="text-6xl font-black uppercase leading-[0.82] tracking-[-0.06em] sm:text-7xl md:text-8xl lg:text-[100px]">
                Open
                <br />
                Gear
                <br />
                Tourbillon
              </h1>

              <p className="mt-7 max-w-sm text-sm leading-6 text-black/55">
                A new expression of mechanical precision. Engineered with
                character, designed to be seen.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">

              

                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="
                    rounded-full
                    border
                    border-black
                    px-7
                    py-4
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-[0.08em]
                    text-black
                    transition
                    hover:bg-black
                    hover:text-white
                  "
                >
                  Discover
                </button>

              </div>

            </div>

          </div>

          {/* Hero Bottom Information */}

          <div className="absolute bottom-6 left-6 right-6 flex justify-between text-[8px] font-semibold uppercase tracking-[0.18em] text-black/35 md:left-10 md:right-10 lg:left-16 lg:right-16">

            <span>CH-3123-PABL</span>

            <span className="hidden md:block">
              Open Gear Flying Tourbillon
            </span>

            <span>01 / 04</span>

          </div>

        </section>

    

     

        {/* =====================================================
            INTRO
        ===================================================== */}

        <section className="mx-auto max-w-[1600px] px-6 py-24 md:px-10 md:py-32 lg:px-16">

          <div className="grid gap-10 md:grid-cols-2 md:items-end">

            <div>

              <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.22em] text-black/35">
                The Collection
              </p>

              <h2 className="text-5xl font-black uppercase leading-[0.86] tracking-[-0.055em] md:text-7xl lg:text-8xl">
                Time
                <br />
                moves
                <br />
                forward.
              </h2>

            </div>

            <div className="max-w-md md:ml-auto">

              <p className="text-sm leading-7 text-black/55">
                We create contemporary timepieces for people who value
                precision, individuality and design. Every collection is
                engineered around a different way of experiencing time.
              </p>

              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="mt-7 flex items-center gap-3 text-[10px] font-bold uppercase tracking-0.1em"
              >
                Explore the collection
                <ChevronRight size={15} />
              </button>

            </div>

          </div>

        </section>

        {/* =====================================================
            FEATURED HERO PRODUCT
        ===================================================== */}

        {featuredWatches.length > 0 && (

          <section className="mx-auto max-w-[1600px] px-6 pb-24 md:px-10 lg:px-16">

            <div className="relative overflow-hidden bg-[#e9e9e5]">

              <div className="grid min-h-650px md:grid-cols-2">

                {/* Product Image */}

                <div className="relative flex items-center justify-center overflow-hidden bg-[#e7e7e3]">

                  <img
                    src={
                      featuredWatches[0].image ||
                      "/images/watch-1.png"
                    }
                    alt={featuredWatches[0].name}
                    className="
                      h-full
                      w-full
                      object-contain
                      p-8
                      transition
                      duration-700
                      hover:scale-105
                      md:p-14
                    "
                  />

                </div>

                {/* Content */}

                <div className="flex flex-col justify-end p-8 md:p-12 lg:p-16">

                  <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-black/40">
                    Featured Collection
                  </p>

                  <h2 className="max-w-lg text-5xl font-black uppercase leading-[0.87] tracking-[-0.055em] md:text-6xl lg:text-7xl">
                    Space
                    <br />
                    Timer
                  </h2>

                  <p className="mt-6 max-w-md text-sm leading-6 text-black/55">
                    Inspired by the unknown. Built for those who never stop
                    moving forward.
                  </p>

                  <div className="mt-8">

                    <button
                      type="button"
                      onClick={() => navigate("/dashboard#space-timer")}
                      className="
                        group
                        flex
                        items-center
                        gap-3
                        rounded-full
                        bg-black
                        px-7
                        py-4
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-[0.08em]
                        text-white
                        transition
                        hover:bg-black/75
                      "
                    >
                      Shop Space Timer

                      <ArrowRight
                        size={14}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </button>

                  </div>

                </div>

              </div>

            </div>

          </section>

        )}

        {/* =====================================================
            FEATURED PRODUCTS
        ===================================================== */}

        <section className="mx-auto max-w-[1600px] px-6 pb-28 md:px-10 lg:px-16">

          <div className="mb-8 flex items-end justify-between">

            <div>

              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-black/35">
                Featured
              </p>

              <h2 className="text-3xl font-black uppercase tracking-[-0.04em] md:text-4xl">
                Latest Watches
              </h2>

            </div>

            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="hidden items-center gap-2 text-[10px] font-bold uppercase tracking-wide md:flex"
            >
              View All
              <ArrowRight size={14} />
            </button>

          </div>

          {loading && (

            <div className="flex min-h-300px items-center justify-center">

              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/35">
                Loading watches
              </p>

            </div>

          )}

          {error && (

            <div className="flex min-h-300px items-center justify-center">

              <p className="text-sm text-red-500">
                {error}
              </p>

            </div>

          )}

          {!loading &&
            !error &&
            featuredWatches.length > 0 && (

              <div className="grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">

                {featuredWatches.slice(0, 3).map((watch) => (

                  <article
                    key={watch.id}
                    className="group cursor-pointer"
                    onClick={() =>
                      navigate(`/product/${watch.id}`)
                    }
                  >

                    {/* Image */}

                    <div className="relative aspect-square overflow-hidden bg-[#f3f3f1]">

                      {watch.limited && (

                        <span className="absolute left-4 top-4 z-10 text-[8px] font-bold uppercase tracking-[0.15em]">
                          Limited · {watch.limited}
                        </span>

                      )}

                      <img
                        src={watch.image}
                        alt={watch.name}
                        className="
                          h-full
                          w-full
                          object-contain
                          p-8
                          transition
                          duration-700
                          group-hover:scale-105
                        "
                      />

                    </div>

                    {/* Product Info */}

                    <div className="pt-5">

                      <div className="flex items-start justify-between gap-4">

                        <div>

                          <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.15em] text-black/35">
                            {watch.collection}
                          </p>

                          <h3 className="text-sm font-semibold uppercase tracking-[-0.01em]">
                            {watch.name}
                          </h3>

                          <p className="mt-2 text-[10px] text-black/40">
                            {watch.model}
                          </p>

                        </div>

                        <p className="shrink-0 text-sm font-semibold">
                          ₹{Number(watch.price).toLocaleString("en-IN")}
                        </p>

                      </div>

                    </div>

                  </article>

                ))}

              </div>

            )}

        </section>

        {/* =====================================================
            TOURBILLON EDITORIAL
        ===================================================== */}

        {tourbillonWatches.length > 0 && (

          <section className="bg-black text-white">

            <div className="mx-auto grid max-w-[1600px] md:grid-cols-2">

              {/* Image */}

              <div className="min-h-600px overflow-hidden bg-[#111]">

                <img
                  src={
                    tourbillonWatches[0].image ||
                    "/images/watch-2.png"
                  }
                  alt="Tourbillon"
                  className="
                    h-full
                    w-full
                    object-cover
                    transition
                    duration-700
                    hover:scale-105
                  "
                />

              </div>

              {/* Content */}

              <div className="flex min-h-600px flex-col justify-end p-8 md:p-12 lg:p-16">

                <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">
                  Haute Horlogerie
                </p>

                <h2 className="text-5xl font-black uppercase leading-[0.86] tracking-[-0.055em] md:text-7xl">
                  The
                  <br />
                  Tourbillon
                  <br />
                  Collection
                </h2>

                <p className="mt-7 max-w-md text-sm leading-6 text-white/50">
                  Mechanical artistry. Modern architecture. A collection
                  created to make precision visible.
                </p>

                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="
                    group
                    mt-8
                    flex
                    w-fit
                    items-center
                    gap-3
                    rounded-full
                    bg-white
                    px-7
                    py-4
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-[0.08em]
                    text-black
                    transition
                    hover:bg-white/80
                  "
                >
                  Explore Tourbillon

                  <ArrowRight
                    size={14}
                    className="transition-transform group-hover:translate-x-1"
                  />

                </button>

              </div>

            </div>

          </section>

        )}

        {/* =====================================================
            BRAND STATEMENT
        ===================================================== */}

        <section className="mx-auto max-w-[1600px] px-6 py-28 text-center md:px-10 md:py-36 lg:px-16">

          <p className="mb-6 text-[10px] font-bold uppercase tracking-[0.25em] text-black/35">
            Our Philosophy
          </p>

          <h2 className="mx-auto max-w-6xl text-5xl font-black uppercase leading-[0.85] tracking-[-0.06em] sm:text-6xl md:text-8xl">
            Designed for
            <br />
            those who
            <br />
            move forward.
          </h2>

          <p className="mx-auto mt-8 max-w-xl text-sm leading-7 text-black/50">
            Watches should do more than tell time. They should reflect the way
            you see the world.
          </p>

        </section>

        {/* =====================================================
            FINAL CTA
        ===================================================== */}

        <section className="relative overflow-hidden bg-[#f0f0ed]">

          <div className="mx-auto grid max-w-[1600px] md:grid-cols-2">

            <div className="flex min-h-500px flex-col justify-end p-8 md:p-12 lg:p-16">

              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.25em] text-black/35">
                Discover Your Watch
              </p>

              <h2 className="text-5xl font-black uppercase leading-[0.86] tracking-[-0.055em] md:text-7xl">
                Find your
                <br />
                next
                <br />
                timepiece.
              </h2>

              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="
                  group
                  mt-8
                  flex
                  w-fit
                  items-center
                  gap-3
                  rounded-full
                  bg-black
                  px-7
                  py-4
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.08em]
                  text-white
                  transition
                  hover:bg-black/75
                "
              >
                Shop All Watches

                <ArrowRight
                  size={14}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>

            </div>

            <div className="min-h-500px bg-[#deded9]">

              <img
                src={heroWatch}
                alt="Watch"
                className="h-full w-full object-contain p-10 md:p-14"
              />

            </div>

          </div>

        </section>

      </main>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <Footer />

    </div>
  );
}

export default Home;