import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  Search,
  RefreshCw,
  Shield,
  User,
  Users,
  Ban,
  CheckCircle2,
} from "lucide-react";

const API_URL = "http://localhost:3000/users";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);

  const refreshUsers = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(API_URL);
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Users API error:", err);
      setError("Unable to load users. Check that JSON Server is running on port 3000.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const term = String(search).toLowerCase().trim();

    return users.filter((u) => {
      const matchesSearch =
        String(u.name || "").toLowerCase().includes(term) ||
        String(u.email || "").toLowerCase().includes(term);

      const normalizedRole =
        String(u.role || "user").toLowerCase() === "admin" ? "admin" : "user";
      const matchesRole = roleFilter === "all" || normalizedRole === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const adminCount = users.filter(
    (u) => String(u.role || "").toLowerCase() === "admin"
  ).length;
  const customerCount = users.length - adminCount;
  const blockedCount = users.filter((u) => u.blocked === true).length;

  const handleBlockToggle = async (user) => {
    if (String(user.role || "").toLowerCase() === "admin") {
      setError("Administrator accounts cannot be blocked from this page.");
      return;
    }

    const nextBlocked = user.blocked !== true;
    const action = nextBlocked ? "block" : "unblock";
    if (
      !window.confirm(
        `Are you sure you want to ${action} ${user.name || user.email || "this user"}?`
      )
    ) {
      return;
    }

    setError("");
    setNotice("");
    setUpdatingId(user.id);

    try {
      await axios.patch(`${API_URL}/${encodeURIComponent(user.id)}`, {
        blocked: nextBlocked,
      });

      setUsers((current) =>
        current.map((item) =>
          String(item.id) === String(user.id)
            ? { ...item, blocked: nextBlocked }
            : item
        )
      );

      setNotice(
        `${user.name || user.email || "User"} has been ${
          nextBlocked ? "blocked" : "unblocked"
        }.`
      );
    } catch (err) {
      console.error("Block user error:", err);
      setError(
        err.response?.data?.message ||
          `Unable to ${action} this user. Check JSON Server and try again.`
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#141414] text-[#f5f5f5]">
      <div className="border-b border-white/10 px-5 py-6 sm:px-8">
        <div className="mb-3 flex items-center gap-2 text-xs">
          <Link
            to="/admin"
            className="text-[#777777] transition hover:text-white hover:underline"
          >
            Admin
          </Link>
          <span className="text-[#444444]">/</span>
          <span className="text-white">Users</span>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Users size={15} className="text-[#999999]" />
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#777777]">
                CHRONOX CMS
              </span>
            </div>
            <h1 className="text-2xl font-medium tracking-tight text-white">
              User Management
            </h1>
            <p className="mt-2 text-xs text-[#858585]">
              View registered accounts and block or unblock customer access.
            </p>
          </div>

          <button
            type="button"
            onClick={refreshUsers}
            disabled={loading}
            className="inline-flex h-9 items-center justify-center gap-2 self-start border border-white/10 bg-[#202020] px-3 text-xs font-medium text-[#cccccc] transition hover:border-white/25 hover:bg-[#292929] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 divide-y divide-white/10 border-b border-white/10 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
        <Stat label="Total accounts" value={loading ? "—" : users.length} caption="Registered accounts" />
        <Stat label="Administrators" value={loading ? "—" : adminCount} caption="Administrative accounts" />
        <Stat label="Customers" value={loading ? "—" : customerCount} caption="Customer accounts" />
        <Stat label="Blocked users" value={loading ? "—" : blockedCount} caption="Restricted customer accounts" />
      </div>

      <div className="flex flex-col gap-4 border-b border-white/10 bg-[#191919] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="relative w-full max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777777]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            aria-label="Search users"
            className="h-9 w-full border border-white/10 bg-[#202020] pl-9 pr-3 text-xs text-white outline-none placeholder:text-[#666666] transition focus:border-white/30"
          />
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="user-role" className="shrink-0 text-xs text-[#888888]">
            Role
          </label>
          <select
            id="user-role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-9 border border-white/10 bg-[#202020] px-3 text-xs text-[#dddddd] outline-none focus:border-white/30"
          >
            <option value="all">All Roles</option>
            <option value="admin">Administrators</option>
            <option value="user">Customers</option>
          </select>
        </div>
      </div>

      <div className="space-y-4 p-5 sm:p-8">
        {error && (
          <div
            role="alert"
            className="flex flex-col gap-3 border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-xs text-red-400 sm:flex-row sm:items-center sm:justify-between"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={refreshUsers}
              className="self-start underline underline-offset-2 hover:text-red-300 sm:self-auto"
            >
              Try again
            </button>
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="flex items-center justify-between gap-3 border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-3 text-xs text-emerald-300"
          >
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium text-white">User collection</h2>
            <p className="mt-1 text-xs text-[#777777]">
              Showing {loading ? "—" : filteredUsers.length} of{" "}
              {loading ? "—" : users.length} accounts
            </p>
          </div>
          {(search || roleFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setRoleFilter("all");
              }}
              className="shrink-0 text-xs text-[#999999] underline underline-offset-4 transition hover:text-white"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="overflow-x-auto border border-white/10 bg-[#191919]">
          <table className="w-full min-w-[850px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10 bg-[#202020]">
                {["ID", "Name", "Email", "Role", "Status", "Joined", "Action"].map(
                  (heading) => (
                    <th
                      key={heading}
                      className="px-4 py-4 text-[10px] font-medium uppercase tracking-wider text-[#999999]"
                    >
                      {heading}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-white/[0.07]">
              {filteredUsers.map((u) => {
                const isAdmin = String(u.role || "").toLowerCase() === "admin";
                const isBlocked = u.blocked === true;
                const isUpdating = String(updatingId) === String(u.id);

                return (
                  <tr key={u.id} className="transition-colors hover:bg-[#222222]">
                    <td className="px-4 py-4 font-mono text-xs text-[#777777]">
                      #{u.id}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
                            isAdmin
                              ? "border-white/15 bg-[#303030] text-white"
                              : "border-white/10 bg-[#242424] text-[#aaaaaa]"
                          }`}
                        >
                          {isAdmin ? <Shield size={14} /> : <User size={14} />}
                        </div>
                        <span className="text-xs font-medium text-[#eeeeee]">
                          {u.name || "Unnamed"}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-xs text-[#aaaaaa]">
                      {u.email || "—"}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 border px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-wider ${
                          isAdmin
                            ? "border-white/20 bg-white/[0.08] text-white"
                            : "border-white/10 bg-[#242424] text-[#aaaaaa]"
                        }`}
                      >
                        {isAdmin ? <Shield size={10} /> : <User size={10} />}
                        {isAdmin ? "Admin" : "Customer"}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 border px-2.5 py-1.5 text-[10px] font-medium ${
                          isBlocked
                            ? "border-red-500/20 bg-red-500/10 text-red-300"
                            : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                        }`}
                      >
                        {isBlocked ? <Ban size={10} /> : <CheckCircle2 size={10} />}
                        {isBlocked ? "Blocked" : "Active"}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-xs text-[#888888]">
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "Pre-existing"}
                    </td>

                    <td className="px-4 py-4">
                      {isAdmin ? (
                        <span className="text-[11px] text-[#666666]">
                          Protected admin
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleBlockToggle(u)}
                          disabled={isUpdating}
                          className={`inline-flex h-8 items-center justify-center gap-1.5 border px-3 text-[11px] font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            isBlocked
                              ? "border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/10"
                              : "border-red-500/25 text-red-300 hover:bg-red-500/10"
                          }`}
                        >
                          {isUpdating ? (
                            <RefreshCw size={12} className="animate-spin" />
                          ) : isBlocked ? (
                            <CheckCircle2 size={12} />
                          ) : (
                            <Ban size={12} />
                          )}
                          {isUpdating ? "Updating..." : isBlocked ? "Unblock" : "Block"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {!loading && filteredUsers.length === 0 && !error && (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <Users size={22} className="mx-auto mb-3 text-[#555555]" />
                    <p className="text-sm text-[#cccccc]">No users found</p>
                    <p className="mt-1 text-xs text-[#777777]">
                      Try changing your search or role filter.
                    </p>
                  </td>
                </tr>
              )}

              {loading && users.length === 0 && (
                <tr>
                  <td colSpan={7} className="bg-[#191919] px-4 py-16 text-center">
                    <RefreshCw
                      size={18}
                      className="mx-auto mb-3 animate-spin text-white/60"
                    />
                    <p className="text-xs text-[#aaaaaa]">Loading users...</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col justify-between gap-2 border-t border-white/10 pt-4 sm:flex-row sm:items-center">
          <p className="text-[10px] text-[#666666]">CHRONOX · USER MANAGEMENT</p>
          <p className="text-[10px] text-[#666666]">Account data from JSON Server</p>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, caption }) {
  return (
    <div className="px-5 py-5 sm:px-8">
      <p className="text-xs text-[#777777]">{label}</p>
      <p className="mt-3 text-2xl font-medium tabular-nums text-white">{value}</p>
      <p className="mt-1 text-[10px] text-[#666666]">{caption}</p>
    </div>
  );
}

export default AdminUsers;
