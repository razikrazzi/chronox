
/**
 * Normalizes an offer object from JSON Server into a structured coupon record.
 * Handles both structured fields and legacy descriptive text seamlessly.
 */
export function normalizeCoupon(offer) {
  if (!offer || typeof offer !== "object") return null;

  const code = String(offer.code || "").trim().toUpperCase();
  const id = String(offer.id || "");
  const title = String(offer.title || "").trim();
  const rawDiscount = String(offer.discount || "").trim();
  const rawScope = String(offer.scope || "").trim();
  const status = offer.status === "Paused" ? "Paused" : "Active";
  const validTill = offer.validTill || "Permanent";

  // Determine discountType and discountValue
  let discountType = offer.discountType;
  let discountValue = Number(offer.discountValue);

  if (!discountType) {
    const lowerDisc = rawDiscount.toLowerCase();
    if (lowerDisc.includes("%")) {
      discountType = "percentage";
      const match = rawDiscount.match(/(\d+(\.\d+)?)/);
      discountValue = match ? parseFloat(match[1]) : 0;
    } else if (lowerDisc.includes("service") || lowerDisc.includes("complimentary") || code === "VIPCONCIERGE") {
      discountType = "service";
      discountValue = 0;
    } else {
      discountType = "fixed";
      const numStr = rawDiscount.replace(/[^0-9.]/g, "");
      discountValue = numStr ? parseFloat(numStr) : 0;
    }
  }

  if (Number.isNaN(discountValue)) {
    discountValue = 0;
  }

  // Determine scopeType and scopeValue
  let scopeType = offer.scopeType;
  let scopeValue = offer.scopeValue;
  let minOrderAmount = offer.minOrderAmount != null ? Number(offer.minOrderAmount) : null;

  if (!scopeType) {
    const lowerScope = rawScope.toLowerCase();
    if (lowerScope.startsWith("product:") || lowerScope.includes("product id:") || lowerScope.includes("(id:")) {
      scopeType = "product";
      const idMatch = rawScope.match(/id:\s*([^\s)]+)/i);
      scopeValue = idMatch ? idMatch[1].trim() : rawScope.replace(/^product:\s*/i, "").trim();
    } else if (lowerScope.includes("space timer")) {
      scopeType = "collection";
      scopeValue = "Space Timer";
    } else if (lowerScope.includes("tourbillon")) {
      scopeType = "collection";
      scopeValue = "Tourbillon";
    } else if (lowerScope.includes("all orders above") || lowerScope.includes("orders above") || code === "VIPCONCIERGE") {
      scopeType = "all";
      scopeValue = "all";
      if (!minOrderAmount) {
        const match = rawScope.replace(/,/g, "").match(/(\d+)/);
        minOrderAmount = match ? parseInt(match[1], 10) : 200000;
      }
    } else if (lowerScope.includes("all")) {
      scopeType = "all";
      scopeValue = "all";
    } else {
      scopeType = "collection";
      scopeValue = rawScope.replace(/\s*(collection|timepieces)\s*$/i, "").trim() || rawScope;
    }
  }

  return {
    id,
    title: title || code,
    code,
    discount: rawDiscount || (discountType === "percentage" ? `${discountValue}% OFF` : `₹${discountValue} OFF`),
    discountType, // 'percentage' | 'fixed' | 'service'
    discountValue,
    scope: rawScope || scopeValue,
    scopeType, // 'all' | 'collection' | 'product'
    scopeValue: String(scopeValue || "all").trim(),
    minOrderAmount: Number.isFinite(minOrderAmount) ? minOrderAmount : null,
    status,
    validTill,
  };
}

/**
 * Checks whether a coupon has expired according to user's local timezone.
 * A coupon remains valid through 23:59:59 of its expiration date.
 */
export function isCouponExpired(coupon) {
  if (!coupon) return true;
  const validTill = String(coupon.validTill || "").trim().toLowerCase();
  if (!validTill || validTill === "permanent") return false;

  const expiryDate = new Date(`${coupon.validTill}T23:59:59`);
  if (Number.isNaN(expiryDate.getTime())) return false;

  return expiryDate < new Date();
}

/**
 * Checks whether an offer is active and not expired.
 */
export function isCouponActive(offer) {
  const coupon = normalizeCoupon(offer);
  if (!coupon) return false;
  if (coupon.status === "Paused") return false;
  if (isCouponExpired(coupon)) return false;
  return true;
}

