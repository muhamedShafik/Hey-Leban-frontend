// src/components/layout/AddAccountModal.jsx
import React, { useState } from "react";
import { useAuthStore } from "../../store/authStore";

export default function AddAccountModal({ isOpen, onClose, onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addAccount = useAuthStore((state) => state.addAccount);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await addAccount(email.trim(), password);
      setEmail("");
      setPassword("");
      onSuccess?.(user);
      onClose();
    } catch (err) {
      let message = err?.response?.data?.message;
      if (!err.response) {
        message = "No network connection. Please check your internet and try again.";
      } else {
        message = message || "Invalid email or password.";
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-3xl border border-[#ded9d3] bg-[#fef9f2] p-6 sm:p-7 shadow-2xl text-[#3d0c02] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#ded9d3] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#feb234] text-xl font-bold text-[#3d0c02] shadow-sm">
              +👤
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-[#3d0c02] leading-tight">
                Add Another Account
              </h3>
              <p className="text-xs text-[#54433f] mt-0.5 font-medium">
                Sign in to quickly switch between accounts
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl p-1.5 text-[#54433f] hover:bg-black/5 hover:text-[#3d0c02] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#3d0c02] mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="h-11 w-full rounded-xl border border-[#ded9d3] bg-white px-3.5 text-sm font-medium outline-none focus:border-[#E8A020] transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#3d0c02]">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] font-bold text-[#8c5307] hover:underline"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11 w-full rounded-xl border border-[#ded9d3] bg-white px-3.5 text-sm font-medium outline-none focus:border-[#E8A020] transition-colors"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-11 rounded-xl border border-[#ded9d3] bg-white px-4 text-xs font-bold text-[#54433f] hover:bg-[#f8f3ec] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-11 rounded-xl bg-[#3d0c02] px-5 text-xs font-bold text-white hover:bg-[#5a1204] transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Signing in...</span>
                </>
              ) : (
                "Sign In & Add Account"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
