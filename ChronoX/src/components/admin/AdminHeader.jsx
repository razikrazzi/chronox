import { useLocation, Link } from "react-router-dom";
import { Menu, ExternalLink } from "lucide-react";

function AdminHeader({ onOpenMobile }) {
  const location = useLocation();

  const titles = {
    "/admin": "Dashboard",
    "/admin/products": "Products",
    "/admin/users": "Users",
    "/admin/orders": "Orders",
    "/admin/offers": "Offers",
  };

  const title = titles[location.pathname] || "Admin";

  return (
    <header
      className="
        sticky
        top-0
        z-20
        flex
        h-14
        items-center
        justify-between
        border-b
        border-white/10
        bg-[#141414]
        px-5
        text-white
        sm:px-8
      "
    >
      {/* Breadcrumb / Title */}
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={onOpenMobile}
          className="
            rounded-md
            p-1.5
            text-[#888888]
            transition-colors
            hover:bg-white/10
            hover:text-white
            md:hidden
          "
          aria-label="Open navigation menu"
        >
          <Menu size={18} />
        </button>

        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs">
          <Link
            to="/admin"
            className="text-[#777777] transition-colors hover:text-white"
          >
            Admin
          </Link>

          <span className="text-[#444444]">/</span>

          <span className="font-medium text-[#f5f5f5]">
            {title}
          </span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        {/* Environment Label */}
        <span className="hidden text-[10px] uppercase tracking-widest text-[#666666] sm:block">
          CHRONOX CMS
        </span>

        {/* Storefront Link */}
        <Link
          to="/dashboard"
          className="
            flex
            items-center
            gap-1.5
            border
            border-white/10
            bg-[#202020]
            px-3
            py-2
            text-[11px]
            text-[#aaaaaa]
            transition-colors
            hover:border-white/25
            hover:bg-[#292929]
            hover:text-white
          "
        >
          <span>Storefront</span>
          <ExternalLink size={12} />
        </Link>
      </div>
    </header>
  );
}

export default AdminHeader;