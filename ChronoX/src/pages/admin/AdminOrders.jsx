import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  Search,
  RefreshCw,
  Eye,
  X,
  Package,
  MapPin,
  CreditCard,
  UserRound,
  CalendarDays,
  CheckCircle2,
  Tag,
} from "lucide-react";

const API_URL = "http://localhost:3000/orders";

// Keep these values compatible with the customer's order-tracking timeline.
const ORDER_STATUSES = [
  "confirmed",
  "processing",
  "shipped",
  "out for delivery",
  "delivered",
  "cancelled",
];

function normalizeStatus(value) {
  const status = String(value || "confirmed").trim().toLowerCase();
  if (["pending", "placed", "order placed", "confirmed"].includes(status)) return "confirmed";
  if (["out_for_delivery", "out-for-delivery", "out for delivery"].includes(status)) return "out for delivery";
  if (["packed", "processing"].includes(status)) return "processing";
  if (["canceled", "cancelled"].includes(status)) return "cancelled";
  if (["shipped", "delivered"].includes(status)) return status;
  return status;
}

function displayStatus(value) {
  const normalized = normalizeStatus(value);
  if (normalized === "out for delivery") return "Out for Delivery";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
}

function getOrderAmount(order) {
  const direct = Number(order.totalAmount ?? order.total ?? order.amount);
  if (Number.isFinite(direct) && direct > 0) return direct;

  if (Array.isArray(order.items)) {
    return order.items.reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
      0
    );
  }

  return 0;
}

