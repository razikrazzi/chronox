import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

function AdminLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#141414] text-[#f5f5f5]">
      {/* Sidebar Navigation */}
      <AdminSidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex min-h-screen flex-col md:ml-64">
        {/* Top Header */}
        <AdminHeader
          onOpenMobile={() => setMobileMenuOpen(true)}
        />

        {/* Page Content */}
        <main className="min-w-0 flex-1 bg-[#141414]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;