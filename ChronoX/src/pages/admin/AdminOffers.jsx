import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Tag, Check, ImagePlus, RefreshCw, Save, Upload, Clock3, Plus, X, Trash2 } from "lucide-react";
import { normalizeCoupon } from "../../utils/couponUtils";
import { fallbackProducts } from "../../data/fallbackProducts";

const API_BASE = "http://localhost:3000";
const OFFERS_URL = `${API_BASE}/offers`;
const SETTINGS_URL = `${API_BASE}/offerSettings/1`;

const DEFAULT_SETTINGS = {
  id: "1",
  enabled: true,
  title: "CHRONOX Event Offer",
  description: "Limited-time offers on selected timepieces.",
  image: "",
  eventStart: "",
  eventEnd: "",
  buttonText: "Explore Offer",
  buttonLink: "/dashboard",
};

const INITIAL_OFFERS = [
  {
    id: "OFFER-01",
    title: "Space Timer Inaugural Privilege",
    code: "SPACETIMER15",
    discount: "15% OFF",
    scope: "Space Timer Collection",
    status: "Active",
    validTill: "2026-12-31",
  },
  {
    id: "OFFER-02",
    title: "Tourbillon Heritage Collector Bonus",
    code: "TOURBILLON10",
    discount: "10% OFF",
    scope: "Tourbillon Timepieces",
    status: "Active",
    validTill: "2026-11-30",
  },
  {
    id: "OFFER-03",
    title: "Premier Horology Complimentary Vault Service",
    code: "VIPCONCIERGE",
    discount: "Complimentary Service",
    scope: "All Orders Above ₹2,00,000",
    status: "Active",
    validTill: "Permanent",
  },
];


function getOfferStatus(offer) {
  if (offer.status === "Paused") return "Paused";
  if (String(offer.validTill || "").toLowerCase() === "permanent") return "Active";
  if (offer.validTill) {
    const expiresAt = new Date(`${offer.validTill}T23:59:59`);
    if (!Number.isNaN(expiresAt.getTime()) && expiresAt < new Date()) return "Expired";
  }
  return "Active";
}

function isBannerCurrentlyActive(settings) {
  if (!settings?.enabled || !settings?.image) return false;
  const now = new Date();
  if (settings.eventStart) {
    const start = new Date(settings.eventStart);
    if (!Number.isNaN(start.getTime()) && now < start) return false;
  }
  if (settings.eventEnd) {
    const end = new Date(settings.eventEnd);
    if (!Number.isNaN(end.getTime()) && now > end) return false;
  }
  return true;
}

function statusClasses(status) {
  if (status === "Expired") return "border-red-500/20 bg-red-500/[0.08] text-red-300";
  if (status === "Paused") return "border-amber-500/20 bg-amber-500/[0.08] text-amber-300";
  return "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-400";
}

const EMPTY_OFFER = { title: "", code: "", discount: "", scope: "", validTill: "" };

