import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  Heart,
  Search,
  ShoppingBag,
  X,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

import Navbar from "../components/layout/Navbar";
import ProductCard from "../components/product/ProductCard";
import { fetchProducts } from "../redux/slices/productSlice";

import spaceTimerVideo from "../assets/video/video1.mp4";
import Footer from "../components/layout/Footer";

function Dashboard() {
  const dispatch = useDispatch();

  const { products, loading, error } = useSelector(
    (state) => state.products,
  );

const [search, setSearch] = useState("");
const [price, setPrice] = useState("all");
const [category, setCategory] = useState("all");

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  /* -------------------------------------------------------
     COLLECTIONS
  ------------------------------------------------------- */

  const spaceTimerProducts = products.filter(
    (product) => product.collection === "Space Timer",
  );

  const tourbillonProducts = products.filter(
    (product) => product.collection === "Tourbillon",
  );


  /* -------------------------------------------------------
     CATEGORIES
  ------------------------------------------------------- */

  const categories = [
    "All Watches",
    "Space Timer",
    "Tourbillon",
  ];

  /* -------------------------------------------------------
     FILTER
  ------------------------------------------------------- */
const filteredProducts = useMemo(() => {
  const searchValue = search.toLowerCase().trim();

  return products.filter((product) => {
    const matchesSearch =
      product.name?.toLowerCase().includes(searchValue) ||
      product.model?.toLowerCase().includes(searchValue) ||
      product.collection?.toLowerCase().includes(searchValue);

    const productPrice = Number(product.price);

    let matchesPrice = true;

    if (price !== "all") {
      const [min, max] = price.split("-").map(Number);

      matchesPrice =
        Number.isFinite(productPrice) &&
        productPrice >= min &&
        productPrice <= max;
    }

    const matchesCategory =
      category === "all" ||
      product.collection?.toLowerCase() === category.toLowerCase();

    return matchesSearch && matchesPrice && matchesCategory;
  });
}, [products, search, price, category]);

 const clearFilters = () => {
  setSearch("");
  setPrice("all");
  setCategory("all");
};

const hasFilters =
  search !== "" ||
  price !== "all" ||
  category !== "all";

    const shopAllProducts = filteredProducts.filter(
  (product) =>
    product.collection !== "Space Timer" &&
    product.collection !== "Tourbillon"
);

  return (
    <div className="min-h-screen bg-white text-black">

    

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="sticky top-0 z-50 border-b border-black/10 bg-white/95 backdrop-blur-md">
        <Navbar />
      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main>

        {/* =================================================
            HERO
        ================================================= */}

       <div className="relative min-h-600px overflow-hidden">

  {/* Background Video */}
  <video
    autoPlay
    muted
    loop
    playsInline
    className="absolute inset-0 h-full w-full object-cover"
  >
    <source src={spaceTimerVideo} type="video/mp4" />
  </video>

  {/* Overlay */}
  <div className="absolute inset-0 bg-black/30" />

  {/* Content */}
  <div className="relative z-10 flex min-h-[600px] items-end p-7 text-white md:p-12 lg:p-16">

    <div>

      <p className="mb-3 text-[10px] uppercase tracking-[0.25em] text-white/70">
        Space Timer
      </p>

      <h2 className="text-4xl font-black uppercase tracking-[-0.04em] md:text-6xl">
        Beyond
        <br />
        the ordinary.
      </h2>

      <button
        onClick={() => setCategory("Space Timer")}
        className="mt-7 rounded-full bg-white px-6 py-3.5 text-xs font-bold uppercase text-black transition hover:bg-black hover:text-white"
      >
        Shop Space Timer
      </button>

    </div>

  </div>

</div>

        {/* =================================================
            QUICK CATEGORY NAVIGATION
        ================================================= */}

        <section className="border-b border-black/10 bg-white">
  <div className="mx-auto flex max-w-[1600px] gap-8 overflow-x-auto px-6 py-5 md:px-10 lg:px-16">
    {categories.map((item, index) => {
      const sectionId =
        index === 0
          ? "shop-all"
          : item.toLowerCase().replace(/\s+/g, "-");

      return (
        <button
          key={item}
          onClick={() => {
            setCategory(index === 0 ? "all" : item);

            const section = document.getElementById(sectionId);

            if (section) {
              window.scrollTo({
                top: section.offsetTop,
                behavior: "smooth",
              });
            }
          }}
          className={`shrink-0 text-[11px] font-semibold uppercase tracking-[0.08em] transition ${
            (category === "all" && index === 0) ||
            category === item
              ? "text-black"
              : "text-black/40 hover:text-black"
          }`}
        >
          {item}
        </button>
      );
    })}
  </div>
</section>

        {/* =================================================
            FEATURED INTRO
        ================================================= */}

        <section className="mx-auto max-w-[1600px] px-6 py-20 md:px-10 md:py-28 lg:px-16">

          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">

            <div>

              <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">
                Featured
              </p>

              <h2 className="max-w-3xl text-4xl font-black uppercase leading-[0.9] tracking-[-0.045em] sm:text-5xl md:text-7xl">
                Designed to
                <br />
                stand out.
              </h2>

            </div>

            <p className="max-w-sm text-sm leading-6 text-black/55">
              Explore our most distinctive timepieces, built around precision,
              character and contemporary design.
            </p>

          </div>

        </section>



      
        {/* =================================================
            SPACE TIMER PRODUCTS
        ================================================= */}

        {spaceTimerProducts.length > 0 && (

          <section  id="space-timer" className="mx-auto max-w-[1600px] px-6 pb-24 md:px-10 lg:px-16">

            <div  className="mb-7 flex items-end justify-between">

              <div>

                <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-black/40">
                  Collection
                </p>

                <h2 className="text-2xl font-bold uppercase tracking-[-0.03em] md:text-3xl">
                  Space Timer
                </h2>

              </div>

          

            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

              {spaceTimerProducts.slice(0, 3).map((product) => (

                <div key={product.id} className="group">

                  <ProductCard product={product} />

                </div>

              ))}

            </div>

          </section>

        )}

        {/* =================================================
            TOURBILLON EDITORIAL
        ================================================= */}

        {tourbillonProducts.length > 0 && (

          <section  id="tourbillon" className="bg-[#f4f4f2]">

            <div className="mx-auto max-w-[1600px] px-6 py-24 md:px-10 md:py-32 lg:px-16">

              <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-24">

                <div>

                  <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40">
                    Haute Horlogerie
                  </p>

                  <h2 className="text-5xl font-black uppercase leading-[0.88] tracking-[-0.055em] md:text-7xl">
                    Tourbillon
                    <br />
                    Collection.
                  </h2>

                  <p className="mt-7 max-w-md text-sm leading-7 text-black/55">
                    Mechanical artistry engineered into a modern silhouette.
                    Discover our most sophisticated collection.
                  </p>

                  <button
                    onClick={() => setCategory("Tourbillon")}
                    className="mt-8 flex items-center gap-3 rounded-full bg-black px-7 py-4 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-black/80"
                  >
                    Explore Tourbillon
                    <ArrowRight size={15} />
                  </button>

                </div>

                <div className="relative aspect-square overflow-hidden bg-white">

                  <img
                    src={
                      tourbillonProducts[0]?.image ||
                      "/images/watch-1.png"
                    }
                    alt="Tourbillon Collection"
                    className="h-full w-full object-cover transition duration-700 hover:scale-105"
                  />

                </div>

              </div>

            </div>

          </section>

        )}

        {/* =================================================
            TOURBILLON PRODUCTS
        ================================================= */}

        {tourbillonProducts.length > 0 && (

          <section className="mx-auto max-w-[1600px] px-6 py-24 md:px-10 lg:px-16">

            <div className="mb-8 flex items-end justify-between">

              <div>

                <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-black/40">
                  Featured Collection
                </p>

                <h2 className="text-2xl font-bold uppercase tracking-[-0.03em] md:text-3xl">
                  Tourbillon
                </h2>

              </div>

           

            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

              {tourbillonProducts.slice(0, 3).map((product) => (

                <ProductCard
                  key={product.id}
                  product={product}
                />

              ))}

            </div>

          </section>

        )}

        {/* =================================================
            SHOP ALL
        ================================================= */}

        <section
          id="shop-all"
          className="border-t border-black/10"
        >

          <div className="mx-auto max-w-[1600px] px-6 py-20 md:px-10 md:py-28 lg:px-16">

            <div className="mb-10">

              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">
                Discover More
              </p>

              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">

                <h2 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.05em] md:text-7xl">
                  Shop all
                  <br />
                  watches.
                </h2>

                <p className="text-xs font-medium uppercase tracking-[0.12em] text-black/40">
                   {shopAllProducts.length} Watches             
                      </p>

              </div>

            </div>

            {/* SEARCH */}

            <div className="mb-8 flex flex-col gap-3 md:flex-row">

              <div className="flex h-14 flex-1 items-center border-b border-black/30">

                <Search
                  size={18}
                  strokeWidth={1.5}
                  className="mr-4 text-black/50"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search watches"
                  className="h-full w-full bg-transparent text-sm outline-none placeholder:text-black/30"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                  >
                    <X size={17} />
                  </button>
                )}

              </div>

            {/* PRICE FILTER */}