/**
 * Checks if a specific product is eligible for a coupon.
 */
export function isProductEligibleForCoupon(product, rawOffer) {
  if (!product) return { eligible: false, reason: "Product details unavailable." };
  const coupon = normalizeCoupon(rawOffer);
  if (!coupon) return { eligible: false, reason: "Invalid coupon." };

  const productPrice = Number(product.price || 0);
  const productCollection = String(product.collection || "").trim().toLowerCase();
  const productId = String(product.id || "").trim();

  // Check minimum order amount if defined (e.g. VIP Concierge)
  if (coupon.minOrderAmount != null && coupon.minOrderAmount > 0) {
    if (productPrice < coupon.minOrderAmount) {
      return {
        eligible: false,
        reason: `Requires an order value of at least ₹${coupon.minOrderAmount.toLocaleString("en-IN")}.`,
      };
    }
  }

  if (coupon.scopeType === "all") {
    return { eligible: true };
  }

  if (coupon.scopeType === "collection") {
    const targetCollection = String(coupon.scopeValue || "").trim().toLowerCase();
    // Match exact collection or collection contained within scope
    const matches =
      productCollection === targetCollection ||
      productCollection.includes(targetCollection) ||
      targetCollection.includes(productCollection);

    if (matches) {
      return { eligible: true };
    }
    return {
      eligible: false,
      reason: `Exclusive to the ${coupon.scopeValue || coupon.scope} collection.`,
    };
  }

  if (coupon.scopeType === "product") {
    const targetId = String(coupon.scopeValue || "").trim().toLowerCase();
    const pid = String(productId || "").trim().toLowerCase();
    const pName = String(product.name || "").trim().toLowerCase();
    if (
      pid === targetId ||
      pName === targetId ||
      pName.includes(targetId) ||
      targetId.includes(pName)
    ) {
      return { eligible: true };
    }
    return {
      eligible: false,
      reason: "This privilege is only valid for selected models.",
    };
  }

  return { eligible: false, reason: "This watch is not eligible for this privilege." };
}

/**
 * Calculates discount on a single product.
 */
export function calculateProductDiscount(price, coupon) {
  const eligibleAmount = Math.max(0, Number(price) || 0);
  if (!coupon || !coupon.discountType || eligibleAmount <= 0) {
    return { discountAmount: 0, finalPrice: eligibleAmount, isService: false };
  }

  if (coupon.discountType === "service") {
    return {
      discountAmount: 0,
      finalPrice: eligibleAmount,
      isService: true,
      benefit: coupon.discount || "Complimentary Service",
    };
  }

  if (coupon.discountType === "percentage") {
    const pct = Math.max(0, Math.min(100, Number(coupon.discountValue) || 0));
    const discountAmount = Math.round((eligibleAmount * pct) / 100);
    const finalPrice = Math.max(0, eligibleAmount - discountAmount);
    return { discountAmount, finalPrice, isService: false };
  }

  if (coupon.discountType === "fixed") {
    const fixedVal = Math.max(0, Number(coupon.discountValue) || 0);
    const discountAmount = Math.min(eligibleAmount, Math.round(fixedVal));
    const finalPrice = Math.max(0, eligibleAmount - discountAmount);
    return { discountAmount, finalPrice, isService: false };
  }

  return { discountAmount: 0, finalPrice: eligibleAmount, isService: false };
}

/**
 * Filters a list of checkout items and calculates the discount for multiple items.
 */