function AdminOffers() {
  const [offers, setOffers] = useState([]);
  const [products, setProducts] = useState(fallbackProducts);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addingOffer, setAddingOffer] = useState(false);
  const [newOffer, setNewOffer] = useState(EMPTY_OFFER);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        const [offersResult, settingsResult, productsResult] = await Promise.allSettled([
          axios.get(OFFERS_URL),
          // Query the collection directly: /offerSettings/1 legitimately returns
          // 404 when no record exists or JSON Server assigned another ID.
          axios.get(`${API_BASE}/offerSettings`),
          axios.get(`${API_BASE}/products`),
        ]);

        if (cancelled) return;

        if (offersResult.status === "fulfilled" && Array.isArray(offersResult.value.data)) {
          setOffers(offersResult.value.data);
        } else {
          console.error("Could not load /offers", offersResult.reason);
          setError("Could not load coupon offers. Check JSON Server and the offers array in db.json.");
        }

        if (settingsResult.status === "fulfilled") {
          const list = Array.isArray(settingsResult.value.data) ? settingsResult.value.data : [];
          const record = list.find((item) => String(item.id) === "1") || list[0] || null;
          setSettings(record ? { ...DEFAULT_SETTINGS, ...record } : { ...DEFAULT_SETTINGS, enabled: false, image: "" });
        } else {
          console.error("Could not load /offerSettings", settingsResult.reason);
          setSettings({ ...DEFAULT_SETTINGS, enabled: false, image: "" });
          setError("Could not load banner settings. Check that db.json contains an offerSettings array.");
        }

        if (productsResult.status === "fulfilled" && Array.isArray(productsResult.value.data) && productsResult.value.data.length > 0) {
          setProducts(productsResult.value.data);
        }
      } catch (err) {
        console.error("Unable to load offers:", err);
        if (!cancelled) setError("Unable to connect to JSON Server on port 3000.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSettings();
    return () => { cancelled = true; };
  }, []);

  const collectionList = useMemo(() => {
    const list = products && products.length > 0 ? products : fallbackProducts;
    const set = new Set();
    list.forEach((p) => {
      if (p.collection) set.add(p.collection);
    });
    return Array.from(set).sort();
  }, [products]);

  const updateSetting = (field, value) => {
    setSettings((current) => ({ ...current, [field]: value }));
    setMessage("");
  };

  const handleImageFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError("Choose an image smaller than 3 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateSetting("image", String(reader.result || ""));
      setError("");
    };
    reader.onerror = () => setError("Unable to read this image file.");
    reader.readAsDataURL(file);
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      // Always find the real record first instead of assuming its ID is "1".
      const listResponse = await axios.get(`${API_BASE}/offerSettings`);
      const list = Array.isArray(listResponse.data) ? listResponse.data : [];
      const existing = list.find((item) => String(item.id) === String(settings.id))
        || list.find((item) => String(item.id) === "1")
        || list[0]
        || null;

      const payload = {
        ...settings,
        enabled: Boolean(settings.enabled),
        image: String(settings.image || "").trim(),
        updatedAt: new Date().toISOString(),
      };

      let savedRecord;
      if (existing && existing.id != null) {
        savedRecord = { ...payload, id: existing.id };
        const response = await axios.put(
          `${API_BASE}/offerSettings/${encodeURIComponent(existing.id)}`,
          savedRecord,
        );
        savedRecord = response.data || savedRecord;
      } else {
        // Use a stable string ID so the homepage can identify the singleton.
        savedRecord = { ...payload, id: "1" };
        const response = await axios.post(`${API_BASE}/offerSettings`, savedRecord);
        savedRecord = response.data || savedRecord;
      }

      setSettings({ ...DEFAULT_SETTINGS, ...savedRecord });
      setMessage("Offer banner saved successfully. It will appear when enabled and within its event dates.");
    } catch (err) {
      console.error("Save offer settings error:", err.response?.data || err);
      setError(`Could not save banner${err.response?.status ? ` (HTTP ${err.response.status})` : ""}. Make sure JSON Server is running and db.json contains an offerSettings array.`);
    } finally {
      setSaving(false);
    }
  };

  const updateNewOffer = (field, value) => {
    setNewOffer((current) => ({ ...current, [field]: value }));
    setError("");
    setMessage("");
  };

  const addOffer = async (event) => {
    event.preventDefault();
    setAddingOffer(true);
    setError("");
    setMessage("");

    const normalized = normalizeCoupon({
      title: newOffer.title.trim(),
      code: newOffer.code.trim().toUpperCase(),
      discount: newOffer.discount.trim(),
      scope: newOffer.scope.trim(),
      validTill: newOffer.validTill,
    });

    const payload = {
      id: `OFFER-${Date.now()}`,
      title: newOffer.title.trim(),
      code: newOffer.code.trim().toUpperCase(),
      discount: newOffer.discount.trim(),
      discountType: normalized.discountType,
      discountValue: normalized.discountValue,
      scope: newOffer.scope.trim(),
      scopeType: normalized.scopeType,
      scopeValue: normalized.scopeValue,
      minOrderAmount: normalized.minOrderAmount,
      validTill: newOffer.validTill,
      status: "Active",
      createdAt: new Date().toISOString(),
    };

    if (!payload.title || !payload.code || !payload.discount || !payload.scope || !payload.validTill) {
      setError("Complete all fields before adding a new offer.");
      setAddingOffer(false);
      return;
    }
    if (offers.some((offer) => String(offer.code).toUpperCase() === payload.code)) {
      setError("That coupon code already exists. Please use a different code.");
      setAddingOffer(false);
      return;
    }

    try {
      const response = await axios.post(OFFERS_URL, payload);
      setOffers((current) => [...current, response.data || payload]);
      setNewOffer(EMPTY_OFFER);
      setShowAddForm(false);
      setMessage("New offer added to the list.");
    } catch (err) {
      console.error("Add offer error:", err.response?.data || err);
      setError(
        !err.response
          ? "Cannot connect to JSON Server. Make sure it is running on port 3000."
          : `Could not add offer (HTTP ${err.response.status}). Check that db.json contains an offers array.`
      );
    } finally {
      setAddingOffer(false);
    }
  };

  const toggleOfferStatus = async (offer) => {
    const currentStatus = getOfferStatus(offer);
    if (currentStatus === "Expired") {
      setError("This offer has expired. Extend its validity date before reactivating it.");
      return;
    }
    const nextStatus = offer.status === "Paused" ? "Active" : "Paused";
    try {
      await axios.patch(`${OFFERS_URL}/${offer.id}`, { status: nextStatus });
      setOffers((current) => current.map((item) => item.id === offer.id ? { ...item, status: nextStatus } : item));
      setMessage(`${offer.title} is now ${nextStatus.toLowerCase()}.`);
      setError("");
    } catch (err) {
      console.error("Update offer status error:", err.response?.data || err);
      setError("Could not update offer status. Check the offer ID and JSON Server.");
    }
  };

  const deleteOffer = async (offer) => {
    if (!window.confirm(`Delete the offer "${offer.title}" (${offer.code})?`)) return;

    try {
      await axios.delete(`${OFFERS_URL}/${encodeURIComponent(offer.id)}`);
      setOffers((current) => current.filter((item) => String(item.id) !== String(offer.id)));
      setMessage(`Offer "${offer.title}" deleted.`);
      setError("");
    } catch (err) {
      console.error("Delete offer error:", err.response?.data || err);
      setError(`Could not delete offer${err.response?.status ? ` (HTTP ${err.response.status})` : ""}. Check JSON Server and the offer ID.`);
    }
  };

  const deleteStorefrontBanner = async () => {
    if (!window.confirm("Delete the storefront event banner? The homepage will return to its original image-home.png hero.")) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      let records = [];

      try {
        const listResponse = await axios.get(`${API_BASE}/offerSettings`);
        records = Array.isArray(listResponse.data) ? listResponse.data : [];
      } catch {
        // Continue using the known record ID if collection fetch is unavailable.
      }

      const ids = records.length
        ? records.map((record) => record.id).filter((id) => id != null)
        : [settings.id || "1"];

      let deleteSucceeded = false;
      let deleteError = null;

      for (const id of ids) {
        try {
          await axios.delete(`${API_BASE}/offerSettings/${encodeURIComponent(id)}`);
          deleteSucceeded = true;
        } catch (err) {
          if (err.response?.status !== 404) deleteError = err;
        }
      }

      // If DELETE is not supported or fails, deactivate and clear the image instead.
      if (!deleteSucceeded && deleteError) {
        const fallbackPayload = {
          ...DEFAULT_SETTINGS,
          id: settings.id || "1",
          enabled: false,
          image: "",
          updatedAt: new Date().toISOString(),
        };

        try {
          await axios.put(`${API_BASE}/offerSettings/${encodeURIComponent(fallbackPayload.id)}`, fallbackPayload);
        } catch (putError) {
          if (putError.response?.status !== 404) throw putError;
          await axios.patch(`${API_BASE}/offerSettings/${encodeURIComponent(fallbackPayload.id)}`, {
            enabled: false,
            image: "",
            updatedAt: fallbackPayload.updatedAt,
          });
        }
      }

      setSettings({ ...DEFAULT_SETTINGS, enabled: false, image: "" });
      setMessage("Storefront banner removed. The homepage will use its original hero image.");
    } catch (err) {
      console.error("Delete storefront banner error:", err.response?.data || err);
      setError(`Could not remove the storefront banner${err.response?.status ? ` (HTTP ${err.response.status})` : ""}. Check that JSON Server is running on port 3000 and that offerSettings exists in db.json.`);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error("Unable to copy coupon code:", err);
      setError("Could not copy the coupon code. Please copy it manually.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#141414] text-[#f5f5f5]">
      <div className="border-b border-white/10 px-5 py-6 sm:px-8">
        <div className="mb-3 flex items-center gap-2 text-xs text-[#777777]">
          <Link to="/admin" className="transition hover:text-white hover:underline">Admin</Link>
          <span>/</span>
          <span className="text-white">Offers</span>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Tag size={16} className="text-[#a3a3a3]" />
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#777777]">CHRONOX CMS</span>
            </div>
            <h1 className="text-2xl font-medium tracking-tight text-white">Promotional Offers</h1>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-[#858585]">
              Configure the storefront offer banner, image, event countdown, and coupon campaigns.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start border border-white/10 bg-[#202020] px-4 py-3">
            <div>
              <span className="block text-xs text-[#888888]">Coupon campaigns</span>
              <span className="text-lg font-medium tabular-nums text-white">{offers.length}</span>
            </div>
            <div className="border-l border-white/10 pl-4">
              <span className="block text-xs text-[#888888]">Active</span>
              <span className="text-lg font-medium tabular-nums text-emerald-400">{offers.filter((offer) => getOfferStatus(offer) === "Active").length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8 p-5 sm:p-8">
        {(error || message) && (
          <div role={error ? "alert" : "status"} className={`border px-4 py-3 text-xs ${error ? "border-red-500/20 bg-red-500/10 text-red-300" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"}`}>
            {error || message}
          </div>
        )}

        <section className="border border-white/10 bg-[#191919]">
          <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
            <ImagePlus size={17} className="text-gray-300" />
            <div>
              <h2 className="text-sm font-medium text-white">Storefront event banner</h2>
              <p className="mt-1 text-xs text-gray-500">This banner is displayed on the home page when enabled and within its event time.</p>
            </div>
          </div>

          <div className="grid gap-4 border-b border-white/10 p-5 md:grid-cols-[180px_1fr_auto] md:items-center">
            <div className="flex h-28 items-center justify-center overflow-hidden border border-white/10 bg-[#202020]">
              {settings.image ? (
                <img src={settings.image} alt={settings.title || "Storefront banner"} className="h-full w-full object-contain p-2" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-600"><ImagePlus size={22} /><span className="text-[10px]">No banner image</span></div>
              )}
            </div>
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-2 border px-2.5 py-1 text-[10px] ${isBannerCurrentlyActive(settings) ? "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-400" : "border-white/10 bg-white/[0.04] text-gray-400"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isBannerCurrentlyActive(settings) ? "bg-emerald-400" : "bg-gray-500"}`} />
                  {isBannerCurrentlyActive(settings) ? "ACTIVE ON STOREFRONT" : settings.enabled && settings.image ? "SCHEDULED / INACTIVE" : "NOT PUBLISHED"}
                </span>
                {settings.eventEnd && <span className="text-[10px] text-gray-500">Ends {new Date(settings.eventEnd).toLocaleString()}</span>}
              </div>
              <h3 className="text-sm font-medium text-white">{settings.title || "Untitled storefront banner"}</h3>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-gray-500">{settings.description || "No banner description configured."}</p>
            </div>
            <button type="button" onClick={deleteStorefrontBanner} disabled={saving || (!settings.image && !settings.enabled)} className="inline-flex h-10 items-center justify-center gap-2 border border-red-500/30 px-3 text-xs text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40">
              <Trash2 size={14} /> Delete banner
            </button>
          </div>

          <form onSubmit={saveSettings} className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-2">
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-xs text-gray-300">
                <input
                  type="checkbox"
                  checked={Boolean(settings.enabled)}
                  onChange={(e) => updateSetting("enabled", e.target.checked)}
                  className="h-4 w-4 accent-white"
                />
                Enable event banner
              </label>

              <Field label="Offer title" value={settings.title} onChange={(value) => updateSetting("title", value)} placeholder="Black Friday Watch Event" />
              <Field label="Offer description" value={settings.description} onChange={(value) => updateSetting("description", value)} placeholder="Limited-time offer on selected watches" />
              <Field label="Button text" value={settings.buttonText} onChange={(value) => updateSetting("buttonText", value)} placeholder="Shop offer" />
              <Field label="Button destination" value={settings.buttonLink} onChange={(value) => updateSetting("buttonLink", value)} placeholder="/dashboard" />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs text-gray-400">Event starts</label>
                  <input type="datetime-local" value={settings.eventStart || ""} onChange={(e) => updateSetting("eventStart", e.target.value)} className="h-10 w-full border border-white/10 bg-[#141414] px-3 text-xs text-white outline-none focus:border-white/30" />
                </div>
                <div>
                  <label className="mb-2 block text-xs text-gray-400">Event ends</label>
                  <input type="datetime-local" value={settings.eventEnd || ""} onChange={(e) => updateSetting("eventEnd", e.target.value)} className="h-10 w-full border border-white/10 bg-[#141414] px-3 text-xs text-white outline-none focus:border-white/30" />
                </div>
              </div>
              <p className="text-[10px] leading-5 text-gray-500">
                Leave start/end blank to show the banner whenever it is enabled. If dates are set, the countdown runs until the end time.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs text-gray-400">Offer image URL or local asset path</label>
                <input
                  type="text"
                  value={settings.image || ""}
                  onChange={(e) => updateSetting("image", e.target.value)}
                  placeholder="/src/assets/images/offer-banner.png or https://..."
                  className="h-10 w-full border border-white/10 bg-[#141414] px-3 text-xs text-white outline-none placeholder:text-gray-600 focus:border-white/30"
                />
              </div>

              <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 border border-white/10 bg-[#222222] px-4 py-3 text-xs text-gray-200 transition hover:border-white/30 hover:bg-[#292929]">
                <Upload size={14} />
                Upload image from computer (max 3 MB)
                <input type="file" accept="image/*" onChange={handleImageFile} className="sr-only" />
              </label>

              <div className="overflow-hidden border border-white/10 bg-[#202020]">
                <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500">Image preview</span>
                  {settings.image && <button type="button" onClick={() => updateSetting("image", "")} className="text-[10px] text-gray-400 underline hover:text-white">Remove image</button>}
                </div>
                {settings.image ? (
                  <img src={settings.image} alt="Offer banner preview" className="h-52 w-full object-contain p-2" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                ) : (
                  <div className="flex h-52 flex-col items-center justify-center gap-2 text-gray-600">
                    <ImagePlus size={24} />
                    <span className="text-xs">Choose an offer image to preview it</span>
                  </div>
                )}
              </div>

              <button type="submit" disabled={saving || loading} className="inline-flex h-10 w-full items-center justify-center gap-2 bg-white px-4 text-xs font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50">
                {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? "Saving settings..." : "Save banner settings"}
              </button>
            </div>
          </form>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-sm font-medium text-white">Coupon campaigns</h2>
              <p className="mt-1 text-xs text-[#777777]">Expired campaigns are automatically labelled Expired. New campaigns are saved to JSON Server.</p>
            </div>
            <button type="button" onClick={() => { setShowAddForm((value) => !value); setError(""); setMessage(""); }} className="inline-flex h-10 items-center justify-center gap-2 border border-white/15 bg-white px-4 text-xs font-semibold text-black transition hover:bg-gray-200">
              {showAddForm ? <X size={14} /> : <Plus size={14} />}
              {showAddForm ? "Cancel" : "Add new offer"}
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={addOffer} className="grid grid-cols-1 gap-4 border border-white/10 bg-[#191919] p-5 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Campaign title" value={newOffer.title} onChange={(value) => updateNewOffer("title", value)} placeholder="Summer Watch Event" />
              <Field label="Coupon code" value={newOffer.code} onChange={(value) => updateNewOffer("code", value.toUpperCase())} placeholder="SUMMER15" />
              <Field label="Discount / benefit" value={newOffer.discount} onChange={(value) => updateNewOffer("discount", value)} placeholder="15% OFF" />
              <div>
                <Field
                  label="Target scope"
                  value={newOffer.scope}
                  onChange={(value) => updateNewOffer("scope", value)}
                  placeholder="All watches"
                />
                <div className="mt-2">
                  <label className="mb-1 block text-[11px] text-gray-400">
                    Select eligible item or scope:
                  </label>
                  <select
                    value={
                      collectionList.some((col) => `${col} Collection` === newOffer.scope) ||
                      (products.length > 0 ? products : fallbackProducts).some(
                        (item) => `Product: ${item.name} (ID: ${item.id})` === newOffer.scope
                      ) ||
                      [
                        "All watches",
                        "All Orders Above ₹2,00,000",
                        "All Orders Above ₹1,00,000",
                        "All Orders Above ₹50,000",
                      ].includes(newOffer.scope)
                        ? newOffer.scope
                        : ""
                    }
                    onChange={(e) => {
                      if (e.target.value) {
                        updateNewOffer("scope", e.target.value);
                      }
                    }}
                    className="h-10 w-full border border-white/10 bg-[#141414] px-3 text-xs text-white outline-none focus:border-white/30"
                  >
                    <option value="">-- Choose an item or collection to select --</option>

                    <optgroup label="Select Specific Item (Timepieces)">
                      {(products.length > 0 ? products : fallbackProducts).map((item) => (
                        <option key={item.id} value={`Product: ${item.name} (ID: ${item.id})`}>
                          {item.name} · {item.collection || "CHRONOX"} (ID: {item.id})
                        </option>
                      ))}
                    </optgroup>

                    <optgroup label="Watch Collections">
                      {collectionList.map((col) => (
                        <option key={col} value={`${col} Collection`}>
                          {col} Collection
                        </option>
                      ))}
                    </optgroup>

                    <optgroup label="Storewide / Order Scope">
                      <option value="All watches">All watches (Storewide)</option>
                      <option value="All Orders Above ₹2,00,000">All Orders Above ₹2,00,000</option>
                      <option value="All Orders Above ₹1,00,000">All Orders Above ₹1,00,000</option>
                      <option value="All Orders Above ₹50,000">All Orders Above ₹50,000</option>
                    </optgroup>
                  </select>
                </div>
                <p className="mt-1 text-[10px] text-gray-500">
                  Select an item above to apply directly, or customize the scope text above.
                </p>
              </div>
              <div>
                <label className="mb-2 block text-xs text-gray-400">Valid until</label>
                <input type="date" value={newOffer.validTill} onChange={(e) => updateNewOffer("validTill", e.target.value)} className="h-10 w-full border border-white/10 bg-[#141414] px-3 text-xs text-white outline-none focus:border-white/30" required />
                <p className="mt-1 text-[10px] text-gray-500">After this date, the offer displays as Expired.</p>
              </div>
              <div className="flex items-end">
                <button type="submit" disabled={addingOffer} className="inline-flex h-10 w-full items-center justify-center gap-2 bg-white px-4 text-xs font-semibold text-black transition hover:bg-gray-200 disabled:opacity-50">
                  {addingOffer ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                  {addingOffer ? "Adding..." : "Save new offer"}
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto border border-white/10 bg-[#191919]">
            <table className="w-full min-w-[850px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10 bg-[#202020]">
                  {["Campaign", "Coupon code", "Benefit", "Target scope", "Status", "Validity", "Actions"].map((heading) => (
                    <th key={heading} className="px-4 py-4 text-[10px] font-medium uppercase tracking-wider text-[#999999]">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.07]">
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-xs text-gray-500">Loading offers...</td></tr>
                ) : offers.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-xs text-gray-500">No offers yet. Click “Add new offer” to create one.</td></tr>
                ) : offers.map((offer) => {
                  const currentStatus = getOfferStatus(offer);
                  return (
                  <tr key={offer.id} className="transition-colors hover:bg-[#222222]">
                    <td className="px-4 py-5">
                      <p className="max-w-[220px] text-xs font-medium leading-5 text-[#eeeeee]">{offer.title}</p>
                      <p className="mt-1 text-[10px] text-[#666666]">{offer.id}</p>
                    </td>
                    <td className="px-4 py-5">
                      <button type="button" onClick={() => handleCopy(offer.code)} className="inline-flex items-center gap-2 border border-white/10 bg-[#252525] px-2.5 py-2 font-mono text-[10px] text-[#e5e5e5] hover:border-white/30 hover:bg-[#303030]">
                        <span>{offer.code}</span>
                        {copiedCode === offer.code ? <Check size={12} className="text-emerald-400" /> : <Tag size={11} className="text-[#777777]" />}
                      </button>
                      {copiedCode === offer.code && <p className="mt-1.5 text-[10px] text-emerald-400">Copied to clipboard</p>}
                    </td>
                    <td className="px-4 py-5 text-xs font-medium text-[#eeeeee]">{offer.discount}</td>
                    <td className="px-4 py-5 text-xs leading-5 text-[#999999]">{offer.scope}</td>
                    <td className="px-4 py-5"><span className={`inline-flex items-center gap-2 border px-2.5 py-1.5 text-[10px] ${statusClasses(currentStatus)}`}><span className={`h-1.5 w-1.5 rounded-full ${currentStatus === "Expired" ? "bg-red-300" : currentStatus === "Paused" ? "bg-amber-300" : "bg-emerald-400"}`} />{currentStatus}</span></td>
                    <td className="px-4 py-5 text-right text-xs tabular-nums text-[#888888]">{offer.validTill || "—"}</td>
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-2">
                        {currentStatus === "Expired" ? <span className="text-[10px] text-red-300/70">Ended</span> : <button type="button" onClick={() => toggleOfferStatus(offer)} className="border border-white/10 px-2.5 py-2 text-[10px] text-gray-300 transition hover:border-white/30 hover:text-white">{offer.status === "Paused" ? "Resume" : "Pause"}</button>}
                        <button type="button" onClick={() => deleteOffer(offer)} aria-label={`Delete ${offer.title}`} title="Delete offer" className="inline-flex h-8 w-8 items-center justify-center border border-red-500/20 text-red-300 transition hover:bg-red-500/10"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ); })}
              </tbody>
            </table>
          </div>
        </section>

        <div className="flex items-center gap-2 border-t border-white/10 pt-4 text-[10px] text-[#666666]">
          <Clock3 size={12} />
          <span>CHRONOX · ADMINISTRATION · {loading ? "Loading settings..." : "Offer banner configuration"}</span>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="mb-2 block text-xs text-gray-400">{label}</label>
      <input type="text" value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-10 w-full border border-white/10 bg-[#141414] px-3 text-xs text-white outline-none placeholder:text-gray-600 focus:border-white/30" />
    </div>
  );
}

export default AdminOffers;
