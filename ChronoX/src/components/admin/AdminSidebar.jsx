import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Watch,
  Users,
  ShoppingBag,
  Tag,
  ArrowLeft,
  LogOut,
  X,
} from "lucide-react";

function AdminSidebar({ mobileOpen, onCloseMobile }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    onCloseMobile?.();
    navigate("/login", { replace: true });
  };

  const navItems = [
    { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { name: "Products", path: "/admin/products", icon: Watch },
    { name: "Users", path: "/admin/users", icon: Users },
    { name: "Orders", path: "/admin/orders", icon: ShoppingBag },
    { name: "Offers", path: "/admin/offers", icon: Tag },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-[#141414] text-[#f5f5f5]">
      {/* Top Branding and Navigation */}
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <Link
              to="/admin"
              onClick={() => onCloseMobile?.()}
              className="text-base font-bold tracking-[0.2em] text-white"
            >
              CHRONOX
            </Link>

            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-[#777777]">
              Payload · Admin
            </p>
          </div>

          {/* Mobile Close Button */}
          {mobileOpen && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="rounded-md p-1.5 text-[#888888] transition hover:bg-white/10 hover:text-white md:hidden"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <div className="px-3 py-5">
          <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#666666]">
            Collections
          </p>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;

              const isActive =
                item.path === "/admin"
                  ? location.pathname === "/admin"
                  : location.pathname === item.path ||
                    location.pathname.startsWith(`${item.path}/`);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => onCloseMobile?.()}
                  aria-current={isActive ? "page" : undefined}
                  className={`
                    group
                    flex
                    items-center
                    gap-3
                    rounded-sm
                    border
                    px-3
                    py-2.5
                    text-xs
                    font-medium
                    transition-colors
                    ${
                      isActive
                        ? "border-white/10 bg-[#252525] text-white"
                        : "border-transparent text-[#b0b0b0] hover:bg-[#202020] hover:text-white"
                    }
                  `}
                >
                  <Icon
                    size={15}
                    strokeWidth={1.8}
                    className={
                      isActive
                        ? "text-white"
                        : "text-[#777777] group-hover:text-white"
                    }
                  />

                  <span>{item.name}</span>

                  {isActive && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom User Profile and Actions */}
      <div className="border-t border-white/10 p-4">
        {/* User Profile */}
        <div className="mb-3 border border-white/[0.08] bg-[#1d1d1d] p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#292929] text-xs font-semibold text-white">
              {(user?.name || "Admin").charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-[#eeeeee]">
                {user?.name || "Administrator"}
              </p>

              <p className="mt-1 truncate text-[10px] text-[#777777]">
                {user?.email || "admin@chronox.com"}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 border-t border-white/[0.08] pt-3">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

            <span className="text-[9px] font-mono uppercase tracking-wider text-[#999999]">
              Administrator
            </span>
          </div>
        </div>

        {/* View Storefront */}
        <Link
          to="/dashboard"
          onClick={() => onCloseMobile?.()}
          className="
            mb-1.5
            flex
            w-full
            items-center
            gap-2
            border
            border-white/10
            px-3
            py-2.5
            text-xs
            font-medium
            text-[#aaaaaa]
            transition-colors
            hover:border-white/25
            hover:bg-[#202020]
            hover:text-white
          "
        >
          <ArrowLeft size={13} />
          <span>View Storefront</span>
        </Link>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="
            flex
            w-full
            items-center
            gap-2
            px-3
            py-2.5
            text-xs
            font-medium
            text-[#999999]
            transition-colors
            hover:bg-red-500/10
            hover:text-red-400
          "
        >
          <LogOut size={13} />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 border-r border-white/10 bg-[#141414] md:block">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Overlay */}
          <button
            type="button"
            aria-label="Close navigation menu"
            className="fixed inset-0 cursor-default bg-black/70 backdrop-blur-sm"
            onClick={onCloseMobile}
          />

          {/* Drawer */}
          <div className="relative z-10 h-full w-72 max-w-[85vw] shadow-2xl shadow-black/50">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}

export default AdminSidebar;