export function calculateCheckoutDiscount(items, rawOffer) {
  const coupon = normalizeCoupon(rawOffer);
  const checkoutItems = Array.isArray(items) ? items : [];

  const subtotal = checkoutItems.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0
  );

  if (!coupon || checkoutItems.length === 0) {
    return {
      eligible: false,
      discountAmount: 0,
      finalAmount: subtotal,
      eligibleAmount: 0,
      reason: "No items or coupon specified.",
    };
  }

  // Minimum order amount check on total
  if (coupon.minOrderAmount != null && coupon.minOrderAmount > 0) {
    if (subtotal < coupon.minOrderAmount) {
      return {
        eligible: false,
        discountAmount: 0,
        finalAmount: subtotal,
        eligibleAmount: 0,
        reason: `Requires an order total of at least ₹${coupon.minOrderAmount.toLocaleString("en-IN")}.`,
      };
    }
  }

  // Filter eligible items
  const eligibleItems = [];
  let eligibleAmount = 0;

  checkoutItems.forEach((item) => {
    const match = isProductEligibleForCoupon(item, coupon);
    if (match.eligible) {
      eligibleItems.push(item);
      eligibleAmount += (Number(item.price) || 0) * (Number(item.quantity) || 1);
    }
  });

  if (eligibleItems.length === 0) {
    return {
      eligible: false,
      discountAmount: 0,
      finalAmount: subtotal,
      eligibleAmount: 0,
      reason: `None of the items in your order qualify for ${coupon.code}.`,
    };
  }

  if (coupon.discountType === "service") {
    return {
      eligible: true,
      discountAmount: 0,
      finalAmount: subtotal,
      eligibleAmount,
      isService: true,
      benefit: coupon.discount || "Complimentary Service",
    };
  }

  if (coupon.discountType === "percentage") {
    const pct = Math.max(0, Math.min(100, Number(coupon.discountValue) || 0));
    const discountAmount = Math.round((eligibleAmount * pct) / 100);
    const finalAmount = Math.max(0, subtotal - discountAmount);
    return {
      eligible: true,
      discountAmount,
      finalAmount,
      eligibleAmount,
      isService: false,
    };
  }

  if (coupon.discountType === "fixed") {
    const fixedVal = Math.max(0, Number(coupon.discountValue) || 0);
    const discountAmount = Math.min(eligibleAmount, Math.round(fixedVal));
    const finalAmount = Math.max(0, subtotal - discountAmount);
    return {
      eligible: true,
      discountAmount,
      finalAmount,
      eligibleAmount,
      isService: false,
    };
  }

  return {
    eligible: false,
    discountAmount: 0,
    finalAmount: subtotal,
    eligibleAmount: 0,
    reason: "Unsupported discount type.",
  };
}

/**
 * Validates a coupon code string against a list of offers and a given target (single product or items list).
 * Returns a standardized validation result.
 */
export function validateCoupon(codeArg, offers, target = {}) {
  const cleanCode = String(codeArg || "").trim().toUpperCase();
  if (!cleanCode) {
    return { valid: false, message: "Please enter a coupon code." };
  }

  const rawOffer = (Array.isArray(offers) ? offers : []).find(
    (o) => String(o.code || "").trim().toUpperCase() === cleanCode
  );

  if (!rawOffer) {
    return { valid: false, message: "Invalid coupon code." };
  }

  const coupon = normalizeCoupon(rawOffer);

  if (coupon.status === "Paused") {
    return { valid: false, message: "This coupon is currently unavailable." };
  }

  if (isCouponExpired(coupon)) {
    return { valid: false, message: "This coupon has expired." };
  }

  // Single product validation (e.g. on ProductDetails)
  if (target.product) {
    const eligibility = isProductEligibleForCoupon(target.product, coupon);
    if (!eligibility.eligible) {
      return {
        valid: false,
        message: eligibility.reason || "This coupon is not valid for this watch.",
      };
    }

    const price = Number(target.product.price || 0);
    const calculation = calculateProductDiscount(price, coupon);

    return {
      valid: true,
      coupon,
      ...calculation,
      originalPrice: price,
      message: calculation.isService
        ? "Complimentary privilege applied!"
        : `Privilege applied: Saved ₹${calculation.discountAmount.toLocaleString("en-IN")}`,
    };
  }

  // Multiple items validation (e.g. on Checkout)
  if (Array.isArray(target.items)) {
    const result = calculateCheckoutDiscount(target.items, coupon);
    if (!result.eligible) {
      return {
        valid: false,
        message: result.reason || "This coupon is not valid for this order.",
      };
    }

    return {
      valid: true,
      coupon,
      ...result,
      message: result.isService
        ? "Complimentary privilege applied!"
        : `Privilege applied: Saved ₹${result.discountAmount.toLocaleString("en-IN")}`,
    };
  }

  // Generic valid without target calculation
  return { valid: true, coupon, message: "Coupon is valid." };
}

/**
 * Formats a coupon's expiration date into a clean luxury string, e.g. "31 Dec 2026"
 */
export function formatExpiryDate(validTill) {
  if (!validTill || String(validTill).toLowerCase() === "permanent") {
    return "Permanent privilege";
  }
  const date = new Date(`${validTill}T23:59:59`);
  if (Number.isNaN(date.getTime())) {
    return String(validTill);
  }
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
