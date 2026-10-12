import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  Mail,
  ShieldCheck,
  Wrench,
  X,
} from "lucide-react";
import Navbar from "../components/layout/Navbar";

const Service = () => {
  const [openTerm, setOpenTerm] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check whether user is logged in
  const storedUser = localStorage.getItem("user");

  let currentUser = null;

  try {
    currentUser = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    currentUser = null;
  }

  const isLoggedIn = !!currentUser;

  const [formData, setFormData] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    phone: currentUser?.phone || "",
    orderNumber: "",
    watchModel: "",
    serviceType: "Warranty Claim",
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    setLoading(true);

    // Demo submission
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1200);
  };

  const resetForm = () => {
    setSubmitted(false);

    setFormData({
      name: currentUser?.name || "",
      email: currentUser?.email || "",
      phone: currentUser?.phone || "",
      orderNumber: "",
      watchModel: "",
      serviceType: "Warranty Claim",
      message: "",
    });
  };

  const terms = [
    {
      title: "Warranty Period",
      content:
        "Your watch is covered against manufacturing and material defects for the applicable warranty period beginning from the original date of purchase. Warranty coverage is valid only when the watch was purchased through an authorised sales channel.",
    },
    {
      title: "Warranty Eligibility",
      content:
        "To make a warranty claim, you may be required to provide valid proof of purchase, order information, or other details that allow us to verify the original purchase and warranty status of your watch.",
    },
    {
      title: "Proof of Purchase",
      content:
        "A valid order number, invoice, receipt, or other proof of purchase may be required before warranty service is approved. We reserve the right to request additional information when necessary.",
    },
    {
      title: "Warranty Claims",
      content:
        "Warranty claims are evaluated by our service team. If a manufacturing defect is confirmed, we may repair or replace the affected component at our discretion, subject to the terms of the applicable warranty.",
    },
    {
      title: "Repair & Replacement",
      content:
        "Where repair is not reasonably possible, we may provide a replacement component or, where appropriate, an equivalent watch. Replacement decisions are made by the service team based on product availability and condition.",
    },
    {
      title: "Shipping & Service Charges",
      content:
        "Depending on the nature of the service request and warranty eligibility, shipping, inspection, labour, or replacement component charges may apply. Any applicable charges will be communicated before paid service is performed.",
    },
    {
      title: "Warranty Exclusions",
      content:
        "The warranty does not normally cover accidental damage, scratches, dents, normal wear and tear, strap or bracelet wear, unauthorised repairs, misuse, improper care, cosmetic deterioration, loss, theft, or damage caused by external factors.",
    },
    {
      title: "Unauthorised Repairs",
      content:
        "Opening, modifying, repairing, or servicing the watch through an unauthorised person or service centre may invalidate the warranty. Always contact our service team before arranging external repairs.",
    },
    {
      title: "Water Resistance",
      content:
        "Water resistance ratings do not mean that a watch is permanently waterproof. Water resistance may decrease over time due to ageing, impact, or improper handling. Follow the care instructions supplied with your watch.",
    },
    {
      title: "Personal Information",
      content:
        "Information submitted through the service form is used to process your request, communicate with you, verify your purchase, and provide after-sales support. We do not request unnecessary information for a service claim.",
    },
  ];

  const faqs = [
    {
      question: "Can I request service without an account?",
      answer:
        "Yes. Guests can submit a service request using their email address, order number, watch model, and details of the issue.",
    },
    {
      question: "How do I check my warranty status?",
      answer:
        "If you are logged in, your warranty information can be associated with your purchased watches. Guests can contact our service team with their order number for verification.",
    },
    {
      question: "What should I do if my watch stops working?",
      answer:
        "Submit a service request with your order number, watch model, and a description of the problem. Our team will review the request and provide the next steps.",
    },
    {
      question: "Does the warranty cover scratches?",
      answer:
        "Cosmetic damage such as scratches, dents, and normal signs of wear is generally not covered under the manufacturing warranty.",
    },
  ];

  return (
    <main className="min-h-screen bg-white text-black">
      {/* =========================================================
          HERO
      ========================================================= */}
      <Navbar/>
      <section className="border-b border-black/10">

        <div className="mx-auto max-w-[1600px] px-6 pb-20 pt-16 md:px-10 md:pb-28 md:pt-24 lg:px-16">
          <div className="grid gap-14 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className="mb-6 text-[10px] font-semibold uppercase tracking-[0.3em] text-black/50">
                Customer Care / Warranty & Service
              </p>

              <h1 className="max-w-5xl text-5xl font-medium leading-[0.95] tracking-[-0.05em] sm:text-6xl md:text-7xl lg:text-[92px]">
                CARE THAT
                <br />
                <span className="text-black/35">GOES BEYOND</span>
                <br />
                THE WATCH.
              </h1>

              <p className="mt-8 max-w-xl text-sm leading-7 text-black/60 md:text-base">
                From warranty assistance to professional servicing, our
                customer care team is here to help keep your timepiece
                performing at its best.
              </p>
            </div>

            <div className="border-t border-black pt-5 lg:ml-auto lg:w-full">
              <div className="flex items-start justify-between gap-8">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">
                    Service Support
                  </p>

                  <p className="mt-3 text-xl font-medium">
                    We're here to help.
                  </p>
                </div>

                <ShieldCheck
                  size={30}
                  strokeWidth={1.3}
                  className="shrink-0"
                />
              </div>

              <div className="mt-8 grid grid-cols-2 border-t border-black/10 pt-5">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-black/40">
                    Support
                  </p>
                  <p className="mt-2 text-sm">Email Service</p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-black/40">
                    Response
                  </p>
                  <p className="mt-2 text-sm">Within 1–2 days</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          SERVICE REQUEST
      ========================================================= */}
      <section id="service-request" className="border-b border-black/10">
        <div className="mx-auto max-w-[1600px] px-6 py-20 md:px-10 md:py-28 lg:px-16">
          <div className="grid gap-14 lg:grid-cols-[0.7fr_1.3fr]">
            {/* LEFT */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-black/40">
                01 / Service Request
              </p>

              <h2 className="mt-5 text-4xl font-medium tracking-[-0.04em] md:text-5xl">
                HOW CAN
                <br />
                WE HELP?
              </h2>

              <p className="mt-6 max-w-md text-sm leading-7 text-black/55">
                Tell us what you need help with. Our service team will review
                your request and contact you with the next steps.
              </p>

              {isLoggedIn && (
                <div className="mt-10 border border-black/10 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white">
                      <Check size={16} />
                    </div>

                    <div>
                      <p className="text-xs font-medium">
                        You're signed in
                      </p>

                      <p className="mt-1 text-[11px] text-black/50">
                        Your account information has been pre-filled.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!isLoggedIn && (
                <div className="mt-10 border border-black/10 p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">
                    Guest Service
                  </p>

                  <p className="mt-3 text-sm leading-6 text-black/60">
                    You don't need an account to request service. Just provide
                    your email and order information.
                  </p>

                  <Link
                    to="/login"
                    className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em]"
                  >
                    Sign in for a faster experience
                    <ArrowRight size={14} />
                  </Link>
                </div>
              )}
            </div>

            {/* FORM */}
            <div>
              {!submitted ? (
                <form
                  onSubmit={handleSubmit}
                  className="border border-black/10"
                >
                  <div className="grid md:grid-cols-2">
                    {/* Name */}
                    <div className="border-b border-black/10 p-5 md:border-r">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">
                        Full Name
                      </label>

                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Your name"
                        className="mt-4 w-full bg-transparent text-sm outline-none placeholder:text-black/25"
                      />
                    </div>

                    {/* Email */}
                    <div className="border-b border-black/10 p-5">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">
                        Email Address
                      </label>

                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="you@example.com"
                        className="mt-4 w-full bg-transparent text-sm outline-none placeholder:text-black/25"
                      />
                    </div>

                    {/* Phone */}
                    <div className="border-b border-black/10 p-5 md:border-r">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">
                        Phone Number
                      </label>

                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+91 XXXXX XXXXX"
                        className="mt-4 w-full bg-transparent text-sm outline-none placeholder:text-black/25"
                      />
                    </div>

                    {/* Order */}
                    <div className="border-b border-black/10 p-5">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">
                        Order Number
                      </label>

                      <input
                        type="text"
                        name="orderNumber"
                        value={formData.orderNumber}
                        onChange={handleChange}
                        required
                        placeholder="ORD-XXXXXX"
                        className="mt-4 w-full bg-transparent text-sm outline-none placeholder:text-black/25"
                      />
                    </div>

                    {/* Watch Model */}
                    <div className="border-b border-black/10 p-5 md:border-r">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">
                        Watch Model
                      </label>

                      <input
                        type="text"
                        name="watchModel"
                        value={formData.watchModel}
                        onChange={handleChange}
                        required
                        placeholder="e.g. CH-7302-MB"
                        className="mt-4 w-full bg-transparent text-sm outline-none placeholder:text-black/25"
                      />
                    </div>

                    {/* Service Type */}
                    <div className="border-b border-black/10 p-5">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">
                        Service Type
                      </label>

                      <select
                        name="serviceType"
                        value={formData.serviceType}
                        onChange={handleChange}
                        className="mt-4 w-full appearance-none bg-transparent text-sm outline-none"
                      >
                        <option>Warranty Claim</option>
                        <option>Repair</option>
                        <option>Maintenance</option>
                        <option>Battery Replacement</option>
                        <option>Other</option>
                      </select>
                    </div>

                    {/* Message */}
                    <div className="border-b border-black/10 p-5 md:col-span-2">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">
                        Describe the Issue
                      </label>

                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={6}
                        placeholder="Tell us what happened with your watch..."
                        className="mt-4 w-full resize-none bg-transparent text-sm leading-6 outline-none placeholder:text-black/25"
                      />
                    </div>

                    {/* Submit */}
                    <div className="flex items-center justify-between gap-6 p-5 md:col-span-2">
                      <p className="max-w-sm text-[10px] leading-5 text-black/40">
                        By submitting this request, you agree to our service
                        terms and conditions.
                      </p>

                      <button
                        type="submit"
                        disabled={loading}
                        className="group flex shrink-0 items-center gap-4 bg-black px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loading ? "Submitting..." : "Submit Request"}

                        {!loading && (
                          <ArrowRight
                            size={15}
                            className="transition-transform group-hover:translate-x-1"
                          />
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="flex min-h-[500px] flex-col items-center justify-center border border-black/10 px-8 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black text-white">
                    <Check size={28} strokeWidth={1.5} />
                  </div>

                  <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.3em] text-black/40">
                    Request Received
                  </p>

                  <h3 className="mt-4 text-3xl font-medium tracking-[-0.03em]">
                    THANK YOU.
                  </h3>

                  <p className="mt-5 max-w-md text-sm leading-7 text-black/55">
                    Your service request has been received. Our team will
                    review the information and contact you at{" "}
                    <span className="font-medium text-black">
                      {formData.email}
                    </span>
                    .
                  </p>

                  <button
                    onClick={resetForm}
                    className="mt-8 border border-black px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] transition hover:bg-black hover:text-white"
                  >
                    Submit Another Request
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      

      {/* =========================================================
          CONTACT CTA
      ========================================================= */}
      <section className="bg-black text-white">
        <div className="mx-auto max-w-[1600px] px-6 py-20 md:px-10 md:py-28 lg:px-16">
          <div className="flex flex-col justify-between gap-12 md:flex-row md:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/40">
                Need More Help?
              </p>

              <h2 className="mt-5 max-w-3xl text-4xl font-medium tracking-[-0.04em] md:text-6xl">
                WE'RE ONLY AN
                <br />
                EMAIL AWAY.
              </h2>
            </div>

            <a
              href="mailto:service@yourbrand.com"
              className="group inline-flex items-center gap-5 border border-white/20 px-6 py-5 text-xs font-semibold uppercase tracking-[0.18em] transition hover:bg-white hover:text-black"
            >
              service@yourbrand.com

              <ArrowRight
                size={17}
                className="transition-transform group-hover:translate-x-1"
              />
            </a>
          </div>
        </div>
      </section>

      {/* =========================================================
          FOOTER NOTE
      ========================================================= */}
      <div className="bg-black px-6 pb-8 text-center text-[9px] uppercase tracking-[0.2em] text-white/30">
        Warranty & Service · Customer Care
      </div>
    </main>
  );
};

/* =============================================================
   FAQ COMPONENT
============================================================= */

const FAQItem = ({ question, answer }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-black/10">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-6 py-6 text-left"
      >
        <span className="text-sm font-medium">{question}</span>

        <ChevronDown
          size={18}
          className={`shrink-0 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`grid transition-all duration-300 ${
          open
            ? "grid-rows-[1fr] pb-6 opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <p className="pr-8 text-sm leading-7 text-black/55">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Service;