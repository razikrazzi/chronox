import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Search, RefreshCw } from "lucide-react";

const API_URL = "http://localhost:3000/orders";

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function getOrderAmount(order) {
  const direct = Number(order.totalAmount ?? order.total ?? order.amount);

  if (Number.isFinite(direct) && direct > 0) {
    return direct;
  }

  if (Array.isArray(order.items)) {
    return order.items.reduce(
      (acc, item) =>
        acc +
        (Number(item.price) || 0) * (Number(item.quantity) || 1),
      0
    );
  }

  return 0;
}

function getStatusStyle(status) {
  switch (String(status || "pending").toLowerCase()) {
    case "delivered":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";

    case "processing":
      return "border-blue-500/30 bg-blue-500/10 text-blue-400";

    case "cancelled":
      return "border-red-500/30 bg-red-500/10 text-red-400";

    case "shipped":
      return "border-purple-500/30 bg-purple-500/10 text-purple-400";

    case "pending":
      return "border-amber-500/30 bg-amber-500/10 text-amber-400";

    default:
      return "border-white/10 bg-white/5 text-gray-400";
  }
}

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const refreshOrders = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(API_URL);

      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Orders API error:", err);
      setError("Unable to load orders. Check whether JSON Server is running.");
    } finally {
      setLoading(false);
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
          setError(
            "Unable to load orders. Check whether JSON Server is running."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      cancelled = true;
    };
  }, []);

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
      String(customer).toLowerCase().includes(searchTerm);

    const matchesStatus =
      statusFilter === "all" ||
      String(order.status || "pending").toLowerCase() ===
        statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-full bg-[#141414] text-[#f5f5f5]">
      {/* Header */}
      <div className="border-b border-white/10 px-5 py-6 sm:px-8">
        <div className="mb-3 flex items-center gap-2 text-xs text-gray-500">
          <Link to="/admin" className="transition-colors hover:text-white">
            Admin
          </Link>

          <span>/</span>

          <span className="text-gray-300">Orders</span>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-white">
              Orders
            </h1>

            <p className="mt-1 text-xs text-gray-500">
              Review and monitor client transactions and shipments (
              {orders.length} total).
            </p>
          </div>

          <button
            type="button"
            onClick={refreshOrders}
            disabled={loading}
            className="inline-flex h-9 items-center justify-center gap-2 border border-white/10 bg-[#191919] px-3 text-xs font-medium text-gray-300 transition-colors hover:border-white/30 hover:bg-[#222222] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={13}
              className={loading ? "animate-spin" : ""}
            />

            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-white/10 bg-[#191919] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        {/* Search */}
        <div className="relative w-full max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID or customer name..."
            className="h-9 w-full border border-white/10 bg-[#141414] pl-9 pr-3 text-xs text-white outline-none placeholder:text-gray-600 focus:border-white/30"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="order-status"
            className="whitespace-nowrap text-xs text-gray-500"
          >
            Status:
          </label>

          <select
            id="order-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 border border-white/10 bg-[#141414] px-3 text-xs text-gray-300 outline-none focus:border-white/30"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-5 sm:p-8">
        {/* Error Message */}
        {error && (
          <div
            role="alert"
            className="mb-5 border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-400"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span>{error}</span>

              <button
                type="button"
                onClick={refreshOrders}
                className="w-fit font-medium text-red-300 underline underline-offset-2 hover:text-white"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Orders Table */}
        <div className="overflow-x-auto border border-white/10 bg-[#191919]">
          <table className="w-full min-w-[750px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10 bg-[#202020]">
                <th className="px-4 py-3 text-xs font-medium text-gray-400">
                  Order ID
                </th>

                <th className="px-4 py-3 text-xs font-medium text-gray-400">
                  Client
                </th>

                <th className="px-4 py-3 text-xs font-medium text-gray-400">
                  Items
                </th>

                <th className="px-4 py-3 text-xs font-medium text-gray-400">
                  Status
                </th>

                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">
                  Amount
                </th>

                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">
                  Date
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {filteredOrders.map((order) => {
                const customerName =
                  order.address?.name ||
                  order.customerName ||
                  order.userName ||
                  `Customer #${order.userId || "—"}`;

                const itemsCount = Array.isArray(order.items)
                  ? order.items.reduce(
                      (acc, item) =>
                        acc + (Number(item.quantity) || 1),
                      0
                    )
                  : 1;

                const status = order.status || "Pending";

                return (
                  <tr
                    key={order.id}
                    className="transition-colors hover:bg-white/[0.03]"
                  >
                    {/* Order ID */}
                    <td className="whitespace-nowrap px-4 py-4">
                      <span className="font-mono text-xs font-medium text-white">
                        #{order.id}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-4">
                      <p className="text-xs font-medium text-gray-200">
                        {customerName}
                      </p>

                      {order.address?.city && (
                        <p className="mt-1 text-[10px] text-gray-500">
                          {order.address.city}
                          {order.address.state
                            ? `, ${order.address.state}`
                            : ""}
                        </p>
                      )}
                    </td>

                    {/* Items */}
                    <td className="whitespace-nowrap px-4 py-4 text-xs text-gray-400">
                      {itemsCount}{" "}
                      {itemsCount === 1 ? "timepiece" : "timepieces"}
                    </td>

                    {/* Status */}
                    <td className="whitespace-nowrap px-4 py-4">
                      <span
                        className={`inline-block border px-2.5 py-1 text-[10px] font-medium capitalize ${getStatusStyle(
                          status
                        )}`}
                      >
                        {status}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="whitespace-nowrap px-4 py-4 text-right text-xs font-medium tabular-nums text-gray-200">
                      {formatCurrency(getOrderAmount(order))}
                    </td>

                    {/* Date */}
                    <td className="whitespace-nowrap px-4 py-4 text-right text-xs text-gray-500">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString(
                            "en-IN",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )
                        : "—"}
                    </td>
                  </tr>
                );
              })}

              {/* Loading */}
              {loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-16 text-center text-xs text-gray-500"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Loading orders...</span>
                    </div>
                  </td>
                </tr>
              )}

              {/* Empty State */}
              {!loading && filteredOrders.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-16 text-center"
                  >
                    <p className="text-sm text-gray-400">
                      No orders found.
                    </p>

                    <p className="mt-1 text-xs text-gray-600">
                      Try changing your search term or status filter.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Results Footer */}
        {!loading && !error && (
          <div className="mt-4 flex flex-col gap-2 text-xs text-gray-600 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing{" "}
              <span className="text-gray-300">
                {filteredOrders.length}
              </span>{" "}
              of{" "}
              <span className="text-gray-300">{orders.length}</span>{" "}
              orders
            </p>

            <p>CHRONOX Administration</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminOrders;