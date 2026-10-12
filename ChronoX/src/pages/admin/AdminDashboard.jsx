
import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const API_URL = "http://localhost:3000";

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function getOrderAmount(order) {
  const directAmount = Number(
    order.totalAmount ?? order.total ?? order.amount
  );

  if (Number.isFinite(directAmount) && directAmount > 0) {
    return directAmount;
  }

  if (Array.isArray(order.items)) {
    return order.items.reduce((total, item) => {
      return (
        total +
        (Number(item.price) || 0) *
          (Number(item.quantity) || 1)
      );
    }, 0);
  }

  return 0;
}

function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchDashboardData() {
      setLoading(true);
      setError("");

      try {
        const [productResponse, userResponse, orderResponse] =
          await Promise.all([
            axios.get(`${API_URL}/products`),
            axios.get(`${API_URL}/users`),
            axios.get(`${API_URL}/orders`),
          ]);

        if (cancelled) return;

        setProducts(productResponse.data);
        setUsers(userResponse.data);
        setOrders(orderResponse.data);
      } catch (err) {
        console.error("Dashboard API error:", err);

        if (!cancelled) {
          setError(
            "Unable to load dashboard data. Make sure JSON Server is running on port 3000."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchDashboardData();

    return () => {
      cancelled = true;
    };
  }, []);

  const revenue = orders.reduce((total, order) => {
    const status = String(order.status || "").toLowerCase();

    if (
      ["cancelled", "canceled", "refunded"].includes(status)
    ) {
      return total;
    }

    return total + getOrderAmount(order);
  }, 0);

  const recentOrders = [...orders].reverse().slice(0, 5);

  const lowStockProducts = products
    .filter((product) => Number(product.stock ?? 0) <= 5)
    .slice(0, 5);

  const collections = [
    {
      name: "Products",
      description: "Manage your watch catalogue.",
      count: products.length,
      path: "/admin/products",
    },
    {
      name: "Users",
      description: "View registered customer accounts.",
      count: users.length,
      path: "/admin/users",
    },
    {
      name: "Orders",
      description: "Review and manage customer orders.",
      count: orders.length,
      path: "/admin/orders",
    },
  ];

  return (
    <div className="min-h-full bg-[#141414] text-[#f5f5f5]">
      {/* Page header */}
      <div className="border-b border-[#303030] px-5 py-6 sm:px-8">
        <div className="mb-2 flex items-center gap-2 text-xs text-[#8b8b8b]">
          <span>Admin</span>
          <span>/</span>
          <span className="text-[#f5f5f5]">Dashboard</span>
        </div>

        <h1 className="text-2xl font-medium tracking-tight">
          Dashboard
        </h1>

        <p className="mt-2 text-sm text-[#8b8b8b]">
          Overview of your CHRONOX store.
        </p>
      </div>

      {/* Main content */}
      <div className="space-y-10 px-5 py-7 sm:px-8">
        {error && (
          <div
            role="alert"
            className="border border-[#663333] bg-[#2a1717] px-4 py-3 text-sm text-red-300"
          >
            {error}
          </div>
        )}

        {/* Collection links */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium">
              Collections
            </h2>

            {loading && (
              <span className="text-xs text-[#8b8b8b]">
                Loading...
              </span>
            )}
          </div>

          <div className="divide-y divide-[#e5e5e5] border-y border-[#303030]">
            {collections.map((collection) => (
              <Link
                key={collection.name}
                to={collection.path}
                className="group flex min-h-32 items-center justify-between gap-4 border border-[#2b2b2b] bg-[#202020] px-3 py-5 transition-colors hover:border-[#505050] hover:bg-[#262626]"
              >
                <div className="flex min-w-0 items-start gap-4 px-3">
                  <span className="mt-0.5 text-lg text-[#a3a3a3]">
                    ◫
                  </span>

                  <div>
                    <h3 className="text-sm font-medium group-hover:underline">
                      {collection.name}
                    </h3>

                    <p className="mt-1 text-xs text-[#8b8b8b]">
                      {collection.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 px-3">
                  <span className="text-sm tabular-nums text-[#8b8b8b]">
                    {loading ? "—" : collection.count}
                  </span>

                  <span className="text-sm text-[#8b8b8b]">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Store overview */}
        <section>
          <h2 className="mb-4 text-sm font-medium">
            Store overview
          </h2>

          <div className="grid grid-cols-1 divide-y divide-[#e5e5e5] border-y border-[#303030] sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
            <div className="border border-[#2b2b2b] bg-[#202020] px-4 py-5">
              <p className="text-xs text-[#8b8b8b]">
                Total products
              </p>

              <p className="mt-3 text-2xl font-medium tabular-nums">
                {loading ? "—" : products.length}
              </p>
            </div>

            <div className="border border-[#2b2b2b] bg-[#202020] px-4 py-5">
              <p className="text-xs text-[#8b8b8b]">
                Registered users
              </p>

              <p className="mt-3 text-2xl font-medium tabular-nums">
                {loading ? "—" : users.length}
              </p>
            </div>

            <div className="border border-[#2b2b2b] bg-[#202020] px-4 py-5">
              <p className="text-xs text-[#8b8b8b]">
                Total orders
              </p>

              <p className="mt-3 text-2xl font-medium tabular-nums">
                {loading ? "—" : orders.length}
              </p>
            </div>

            <div className="border border-[#2b2b2b] bg-[#202020] px-4 py-5">
              <p className="text-xs text-[#8b8b8b]">
                Order value
              </p>

              <p className="mt-3 break-words text-2xl font-medium tabular-nums">
                {loading ? "—" : formatCurrency(revenue)}
              </p>
            </div>
          </div>

          <p className="mt-2 text-[11px] text-[#8b8b8b]">
            Order value includes non-cancelled and non-refunded
            orders. It is an estimate based on available order data.
          </p>
        </section>

        {/* Recent orders */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium">
                Recent orders
              </h2>

              <p className="mt-1 text-xs text-[#8b8b8b]">
                The latest orders recorded in your store.
              </p>
            </div>

            <Link
              to="/admin/orders"
              className="text-xs text-[#bdbdbd] underline underline-offset-4 hover:text-white"
            >
              View all
            </Link>
          </div>

          <div className="overflow-x-auto border border-[#303030] bg-[#181818]">
            <table className="w-full min-w-[600px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#303030] bg-[#202020]">
                  <th className="px-4 py-3 text-xs font-medium text-[#bdbdbd]">
                    Order ID
                  </th>

                  <th className="px-4 py-3 text-xs font-medium text-[#bdbdbd]">
                    Customer
                  </th>

                  <th className="px-4 py-3 text-xs font-medium text-[#bdbdbd]">
                    Status
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-medium text-[#bdbdbd]">
                    Amount
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#e5e5e5]">
                {recentOrders.map((order, index) => (
                  <tr
                    key={order.id ?? index}
                    className="hover:bg-[#242424]"
                  >
                    <td className="px-4 py-3 text-xs font-medium">
                      #{order.id ?? "—"}
                    </td>

                    <td className="px-4 py-3 text-xs text-[#bdbdbd]">
                      {order.customerName ||
                        order.userName ||
                        order.email ||
                        order.userId ||
                        "Customer"}
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex border border-[#303030] px-2 py-1 text-[10px] capitalize text-[#bdbdbd]">
                        {order.status || "Pending"}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right text-xs tabular-nums">
                      {formatCurrency(getOrderAmount(order))}
                    </td>
                  </tr>
                ))}

                {!loading && recentOrders.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-10 text-center text-xs text-[#8b8b8b]"
                    >
                      No orders found.
                    </td>
                  </tr>
                )}

                {loading && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-10 text-center text-xs text-[#8b8b8b]"
                    >
                      Loading orders...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Low stock */}
        <section>
          <div className="mb-4">
            <h2 className="text-sm font-medium">
              Inventory alerts
            </h2>

            <p className="mt-1 text-xs text-[#8b8b8b]">
              Products with five or fewer items remaining.
            </p>
          </div>

          <div className="border-y border-[#303030]">
            {lowStockProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between gap-4 border-b border-[#303030] px-3 py-4 last:border-b-0 hover:bg-[#242424]"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {product.name || "Unnamed product"}
                  </p>

                  <p className="mt-1 text-xs text-[#8b8b8b]">
                    {product.collection ||
                      product.category ||
                      "Watch"}
                  </p>
                </div>

                <span
                  className={`shrink-0 text-xs ${
                    Number(product.stock ?? 0) === 0
                      ? "font-medium text-red-400"
                      : "text-[#8b8b8b]"
                  }`}
                >
                  {product.stock ?? 0} in stock
                </span>
              </div>
            ))}

            {!loading && lowStockProducts.length === 0 && (
              <p className="px-3 py-8 text-xs text-[#8b8b8b]">
                No inventory alerts.
              </p>
            )}
          </div>
        </section>

        {/* Offers shortcut */}
        <section className="border border-[#303030] bg-[#1d1d1d] p-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-sm font-medium">
                Promotional offers
              </h2>

              <p className="mt-1 text-xs text-[#8b8b8b]">
                Manage the promotional cards displayed on your
                storefront.
              </p>
            </div>

            <Link
              to="/admin/offers"
              className="inline-flex h-9 items-center justify-center border border-[#454545] px-4 text-xs font-medium transition hover:border-[#bdbdbd] hover:bg-[#242424]"
            >
              Manage offers →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminDashboard;

