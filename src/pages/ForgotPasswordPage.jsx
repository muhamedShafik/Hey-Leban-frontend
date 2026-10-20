import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../services/authService";

const COUNTDOWN_SECONDS = 60;

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [clientError, setClientError] = useState("");

  const timerRef = useRef(null);

  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [countdown]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email.trim()) {
      setClientError("Please enter your email address");
      return;
    }

    // Basic email pattern validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setClientError("Please enter a valid email address");
      return;
    }

    setClientError("");
    setLoading(true);

    try {
      await requestPasswordReset(email.trim());
    } catch (err) {
      // Intentionally suppress errors to not reveal if email exists
      console.warn("Password reset request processed:", err?.message || err);
    } finally {
      setLoading(false);
      setSubmitted(true);
      setCountdown(COUNTDOWN_SECONDS);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fef9f2] px-4 py-8">
      <div className="w-full max-w-md rounded-3xl bg-white px-6 py-8 shadow-[0_10px_30px_rgba(61,12,2,0.08)]">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f8f3ec] text-[#3d0c02]">
            <svg
              className="h-7 w-7 text-[#E8A020]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#3d0c02]">
            Forgot Password?
          </h1>
          <p className="mt-2 text-sm text-[#54433f]">
            Enter your email address and we'll send you instructions to reset your password.
          </p>
        </div>

        {submitted && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-800">
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-xs font-bold text-emerald-800">
                ✓
              </span>
              <div className="flex-1">
                <p className="font-semibold text-emerald-900">Check your inbox</p>
                <p className="mt-1 text-xs leading-relaxed text-emerald-700">
                  If an account exists with this email, you will receive password reset instructions shortly. Please check your spam folder as well.
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="px-1 text-sm font-bold text-[#54433f]">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="staff@example.com"
              value={email}
              disabled={loading || countdown > 0}
              onChange={(e) => {
                setEmail(e.target.value);
                setClientError("");
              }}
              className="h-12 w-full rounded-xl bg-[#f8f3ec] px-4 text-sm outline-none transition focus:ring-2 focus:ring-[#E8A020] disabled:opacity-75"
            />
            {clientError ? (
              <p className="px-1 text-xs font-medium text-red-600">{clientError}</p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={loading || countdown > 0}
            className={`flex h-12 w-full items-center justify-center rounded-xl text-sm font-bold text-white transition hover:brightness-105 active:scale-[0.99] ${
              loading || countdown > 0
                ? "cursor-not-allowed bg-gray-300 text-gray-500"
                : "bg-[#E8A020]"
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                Sending instructions...
              </span>
            ) : countdown > 0 ? (
              `Resend link in ${countdown}s`
            ) : submitted ? (
              "Resend Reset Link"
            ) : (
              "Send Reset Link"
            )}
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-2 border-t border-[#f2eae1] pt-5 text-center">
          <Link
            to="/login"
            className="flex items-center gap-1.5 text-sm font-semibold text-[#54433f] transition hover:text-[#3d0c02]"
          >
            <span aria-hidden="true">←</span> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
