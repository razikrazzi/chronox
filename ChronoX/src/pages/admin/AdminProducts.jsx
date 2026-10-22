import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { fetchProducts } from "../../redux/slices/productSlice";
import {
  Search,
  RefreshCw,
  Watch,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  Save,
  Image as ImageIcon,
  X,
} from "lucide-react";

const API_URL = "http://localhost:3000/products";

// Vite resolves files in src/assets/images and supplies the correct URL.
// This allows paths such as /src/assets/images/watch-6.png to work.
const localImageModules = import.meta.glob("/src/assets/images/*", {
  eager: true,
  query: "?url",
  import: "default",
});

function getProductImageSrc(imagePath) {
  if (!imagePath) return "";
  if (imagePath.startsWith("data:") || imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  const cleanPath = imagePath.split("?")[0];
  const normalizedPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  return localImageModules[normalizedPath] || imagePath;
}

const INITIAL_FORM = {
  name: "",
  brand: "CHRONOX",
  model: "",
  price: "",
  category: "",
  collection: "",
  description: "",
  image: "",
  stock: "",
  rating: "0",
  reviews: "0",
  material: "",
  size: "",
  limited: false,
  availability: "In Stock",
  features: "",
};

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

const inputClass =
  "w-full border border-white/10 bg-[#202020] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-[#666666] focus:border-white/30";

const labelClass =
  "mb-2 block text-xs font-medium text-[#aaaaaa]";

function AdminProducts() {
  const dispatch = useDispatch();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Controls which view is displayed.
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [deletingProductId, setDeletingProductId] = useState(null);

  // Form state.
  const [newProduct, setNewProduct] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch products from JSON Server.
  const refreshProducts = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(API_URL);

      setProducts(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (err) {
      console.error("Products API error:", err);

      setError(
        "Unable to load products. Make sure JSON Server is running on port 3000."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        const response = await axios.get(API_URL);

        if (!cancelled) {
          setProducts(
            Array.isArray(response.data) ? response.data : []
          );
          setError("");
        }
      } catch (err) {
        console.error("Products API error:", err);

        if (!cancelled) {
          setError(
            "Unable to load products. Make sure JSON Server is running on port 3000."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  // Search and category filtering.
  const filteredProducts = products.filter((product) => {
    const searchTerm = search.toLowerCase();

    const matchesSearch =
      String(product.name || "")
        .toLowerCase()
        .includes(searchTerm) ||
      String(product.model || "")
        .toLowerCase()
        .includes(searchTerm) ||
      String(product.collection || "")
        .toLowerCase()
        .includes(searchTerm);

    const matchesCategory =
      categoryFilter === "all" ||
      String(product.category || "").toLowerCase() ===
        categoryFilter.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const categories = [
    "all",
    ...new Set(
      products
        .map((product) => product.category)
        .filter(Boolean)
    ),
  ];

  // Update a form field.
  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;

    setNewProduct((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Allow the admin to choose an image file from their computer.
  // The image is stored as a data URL in JSON Server, so no upload server is required.
  const handleImageFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError("Please choose a valid image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setFormError("Please choose an image smaller than 3 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setNewProduct((previous) => ({
        ...previous,
        image: String(reader.result || ""),
      }));
      setFormError("");
    };
    reader.onerror = () => setFormError("Unable to read this image file.");
    reader.readAsDataURL(file);
  };

  // Open the form to create a new product.
  const handleOpenForm = () => {
    setEditingProductId(null);
    setNewProduct({ ...INITIAL_FORM });
    setFormError("");
    setSuccessMessage("");
    setShowAddForm(true);
  };

  // Open the same inline form with the selected product's existing data.
  const handleEditProduct = (product) => {
    setEditingProductId(product.id);
    setNewProduct({
      ...INITIAL_FORM,
      ...product,
      price: String(product.price ?? ""),
      stock: String(product.stock ?? ""),
      rating: String(product.rating ?? 0),
      reviews: String(product.reviews ?? 0),
      limited: Boolean(product.limited),
      availability: product.availability || "In Stock",
      features: Array.isArray(product.features)
        ? product.features.join(", ")
        : String(product.features || ""),
    });
    setFormError("");
    setSuccessMessage("");
    setShowAddForm(true);
  };

  // Return to the product list without saving changes.
  const handleCancelForm = () => {
    if (saving) return;

    setShowAddForm(false);
    setEditingProductId(null);
    setNewProduct({ ...INITIAL_FORM });
    setFormError("");
    setSuccessMessage("");
  };

  // Delete a product from JSON Server and update the table.
  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`Are you sure you want to delete "${product.name || "this product"}"?`)) {
      return;
    }

    setDeletingProductId(product.id);
    setError("");
    setSuccessMessage("");

    try {
      await axios.delete(`${API_URL}/${product.id}`);
      setProducts((current) => current.filter((item) => item.id !== product.id));
      dispatch(fetchProducts({ force: true }));
      setSuccessMessage("Product deleted successfully.");
    } catch (err) {
      console.error("Delete product error:", err);
      setError("Unable to delete the product. Check JSON Server and try again.");
    } finally {
      setDeletingProductId(null);
    }
  };

  // Save a new product to JSON Server.
  const handleSubmit = async (event) => {
    event.preventDefault();

    setFormError("");
    setSuccessMessage("");

    if (
      !String(newProduct.name ?? "").trim() ||
      !String(newProduct.model ?? "").trim() ||
      !String(newProduct.category ?? "").trim() ||
      !String(newProduct.collection ?? "").trim() ||
      !newProduct.price ||
      newProduct.stock === ""
    ) {
      setFormError(
        "Please fill in all required fields (Name, Model, Category, Collection, Price, and Stock)."
      );
      return;
    }

    const price = Number(newProduct.price);
    const stock = Number(newProduct.stock);
    const rating = Number(newProduct.rating);
    const reviews = Number(newProduct.reviews);

    if (
      !Number.isFinite(price) ||
      price <= 0 ||
      !Number.isFinite(stock) ||
      stock < 0 ||
      !Number.isInteger(stock) ||
      !Number.isFinite(rating) ||
      rating < 0 ||
      rating > 5 ||
      !Number.isFinite(reviews) ||
      reviews < 0
    ) {
      setFormError("Enter a valid price, stock, rating (0–5), and review count.");
      return;
    }

    const productData = {
      name: String(newProduct.name ?? "").trim(),
      brand: String(newProduct.brand ?? "").trim() || "CHRONOX",
      model: String(newProduct.model ?? "").trim(),
      price,
      category: String(newProduct.category ?? "").trim(),
      collection: String(newProduct.collection ?? "").trim(),
      description: String(newProduct.description ?? "").trim(),
      image: getProductImageSrc(String(newProduct.image ?? "").trim()),
      stock,
      rating,
      reviews,
      material: String(newProduct.material ?? "").trim(),
      size: String(newProduct.size ?? "").trim(),
      limited: newProduct.limited,
      availability:
        stock === 0 ? "Out of Stock" : newProduct.availability,
      features: Array.isArray(newProduct.features)
        ? newProduct.features.map((feature) => String(feature).trim()).filter(Boolean)
        : String(newProduct.features ?? "")
            .split(",")
            .map((feature) => feature.trim())
            .filter(Boolean),
    };

    setSaving(true);

    // Keep the operation type and ID stable throughout the request.
    const productIdToUpdate = editingProductId;
    const isUpdating = productIdToUpdate !== null && productIdToUpdate !== undefined;

    try {
      let savedProduct;

      if (isUpdating) {
        // PATCH updates only the submitted fields and preserves other existing fields.
        const response = await axios.patch(
          `${API_URL}/${encodeURIComponent(String(productIdToUpdate))}`,
          productData
        );
        savedProduct = response.data;

        // Update the local list immediately using the server response.
        setProducts((current) =>
          current.map((product) =>
            String(product.id) === String(productIdToUpdate)
              ? { ...product, ...savedProduct }
              : product
          )
        );
      } else {
        const response = await axios.post(API_URL, productData);
        savedProduct = response.data;
        setProducts((current) => [...current, savedProduct]);
      }

      // Fetch the latest list so the UI reflects the server's saved data.
      const listResponse = await axios.get(API_URL);
      setProducts(Array.isArray(listResponse.data) ? listResponse.data : []);
      dispatch(fetchProducts({ force: true }));

      setSearch("");
      setCategoryFilter("all");
      setNewProduct({ ...INITIAL_FORM });
      setShowAddForm(false);
      setEditingProductId(null);
      setSuccessMessage(
        isUpdating
          ? "Product updated successfully."
          : "Product added successfully."
      );

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Save product error:", err.response?.data || err);
      const serverMessage = err.response?.data?.message;

      setFormError(
        serverMessage
          ? `Unable to ${isUpdating ? "update" : "save"} product: ${serverMessage}`
          : `Unable to ${isUpdating ? "update" : "save"} the product. Check that JSON Server is running at ${API_URL} and inspect the browser console for details.`
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full bg-[#141414] text-[#f5f5f5]">
      {/* Page Header */}
      <div className="border-b border-white/10 px-5 py-6 sm:px-8">
        {/* Breadcrumbs */}
        <div className="mb-3 flex items-center gap-2 text-xs">
          <Link
            to="/admin"
            className="text-[#777777] transition hover:text-white hover:underline"
          >
            Admin
          </Link>

          <span className="text-[#444444]">/</span>

          <Link
            to="/admin/products"
            onClick={(event) => {
              event.preventDefault();

              if (!saving) {
                setShowAddForm(false);
                setEditingProductId(null);
                setNewProduct({ ...INITIAL_FORM });
                setFormError("");
                setSuccessMessage("");
              }
            }}
            className="text-[#777777] transition hover:text-white hover:underline"
          >
            Products
          </Link>

          {showAddForm && (
            <>
              <span className="text-[#444444]">/</span>
              <span className="text-white">{editingProductId !== null ? "Edit Product" : "Add Product"}</span>
            </>
          )}
        </div>

        {/* Header Title */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Watch
                size={15}
                className="text-[#999999]"
              />

              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#777777]">
                CHRONOX CMS
              </span>
            </div>

            <h1 className="text-2xl font-medium tracking-tight text-white">
              {showAddForm ? (editingProductId !== null ? "Edit Product" : "Add New Product") : "Products"}
            </h1>

            <p className="mt-2 text-xs text-[#858585]">
              {showAddForm
                ? editingProductId !== null
                  ? "Update the details of this timepiece."
                  : "Add a new timepiece to your product catalogue."
                : "Manage the CHRONOX luxury timepiece catalogue."}
            </p>
          </div>

          {/* Header Actions */}
          {!showAddForm ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenForm}
                className="inline-flex h-9 items-center justify-center gap-2 bg-white px-3 text-xs font-medium text-black transition hover:bg-gray-200"
              >
                <Plus size={14} />
                <span>Add Product</span>
              </button>

              <button
                type="button"
                onClick={refreshProducts}
                disabled={loading}
                className="inline-flex h-9 items-center justify-center gap-2 border border-white/10 bg-[#202020] px-3 text-xs font-medium text-[#cccccc] transition hover:border-white/25 hover:bg-[#292929] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  size={13}
                  className={
                    loading ? "animate-spin" : ""
                  }
                />

                <span>Refresh</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleCancelForm}
              disabled={saving}
              className="inline-flex h-9 items-center justify-center gap-2 border border-white/10 bg-[#202020] px-3 text-xs font-medium text-[#cccccc] transition hover:bg-[#292929] disabled:opacity-50"
            >
              <ArrowLeft size={14} />
              Back to Products
            </button>
          )}
        </div>

        {/* Product Count */}
        {!showAddForm && (
          <div className="mt-6 flex items-center gap-3 border-t border-white/[0.08] pt-4">
            <span className="text-xs text-[#777777]">
              Total products
            </span>

            <span className="border border-white/10 bg-[#202020] px-2.5 py-1 text-xs font-medium tabular-nums text-white">
              {loading ? "—" : products.length}
            </span>
          </div>
        )}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div
          role="status"
          className="mx-5 mt-5 border border-green-500/20 bg-green-500/[0.08] px-4 py-3 text-sm text-green-400 sm:mx-8"
        >
          {successMessage}
        </div>
      )}

      {/* ADD PRODUCT VIEW */}
      {showAddForm ? (
        <div className="p-5 sm:p-8">
          <form
            onSubmit={handleSubmit}
            className="mx-auto max-w-5xl space-y-6"
          >
            {/* Form Error */}
            {formError && (
              <div
                role="alert"
                className="border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-sm text-red-400"
              >
                {formError}
              </div>
            )}

            {/* Basic Information */}
            <section className="border border-white/10 bg-[#191919]">
              <div className="border-b border-white/10 px-5 py-4">
                <h2 className="text-sm font-medium text-white">
                  Basic Information
                </h2>

                <p className="mt-1 text-xs text-[#777777]">
                  Enter the product name and collection details.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    Product Name *
                  </label>

                  <input
                    name="name"
                    value={newProduct.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Space Timer Black Hole"
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Brand
                  </label>

                  <input
                    name="brand"
                    value={newProduct.brand}
                    onChange={handleInputChange}
                    placeholder="CHRONOX"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Model / Reference *
                  </label>

                  <input
                    name="model"
                    value={newProduct.model}
                    onChange={handleInputChange}
                    placeholder="e.g. CX-001"
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Category *
                  </label>

                  <input
                    name="category"
                    value={newProduct.category}
                    onChange={handleInputChange}
                    placeholder="e.g. Luxury"
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Collection *
                  </label>

                  <input
                    name="collection"
                    value={newProduct.collection}
                    onChange={handleInputChange}
                    placeholder="e.g. Space Timer"
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Price (INR) *
                  </label>

                  <input
                    type="number"
                    name="price"
                    value={newProduct.price}
                    onChange={handleInputChange}
                    placeholder="e.g. 150000"
                    min="1"
                    step="1"
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Material
                  </label>

                  <input
                    name="material"
                    value={newProduct.material}
                    onChange={handleInputChange}
                    placeholder="e.g. Stainless Steel"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Size
                  </label>

                  <input
                    name="size"
                    value={newProduct.size}
                    onChange={handleInputChange}
                    placeholder="e.g. 42mm"
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            {/* Product Image */}
            <section className="border border-white/10 bg-[#191919]">
              <div className="border-b border-white/10 px-5 py-4">
                <h2 className="text-sm font-medium text-white">
                  Product Image
                </h2>

                <p className="mt-1 text-xs text-[#777777]">
                  Choose an image from your computer, enter a web URL, or use a path such as /src/assets/images/watch-6.png.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-[1fr_180px]">
                <div>
                  <label className={labelClass}>
                    Image URL or local asset path
                  </label>

                  <input
                    type="text"
                    name="image"
                    value={newProduct.image.startsWith("data:") ? "" : newProduct.image}
                    onChange={handleInputChange}
                    placeholder="/src/assets/images/watch-6.png"
                    className={inputClass}
                  />

                  <label className={`${labelClass} mt-5`}>
                    Or choose an image from your folder
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="block w-full cursor-pointer text-xs text-[#aaaaaa] file:mr-3 file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-medium file:text-black hover:file:bg-gray-200"
                  />

                  <p className="mt-2 text-[11px] text-[#666666]">
                    Supported: PNG, JPG, WEBP, or another browser-supported image. Maximum 3 MB.
                  </p>
                </div>

                <div className="flex min-h-[160px] items-center justify-center overflow-hidden border border-white/10 bg-[#202020]">
                  {newProduct.image ? (
                    <img
                      src={getProductImageSrc(newProduct.image)}
                      alt="Product preview"
                      className="h-full max-h-[200px] w-full object-contain p-3"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="text-center text-[#666666]">
                      <ImageIcon
                        size={28}
                        className="mx-auto mb-2"
                      />

                      <span className="text-xs">
                        Image Preview
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Description */}
            <section className="border border-white/10 bg-[#191919]">
              <div className="border-b border-white/10 px-5 py-4">
                <h2 className="text-sm font-medium text-white">
                  Product Description
                </h2>
              </div>

              <div className="space-y-5 p-5">
                <div>
                  <label className={labelClass}>
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={newProduct.description}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Describe the watch, its design, and its features..."
                    className={`${inputClass} resize-y`}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Features
                  </label>

                  <textarea
                    name="features"
                    value={newProduct.features}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Automatic movement, Sapphire crystal, Water resistant"
                    className={`${inputClass} resize-y`}
                  />

                  <p className="mt-2 text-[11px] text-[#666666]">
                    Separate each feature with a comma.
                  </p>
                </div>
              </div>
            </section>

            {/* Inventory and Rating */}
            <section className="border border-white/10 bg-[#191919]">
              <div className="border-b border-white/10 px-5 py-4">
                <h2 className="text-sm font-medium text-white">
                  Inventory and Rating
                </h2>

                <p className="mt-1 text-xs text-[#777777]">
                  Configure stock, availability, and review information.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    Stock Quantity *
                  </label>

                  <input
                    type="number"
                    name="stock"
                    value={newProduct.stock}
                    onChange={handleInputChange}
                    placeholder="e.g. 10"
                    min="0"
                    step="1"
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Availability
                  </label>

                  <select
                    name="availability"
                    value={newProduct.availability}
                    onChange={handleInputChange}
                    className={inputClass}
                  >
                    <option value="In Stock">In Stock</option>
                    <option value="Out of Stock">
                      Out of Stock
                    </option>
                    <option value="Pre-Order">Pre-Order</option>
                    <option value="Coming Soon">Coming Soon</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>
                    Rating (0–5)
                  </label>

                  <input
                    type="number"
                    name="rating"
                    value={newProduct.rating}
                    onChange={handleInputChange}
                    min="0"
                    max="5"
                    step="0.1"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Number of Reviews
                  </label>

                  <input
                    type="number"
                    name="reviews"
                    value={newProduct.reviews}
                    onChange={handleInputChange}
                    min="0"
                    step="1"
                    className={inputClass}
                  />
                </div>

                <label className="flex cursor-pointer items-center gap-3 border border-white/10 bg-[#202020] p-4 md:col-span-2">
                  <input
                    type="checkbox"
                    name="limited"
                    checked={newProduct.limited}
                    onChange={handleInputChange}
                    className="h-4 w-4 accent-white"
                  />

                  <span>
                    <span className="block text-sm text-white">
                      Limited Edition
                    </span>

                    <span className="mt-1 block text-xs text-[#777777]">
                      Mark this watch as a limited-edition product.
                    </span>
                  </span>
                </label>
              </div>
            </section>

            {/* Form Actions */}
            <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleCancelForm}
                disabled={saving}
                className="inline-flex h-10 items-center justify-center gap-2 border border-white/10 bg-[#202020] px-5 text-xs font-medium text-white transition hover:bg-[#292929] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={14} />
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-10 items-center justify-center gap-2 bg-white px-5 text-xs font-medium text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw
                      size={14}
                      className="animate-spin"
                    />
                    Saving Product...
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    {editingProductId !== null ? "Update Product" : "Save Product"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* PRODUCT LIST VIEW */
        <>
          {/* Search and Filter Toolbar */}
          <div className="flex flex-col gap-4 border-b border-white/10 bg-[#191919] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            {/* Search */}
            <div className="relative w-full max-w-sm">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777777]"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search watches by name or model..."
                aria-label="Search products"
                className="h-9 w-full border border-white/10 bg-[#202020] pl-9 pr-3 text-xs text-white outline-none placeholder:text-[#666666] transition focus:border-white/30"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-3">
              <label
                htmlFor="product-category"
                className="shrink-0 text-xs text-[#888888]"
              >
                Category
              </label>

              <select
                id="product-category"
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(event.target.value)
                }
                className="h-9 max-w-[220px] border border-white/10 bg-[#202020] px-3 text-xs text-[#dddddd] outline-none focus:border-white/30"
              >
                {categories.map((category) => (
                  <option
                    key={category}
                    value={category}
                    className="bg-[#202020] text-white"
                  >
                    {category === "all"
                      ? "All Categories"
                      : category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Product Table */}
          <div className="space-y-4 p-5 sm:p-8">
            {error && (
              <div
                role="alert"
                className="border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-xs text-red-400"
              >
                {error}

                <button
                  type="button"
                  onClick={refreshProducts}
                  className="ml-2 underline underline-offset-2 hover:text-red-300"
                >
                  Try again
                </button>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium text-white">
                  Product collection
                </h2>

                <p className="mt-1 text-xs text-[#777777]">
                  Showing{" "}
                  {loading ? "—" : filteredProducts.length} of{" "}
                  {loading ? "—" : products.length} products
                </p>
              </div>

              {(search || categoryFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setCategoryFilter("all");
                  }}
                  className="text-xs text-[#999999] underline underline-offset-4 transition hover:text-white"
                >
                  Clear filters
                </button>
              )}
            </div>

            <div className="overflow-x-auto border border-white/10 bg-[#191919]">
              <table className="w-full min-w-[750px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/10 bg-[#202020]">
                    <th className="px-4 py-4 text-[10px] font-medium uppercase tracking-wider text-[#999999]">
                      ID
                    </th>

                    <th className="px-4 py-4 text-[10px] font-medium uppercase tracking-wider text-[#999999]">
                      Watch Name
                    </th>

                    <th className="px-4 py-4 text-[10px] font-medium uppercase tracking-wider text-[#999999]">
                      Model / Ref
                    </th>

                    <th className="px-4 py-4 text-[10px] font-medium uppercase tracking-wider text-[#999999]">
                      Collection
                    </th>

                    <th className="px-4 py-4 text-right text-[10px] font-medium uppercase tracking-wider text-[#999999]">
                      Price
                    </th>

                    <th className="px-4 py-4 text-right text-[10px] font-medium uppercase tracking-wider text-[#999999]">
                      Stock
                    </th>
                    <th className="px-4 py-4 text-right text-[10px] font-medium uppercase tracking-wider text-[#999999]">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.07]">
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="transition-colors hover:bg-[#222222]"
                    >
                      <td className="px-4 py-4 font-mono text-xs text-[#777777]">
                        #{product.id}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden border border-white/10 bg-[#252525]">
                            {product.image ? (
                              <img
                                src={getProductImageSrc(product.image)}
                                alt={product.name || "Watch"}
                                className="h-full w-full object-cover"
                                onError={(event) => {
                                  event.currentTarget.style.display =
                                    "none";
                                }}
                              />
                            ) : (
                              <Watch
                                size={16}
                                className="text-[#666666]"
                              />
                            )}
                          </div>

                          <span className="max-w-[220px] text-xs font-medium leading-5 text-[#eeeeee]">
                            {product.name || "Unnamed product"}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-4 font-mono text-xs text-[#888888]">
                        {product.model || "—"}
                      </td>

                      <td className="px-4 py-4 text-xs text-[#aaaaaa]">
                        {product.collection ||
                          product.category ||
                          "—"}
                      </td>

                      <td className="px-4 py-4 text-right text-xs font-medium tabular-nums text-[#eeeeee]">
                        {formatCurrency(product.price)}
                      </td>

                      <td className="px-4 py-4 text-right">
                        <span
                          className={`inline-flex items-center gap-1.5 whitespace-nowrap border px-2 py-1 text-[10px] ${
                            Number(product.stock ?? 0) === 0
                              ? "border-red-500/20 bg-red-500/[0.08] font-medium text-red-400"
                              : Number(product.stock ?? 0) <= 5
                                ? "border-amber-500/20 bg-amber-500/[0.08] font-medium text-amber-400"
                                : "border-white/10 text-[#aaaaaa]"
                          }`}
                        >
                          {(Number(product.stock ?? 0) === 0 ||
                            Number(product.stock ?? 0) <= 5) && (
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          )}

                          {product.stock ?? 0} in stock
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditProduct(product)}
                            disabled={saving || deletingProductId !== null}
                            aria-label={`Edit ${product.name || "product"}`}
                            title="Edit product"
                            className="inline-flex h-8 items-center gap-1.5 border border-white/10 px-2.5 text-xs text-[#dddddd] transition hover:border-white/30 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Pencil size={13} />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(product)}
                            disabled={deletingProductId !== null || saving}
                            aria-label={`Delete ${product.name || "product"}`}
                            title="Delete product"
                            className="inline-flex h-8 items-center gap-1.5 border border-red-500/20 px-2.5 text-xs text-red-400 transition hover:border-red-500/50 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 size={13} />
                            {deletingProductId === product.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {!loading &&
                    filteredProducts.length === 0 &&
                    !error && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-16 text-center"
                        >
                          <Search
                            size={22}
                            className="mx-auto mb-3 text-[#555555]"
                          />

                          <p className="text-sm text-[#cccccc]">
                            No products found
                          </p>

                          <p className="mt-1 text-xs text-[#777777]">
                            Try changing your search or category filter.
                          </p>
                        </td>
                      </tr>
                    )}

                  {loading && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-16 text-center"
                      >
                        <RefreshCw
                          size={18}
                          className="mx-auto mb-3 animate-spin text-[#777777]"
                        />

                        <p className="text-xs text-[#888888]">
                          Loading products...
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="flex flex-col justify-between gap-2 border-t border-white/10 pt-4 sm:flex-row sm:items-center">
              <p className="text-[10px] text-[#666666]">
                CHRONOX · PRODUCT MANAGEMENT
              </p>

              <p className="text-[10px] text-[#666666]">
                Inventory data from JSON Server
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminProducts;