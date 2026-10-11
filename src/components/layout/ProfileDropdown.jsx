// src/components/layout/ProfileDropdown.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export default function ProfileDropdown({ theme = "dark", className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);
  const shop = useAuthStore((state) => state.shop);
  const logout = useAuthStore((state) => state.logout);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    try {
      await logout();
    } catch {
      // Ignore
    }
    navigate("/login");
  };

  const displayName = user?.name || user?.email?.split("@")[0] || "User";
  const userEmail = user?.email || "No email";
  const userRole = user?.role || "Staff";
  const initials = (
    user?.name
      ? user.name.trim().slice(0, 2)
      : user?.email
      ? user.email.slice(0, 2)
      : "U"
  ).toUpperCase();

  const isDark = theme === "dark";

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Profile Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-2 rounded-xl p-1.5 transition-all select-none ${
          isDark
            ? "text-white hover:bg-white/10 active:scale-95"
            : "text-[#3d0c02] hover:bg-[#f8f3ec] border border-[#ded9d3] active:scale-95"
        }`}
        title="Account Profile"
        aria-expanded={isOpen}
      >
        <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-[#E8A020] to-[#feb234] font-extrabold text-xs text-[#3d0c02] shadow-sm ring-2 ring-white/20">
          {initials}
          <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-white" />
        </div>

        <div className="hidden sm:flex flex-col text-left leading-tight">
          <span className="text-xs font-bold truncate max-w-[100px]">
            {displayName}
          </span>
          <span className="text-[10px] opacity-70 uppercase tracking-wider font-semibold">
            {userRole}
          </span>
        </div>

        <svg
          className={`h-3.5 w-3.5 opacity-70 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2.5 w-72 rounded-2xl border border-[#ded9d3] bg-white shadow-2xl z-[200] overflow-hidden text-[#3d0c02] animate-in fade-in zoom-in-95 duration-150">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#3d0c02] to-[#5a1204] p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#feb234] text-base font-extrabold text-[#3d0c02] ring-2 ring-white/30 shadow-md">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-extrabold text-sm truncate text-white">
                    {displayName}
                  </h4>
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" title="Active" />
                </div>
                <p className="text-xs text-white/70 truncate">{userEmail}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="inline-block rounded-full bg-[#feb234] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#3d0c02]">
                    {userRole}
                  </span>
                </div>
              </div>
            </div>

            {/* Shop info badge if available */}
            {shop?.name && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 text-xs text-white/90">
                <span className="text-sm">🏪</span>
                <span className="font-bold truncate">{shop.name}</span>
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="p-2 space-y-1 text-sm font-semibold">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate("/settings");
              }}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-[#f8f3ec] transition-colors"
            >
              <span className="text-base">⚙️</span>
              <span>Settings</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate("/change-password");
              }}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-[#f8f3ec] transition-colors"
            >
              <span className="text-base">🔒</span>
              <span>Change Password</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate("/sales-sessions?next=business-report");
              }}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-[#f8f3ec] transition-colors"
            >
              <span className="text-base">📊</span>
              <span>Business Reports</span>
            </button>
          </div>

          {/* Divider */}
          <div className="border-t border-[#ded9d3] p-2 bg-[#fdfaf7]">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
            >
              <span className="text-sm">🚪</span>
              <span>Sign Out / Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