function getStatusStyle(status) {
  switch (normalizeStatus(status)) {
    case "delivered":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
    case "processing":
      return "border-blue-500/30 bg-blue-500/10 text-blue-400";
    case "cancelled":
      return "border-red-500/30 bg-red-500/10 text-red-400";
    case "shipped":
      return "border-purple-500/30 bg-purple-500/10 text-purple-400";
    case "confirmed":
      return "border-amber-500/30 bg-amber-500/10 text-amber-400";
    case "out for delivery":
      return "border-cyan-500/30 bg-cyan-500/10 text-cyan-300";
    default:
      return "border-white/10 bg-white/5 text-gray-400";
  }
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function displayValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const refreshOrders = async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    setError("");

    try {
      const response = await axios.get(API_URL);
      const nextOrders = Array.isArray(response.data) ? response.data : [];
      setOrders(nextOrders);

      if (selectedOrder) {
        const refreshedSelected = nextOrders.find(
          (order) => String(order.id) === String(selectedOrder.id)
        );
        if (refreshedSelected) {
          setSelectedOrder(refreshedSelected);
          setNewStatus(normalizeStatus(refreshedSelected.status));
        }
      }
    } catch (err) {
      console.error("Orders API error:", err);
      setError("Unable to load orders. Check whether JSON Server is running.");
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      try {
        const response = await axios.get(API_URL);
        if (!cancelled) {
          setOrders(Array.isArray(response.data) ? response.data : []);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Orders API error:", err);
          setError("Unable to load orders. Check whether JSON Server is running.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadOrders();
    return () => {
      cancelled = true;
    };
  }, []);

  const openOrder = (order) => {
    setSelectedOrder(order);
    setNewStatus(normalizeStatus(order.status));
    setNotice("");
    setError("");
  };

  const closeOrder = () => {
    if (updatingStatus) return;
    setSelectedOrder(null);
    setNewStatus("");
  };

  const handleStatusUpdate = async (event) => {
    event.preventDefault();
    if (!selectedOrder || !newStatus) return;

    const currentStatus = String(selectedOrder.status || "pending").toLowerCase();
    if (newStatus === currentStatus) {
      setNotice("The order already has this status.");
      return;
    }

    setUpdatingStatus(true);
    setError("");
    setNotice("");

    try {
      const canonicalStatus = displayStatus(newStatus);
      const statusTimestamp = new Date().toISOString();

      const response = await axios.patch(
        `${API_URL}/${encodeURIComponent(selectedOrder.id)}`,
        {
          status: canonicalStatus,
          statusUpdatedAt: statusTimestamp,
          updatedAt: statusTimestamp,
        }
      );
      const updatedOrder = response.data || {
        ...selectedOrder,
        status: canonicalStatus,
        statusUpdatedAt: statusTimestamp,
        updatedAt: statusTimestamp,
      };

      setOrders((current) =>
        current.map((order) =>
          String(order.id) === String(selectedOrder.id)
            ? { ...order, ...updatedOrder }
            : order
        )
      );
      setSelectedOrder((current) =>
        current && String(current.id) === String(selectedOrder.id)
          ? { ...current, ...updatedOrder }
          : current
      );
      setNewStatus(normalizeStatus(updatedOrder.status));
      setNotice(
        `Order #${selectedOrder.id} status updated to ${canonicalStatus}.`
      );
    } catch (err) {
      console.error("Order status update error:", err);
      setError(
        err.response?.data?.message ||
          "Unable to update the order status. Check JSON Server and try again."
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const customer =
      order.address?.name ||
      order.customerName ||
      order.userName ||
      order.userId ||
      "";
    const searchTerm = search.toLowerCase();
    const matchesSearch =
      String(order.id ?? "").toLowerCase().includes(searchTerm) ||
      String(customer).toLowerCase().includes(searchTerm) ||
      String(order.email || order.address?.email || "").toLowerCase().includes(searchTerm);

    const matchesStatus =
      statusFilter === "all" ||
      normalizeStatus(order.status) === normalizeStatus(statusFilter);

    return matchesSearch && matchesStatus;
  });

  const address =
    selectedOrder?.shipping ||
    selectedOrder?.address ||
    selectedOrder?.shippingAddress ||
    {};
  const selectedItems = Array.isArray(selectedOrder?.items) ? selectedOrder.items : [];

  return (
    <div className="min-h-screen w-full bg-[#141414] text-[#f5f5f5]">
      <div className="border-b border-white/10 px-5 py-6 sm:px-8">
        <div className="mb-3 flex items-center gap-2 text-xs text-gray-500">
          <Link to="/admin" className="transition-colors hover:text-white">Admin</Link>
          <span>/</span>
          <span className="text-gray-300">Orders</span>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-white">Orders</h1>
            <p className="mt-1 text-xs text-gray-500">
              Review order details and manage shipment status ({orders.length} total).
            </p>
          </div>
          <button
            type="button"
            onClick={() => refreshOrders()}
            disabled={loading}
            className="inline-flex h-9 items-center justify-center gap-2 border border-white/10 bg-[#191919] px-3 text-xs font-medium text-gray-300 transition-colors hover:border-white/30 hover:bg-[#222222] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-b border-white/10 bg-[#191919] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="relative w-full max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID or customer..."
            aria-label="Search orders"
            className="h-9 w-full border border-white/10 bg-[#141414] pl-9 pr-3 text-xs text-white outline-none placeholder:text-gray-600 focus:border-white/30"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="order-status" className="whitespace-nowrap text-xs text-gray-500">Status:</label>
          <select
            id="order-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 border border-white/10 bg-[#141414] px-3 text-xs text-gray-300 outline-none focus:border-white/30"
          >
            <option value="all">All Statuses</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>{displayStatus(status)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="p-5 sm:p-8">
        {error && (
          <div role="alert" className="mb-5 flex flex-col gap-2 border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-400 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <button type="button" onClick={() => refreshOrders()} className="w-fit font-medium text-red-300 underline underline-offset-2 hover:text-white">Try again</button>
          </div>
        )}

        {notice && !selectedOrder && (
          <div role="status" className="mb-5 border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300">
            {notice}
          </div>
        )}

        <div className="overflow-x-auto border border-white/10 bg-[#191919]">
          <table className="w-full min-w-[850px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10 bg-[#202020]">
                {["Order ID", "Client", "Items", "Status", "Amount", "Date", "Details"].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-xs font-medium text-gray-400">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredOrders.map((order) => {
                const customerName =
                  order.address?.name || order.shippingAddress?.name ||
                  order.customerName || order.userName || `Customer #${order.userId || "—"}`;
                const itemsCount = Array.isArray(order.items)
                  ? order.items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)
                  : 1;
                const status = order.status || "Pending";

                return (
                  <tr key={order.id} className="transition-colors hover:bg-white/[0.03]">
                    <td className="whitespace-nowrap px-4 py-4">
                      <span className="font-mono text-xs font-medium text-white">#{order.id}</span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-xs font-medium text-gray-200">{customerName}</p>
                      {(order.address?.city || order.shippingAddress?.city) && (
                        <p className="mt-1 text-[10px] text-gray-500">
                          {order.address?.city || order.shippingAddress?.city}
                          {(order.address?.state || order.shippingAddress?.state)
                            ? `, ${order.address?.state || order.shippingAddress?.state}` : ""}
                        </p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-xs text-gray-400">
                      {itemsCount} {itemsCount === 1 ? "item" : "items"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <span className={`inline-block border px-2.5 py-1 text-[10px] font-medium capitalize ${getStatusStyle(status)}`}>
                        {displayStatus(status)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right text-xs font-medium tabular-nums text-gray-200">
                      <div>{formatCurrency(getOrderAmount(order))}</div>
                      {order.couponCode && (
                        <div className="mt-1 flex items-center justify-end gap-1 text-[9px] uppercase tracking-wider text-emerald-400">
                          <Tag size={10} />
                          <span>{order.couponCode}</span>
                          {Number(order.discountAmount) > 0 && (
                            <span className="text-gray-400">
                              (−{formatCurrency(order.discountAmount)})
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right text-xs text-gray-500">
                      {(order.createdAt || order.date) ? new Date(order.createdAt || order.date).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <button
                        type="button"
                        onClick={() => openOrder(order)}
                        className="inline-flex h-8 items-center gap-1.5 border border-white/10 px-3 text-[11px] font-medium text-gray-300 transition hover:border-white/30 hover:bg-white/5 hover:text-white"
                      >
                        <Eye size={12} /> View order
                      </button>
                    </td>
                  </tr>
                );
              })}

              {loading && orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="bg-[#191919] px-4 py-16 text-center text-xs text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Loading orders...</span>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && filteredOrders.length === 0 && !error && (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <p className="text-sm text-gray-400">No orders found.</p>
                    <p className="mt-1 text-xs text-gray-600">Try changing your search term or status filter.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!loading && !error && (
          <div className="mt-4 flex flex-col gap-2 text-xs text-gray-600 sm:flex-row sm:items-center sm:justify-between">
            <p>Showing <span className="text-gray-300">{filteredOrders.length}</span> of <span className="text-gray-300">{orders.length}</span> orders</p>
            <p>CHRONOX Administration</p>
          </div>
        )}
      </div>

      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeOrder();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-details-title"
            className="max-h-[92vh] w-full max-w-4xl overflow-y-auto border border-white/10 bg-[#151515] text-white shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/10 bg-[#191919] px-5 py-4 sm:px-7">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">CHRONOX · Order details</p>
                <h2 id="order-details-title" className="mt-1 text-xl font-medium">Order #{selectedOrder.id}</h2>
                <p className="mt-1 text-xs text-gray-500">Placed {formatDate(selectedOrder.createdAt || selectedOrder.date)}</p>
              </div>
              <button
                type="button"
                onClick={closeOrder}
                disabled={updatingStatus}
                aria-label="Close order details"
                className="border border-white/10 p-2 text-gray-400 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-6 p-5 sm:p-7">
              {error && (
                <div role="alert" className="border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">{error}</div>
              )}
              {notice && (
                <div role="status" className="border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300">{notice}</div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InfoPanel icon={<UserRound size={15} />} title="Customer information">
                  <Detail label="Name" value={address.name || selectedOrder.customerName || selectedOrder.userName} />
                  <Detail label="Email" value={address.email || selectedOrder.email || selectedOrder.customerEmail} />
                  <Detail label="Phone" value={address.phone || address.mobile || selectedOrder.phone} />
                  <Detail label="User ID" value={selectedOrder.userId} />
                </InfoPanel>

                <InfoPanel icon={<MapPin size={15} />} title="Shipping address">
                  <Detail label="Address" value={[address.address, address.addressLine1, address.addressLine2, address.street].filter(Boolean).join(", ")} />
                  <Detail label="City" value={address.city} />
                  <Detail label="State" value={address.state} />
                  <Detail label="Postal code" value={address.postalCode || address.zip || address.pincode} />
                  <Detail label="Country" value={address.country} />
                </InfoPanel>

                <InfoPanel icon={<CreditCard size={15} />} title="Payment & totals">
                  <Detail label="Payment method" value={selectedOrder.paymentMethod || selectedOrder.payment?.method} />
                  <Detail label="Payment status" value={selectedOrder.paymentStatus || selectedOrder.payment?.status} />
                  <Detail
                    label="Original subtotal"
                    value={
                      selectedOrder.originalAmount != null
                        ? formatCurrency(selectedOrder.originalAmount)
                        : selectedOrder.subtotal != null
                        ? formatCurrency(selectedOrder.subtotal)
                        : null
                    }
                  />
                  {selectedOrder.couponCode && (
                    <Detail
                      label="Privilege offer"
                      value={`${selectedOrder.couponCode}${selectedOrder.couponTitle ? ` (${selectedOrder.couponTitle})` : ""}`}
                    />
                  )}
                  {Number(selectedOrder.discountAmount) > 0 && (
                    <Detail
                      label="Privilege discount"
                      value={`−${formatCurrency(selectedOrder.discountAmount)}`}
                    />
                  )}
                  <Detail label="Shipping" value={selectedOrder.shippingCost != null ? formatCurrency(selectedOrder.shippingCost) : selectedOrder.shipping != null ? formatCurrency(selectedOrder.shipping) : null} />
                  <Detail label="Tax" value={selectedOrder.tax != null ? formatCurrency(selectedOrder.tax) : null} />
                  <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
                    <span className="text-xs text-gray-400">Order total</span>
                    <span className="text-sm font-semibold text-white">{formatCurrency(getOrderAmount(selectedOrder))}</span>
                  </div>
                </InfoPanel>

                <InfoPanel icon={<CalendarDays size={15} />} title="Order information">
                  <Detail label="Order ID" value={`#${selectedOrder.id}`} />
                  <Detail label="Created" value={formatDate(selectedOrder.createdAt || selectedOrder.date)} />
                  <Detail label="Last updated" value={formatDate(selectedOrder.updatedAt)} />
                  <Detail label="Notes" value={selectedOrder.notes || selectedOrder.customerNote} />
                </InfoPanel>
              </div>

              <div className="border border-white/10 bg-[#191919]">
                <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                  <Package size={15} className="text-gray-400" />
                  <h3 className="text-sm font-medium">Items ordered</h3>
                  <span className="ml-auto text-xs text-gray-500">{selectedItems.length} product(s)</span>
                </div>
                {selectedItems.length > 0 ? (
                  <div className="divide-y divide-white/5">
                    {selectedItems.map((item, index) => {
                      const quantity = Number(item.quantity) || 1;
                      const price = Number(item.price ?? item.unitPrice) || 0;
                      return (
                        <div key={item.id ?? item.productId ?? index} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center">
                          {(item.image || item.thumbnail) && (
                            <img
                              src={item.image || item.thumbnail}
                              alt={item.name || item.title || "Ordered product"}
                              className="h-16 w-16 border border-white/10 bg-[#222222] object-contain p-1"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-white">{item.name || item.title || item.productName || `Product ${item.productId || ""}`}</p>
                            <p className="mt-1 text-xs text-gray-500">
                              {item.brand ? `${item.brand} · ` : ""}Qty {quantity}
                              {item.size ? ` · Size ${item.size}` : ""}
                              {item.color ? ` · ${item.color}` : ""}
                            </p>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="text-xs text-gray-400">{formatCurrency(price)} each</p>
                            <p className="mt-1 text-sm font-medium text-white">{formatCurrency(price * quantity)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center text-xs text-gray-500">No item details are stored for this order.</div>
                )}
              </div>

              <form onSubmit={handleStatusUpdate} className="border border-white/10 bg-[#191919] p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-gray-500">Order status</p>
                    <div className="mb-3">
                      <span className={`inline-block border px-2.5 py-1 text-[10px] font-medium capitalize ${getStatusStyle(selectedOrder.status || "pending")}`}>
                        {displayStatus(selectedOrder.status)}
                      </span>
                    </div>
                    <label htmlFor="edit-order-status" className="mb-2 block text-xs text-gray-400">Change status to</label>
                    <select
                      id="edit-order-status"
                      value={newStatus}
                      onChange={(event) => setNewStatus(event.target.value)}
                      disabled={updatingStatus}
                      className="h-10 w-full border border-white/10 bg-[#141414] px-3 text-xs text-white outline-none focus:border-white/30 disabled:opacity-60 sm:max-w-xs"
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>{displayStatus(status)}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={updatingStatus || newStatus === normalizeStatus(selectedOrder.status)}
                    className="inline-flex h-10 items-center justify-center gap-2 bg-white px-4 text-xs font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {updatingStatus ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                    {updatingStatus ? "Saving status..." : "Update status"}
                  </button>
                </div>
              </form>

              <div className="flex justify-end border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={closeOrder}
                  disabled={updatingStatus}
                  className="h-9 border border-white/10 px-4 text-xs text-gray-300 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
                >
                  Close details
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function InfoPanel({ icon, title, children }) {
  return (
    <section className="border border-white/10 bg-[#191919] p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
        <span className="text-gray-400">{icon}</span>
        <h3 className="text-sm font-medium text-white">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Detail({ label, value }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <span className="shrink-0 text-xs text-gray-500">{label}</span>
      <span className="break-words text-left text-xs text-gray-200 sm:max-w-[65%] sm:text-right">
        {displayValue(value)}
      </span>
    </div>
  );
}

export default AdminOrders;