<div className="relative">
  <select
    value={price}
    onChange={(e) => setPrice(e.target.value)}
    className="h-14 w-full appearance-none border-b border-black/30 bg-transparent px-2 pr-12 text-xs font-semibold uppercase tracking-wide outline-none transition-colors focus:border-black md:w-52"
  >
    <option value="all">Filter by Price</option>

    <option value="100000-150000">
      ₹1,00,000 – ₹1,50,000
    </option>

    <option value="150000-200000">
      ₹1,50,000 – ₹2,00,000
    </option>

    <option value="200000-250000">
      ₹2,00,000 – ₹2,50,000
    </option>

    <option value="250000-300000">
      ₹2,50,000 – ₹3,00,000
    </option>

    <option value="300000-350000">
      ₹3,00,000 – ₹3,50,000
    </option>

    <option value="350000-400000">
      ₹3,50,000 – ₹4,00,000
    </option>
  </select>

  <ChevronDown
    size={15}
    className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
  />
</div>

              {hasFilters && (

                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex h-14 items-center justify-center gap-2 border-b border-black px-5 text-xs font-bold uppercase"
                >
                  Clear
                  <X size={14} />
                </button>

              )}

            </div>

            {/* ACTIVE FILTER */}

            {hasFilters && (

              <div className="mb-8 flex items-center justify-between">

                <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-black/40">
                 {shopAllProducts.length} Results
                </p>

                <p className="text-[10px] font-bold uppercase tracking-[0.12em]">
                  Filters Applied
                </p>

              </div>

            )}

            {/* PRODUCTS */}

            {loading && (

              <div className="flex min-h-[300px] items-center justify-center">

                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-black/40">
                  Loading watches
                </div>

              </div>

            )}

            {error && (

              <div className="border border-red-200 bg-red-50 p-8 text-center">

                <p className="text-sm font-medium text-red-600">
                  {error}
                </p>

                <p className="mt-2 text-xs text-red-400">
                  Make sure JSON Server is running on port 3000.
                </p>

              </div>

            )}

            {!loading && !error && shopAllProducts.length === 0 && (

              <div className="py-32 text-center">

                <Search
                  size={30}
                  strokeWidth={1}
                  className="mx-auto mb-5 text-black/30"
                />

                <h3 className="text-lg font-bold uppercase">
                  No watches found
                </h3>

                <button
                  onClick={clearFilters}
                  className="mt-5 text-xs font-bold uppercase underline underline-offset-4"
                >
                  Clear filters
                </button>

              </div>

            )}

           {!loading && !error && shopAllProducts.length > 0 && (
           <div className="grid grid-cols-1 gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {shopAllProducts.map((product) => (
               <ProductCard
                  key={product.id}
                  product={product}
               />
              ))}
            </div>
          )}

          </div>

        </section>

        {/* =================================================
            EDITORIAL BANNER
        ================================================= */}

        <section className="bg-black text-white">

          <div className="mx-auto grid max-w-[1600px] md:grid-cols-2">

            <div className="flex min-h-[500px] flex-col justify-end p-8 md:p-12 lg:p-16">

              <p className="mb-4 text-[10px] uppercase tracking-[0.25em] text-white/50">
                Precision / Performance / Design
              </p>

              <h2 className="text-5xl font-black uppercase leading-[0.88] tracking-[-0.05em] md:text-7xl">
                Built for
                <br />
                every second.
              </h2>

              <p className="mt-7 max-w-md text-sm leading-6 text-white/55">
                From everyday moments to extraordinary occasions, every detail
                is engineered to perform.
              </p>

            </div>

            <div className="min-h-[500px] bg-[#171717]">

              <img
                src="/src/assets/images/dash.png"
                alt="Watch detail"
                className="h-full w-full object-cover"
              />

            </div>

          </div>

        </section>

        

      </main>

      {/* =====================================================
          FOOTER
      ===================================================== */}

     <Footer/>

    </div>
  );
}

export default Dashboard;