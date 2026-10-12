function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#030406] px-6 py-16 lg:px-12">
      <div className="mx-auto">
        <div className="grid gap-12 md:grid-cols-4">
          {/* Brand */}
          <div>
            <h2 className="text-xl tracking-[-0.04em] text-white">
               CHRONOX
            </h2>

            <p className="mt-5 max-w-xs text-xs leading-6 text-white/40">
              Independent mechanical watchmaking shaped by craftsmanship,
              innovation and timeless design.
            </p>
          </div>

          {/* Watches */}
          <div>
            <h3 className="mb-5 text-[10px] uppercase tracking-widest text-white">
              Watches
            </h3>

            <div className="space-y-3 text-xs text-white/40">
              <p>Space Timer</p>
              <p>Tourbillon</p>
              <p>Chronograph</p>
              <p>SkelTec</p>
            </div>
          </div>

          {/* Service */}
          <div>
            <h3 className="mb-5 text-[10px] uppercase tracking-widest text-white">
              Service
            </h3>

            <div className="space-y-3 text-xs text-white/40">
              <p>Warranty</p>
              <p>Contact</p>
              <p>Stores</p>
              <p>Customer Service</p>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-5 text-[10px] uppercase tracking-widest text-white">
              Legal
            </h3>

            <div className="space-y-3 text-xs text-white/40">
              <p>Privacy Policy</p>
              <p>Terms & Conditions</p>
              <p>Cookie Policy</p>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-white/10 pt-6 text-[10px] uppercase tracking-widest text-white/30">
          © 2026 CHRONOX. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
