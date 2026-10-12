import { useState } from "react";
import { Link } from "react-router-dom";
import { Tag, Check } from "lucide-react";

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

function AdminOffers() {
  const [offers] = useState(INITIAL_OFFERS);
  const [copiedCode, setCopiedCode] = useState(null);

  const handleCopy = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);

      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error("Unable to copy coupon code:", error);
    }
  };

  return (
    <div className="min-h-full bg-[#141414] text-[#f5f5f5]">
      {/* Page Header */}
      <div className="border-b border-white/10 px-5 py-6 sm:px-8">
        {/* Breadcrumbs */}
        <div className="mb-3 flex items-center gap-2 text-xs text-[#777777]">
          <Link
            to="/admin"
            className="transition hover:text-white hover:underline"
          >
            Admin
          </Link>

          <span>/</span>

          <span className="text-white">Offers</span>
        </div>

        {/* Title */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Tag size={16} className="text-[#a3a3a3]" />

              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#777777]">
                CHRONOX CMS
              </span>
            </div>

            <h1 className="text-2xl font-medium tracking-tight text-white">
              Promotional Offers
            </h1>

            <p className="mt-2 max-w-2xl text-xs leading-5 text-[#858585]">
              Manage promotional coupon codes and seasonal incentives for the
              CHRONOX boutique.
            </p>
          </div>

          {/* Offer Count */}
          <div className="flex items-center gap-3 self-start border border-white/10 bg-[#202020] px-4 py-3 sm:self-auto">
            <span className="text-xs text-[#888888]">
              Total campaigns
            </span>

            <span className="text-lg font-medium tabular-nums text-white">
              {offers.length}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6 p-5 sm:p-8">
        {/* Section Heading */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-white">
              Offers collection
            </h2>

            <p className="mt-1 text-xs text-[#777777]">
              Available promotional campaigns and coupon codes.
            </p>
          </div>

          <span className="border border-white/10 px-2.5 py-1 text-[10px] text-[#999999]">
            {offers.length} records
          </span>
        </div>

        {/* Offers Table */}
        <div className="overflow-x-auto border border-white/10 bg-[#191919]">
          <table className="w-full min-w-[850px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10 bg-[#202020]">
                <th className="px-4 py-4 text-[10px] font-medium uppercase tracking-wider text-[#999999]">
                  Campaign
                </th>

                <th className="px-4 py-4 text-[10px] font-medium uppercase tracking-wider text-[#999999]">
                  Coupon Code
                </th>

                <th className="px-4 py-4 text-[10px] font-medium uppercase tracking-wider text-[#999999]">
                  Benefit
                </th>

                <th className="px-4 py-4 text-[10px] font-medium uppercase tracking-wider text-[#999999]">
                  Target Scope
                </th>

                <th className="px-4 py-4 text-[10px] font-medium uppercase tracking-wider text-[#999999]">
                  Status
                </th>

                <th className="px-4 py-4 text-right text-[10px] font-medium uppercase tracking-wider text-[#999999]">
                  Validity
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/[0.07]">
              {offers.map((offer) => (
                <tr
                  key={offer.id}
                  className="transition-colors hover:bg-[#222222]"
                >
                  {/* Campaign */}
                  <td className="px-4 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-white/10 bg-[#252525]">
                        <Tag size={13} className="text-[#999999]" />
                      </div>

                      <div>
                        <p className="max-w-[220px] text-xs font-medium leading-5 text-[#eeeeee]">
                          {offer.title}
                        </p>

                        <p className="mt-1 text-[10px] text-[#666666]">
                          {offer.id}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Coupon Code */}
                  <td className="px-4 py-5">
                    <button
                      type="button"
                      onClick={() => handleCopy(offer.code)}
                      title="Click to copy coupon code"
                      aria-label={`Copy coupon code ${offer.code}`}
                      className="
                        inline-flex
                        items-center
                        gap-2
                        border
                        border-white/10
                        bg-[#252525]
                        px-2.5
                        py-2
                        font-mono
                        text-[10px]
                        font-medium
                        text-[#e5e5e5]
                        transition
                        hover:border-white/30
                        hover:bg-[#303030]
                      "
                    >
                      <span>{offer.code}</span>

                      {copiedCode === offer.code ? (
                        <Check
                          size={12}
                          className="text-emerald-400"
                        />
                      ) : (
                        <Tag
                          size={11}
                          className="text-[#777777]"
                        />
                      )}
                    </button>

                    {copiedCode === offer.code && (
                      <p className="mt-1.5 text-[10px] text-emerald-400">
                        Copied to clipboard
                      </p>
                    )}
                  </td>

                  {/* Benefit */}
                  <td className="px-4 py-5">
                    <span className="text-xs font-medium text-[#eeeeee]">
                      {offer.discount}
                    </span>
                  </td>

                  {/* Scope */}
                  <td className="px-4 py-5">
                    <span className="text-xs leading-5 text-[#999999]">
                      {offer.scope}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-5">
                    <span className="inline-flex items-center gap-2 border border-emerald-500/20 bg-emerald-500/[0.08] px-2.5 py-1.5 text-[10px] font-medium text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                      {offer.status}
                    </span>
                  </td>

                  {/* Validity */}
                  <td className="px-4 py-5 text-right">
                    <span className="text-xs tabular-nums text-[#888888]">
                      {offer.validTill}
                    </span>
                  </td>
                </tr>
              ))}

              {offers.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-16 text-center"
                  >
                    <Tag
                      size={24}
                      className="mx-auto mb-3 text-[#555555]"
                    />

                    <p className="text-sm text-[#cccccc]">
                      No promotional offers found.
                    </p>

                    <p className="mt-1 text-xs text-[#777777]">
                      Your offers will appear here.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Information */}
        <div className="flex flex-col justify-between gap-2 border-t border-white/10 pt-4 sm:flex-row sm:items-center">
          <p className="text-[10px] leading-5 text-[#666666]">
            Promotional campaigns configured for the CHRONOX storefront.
          </p>

          <p className="text-[10px] text-[#666666]">
            CHRONOX · ADMINISTRATION
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminOffers;