// src/components/layout/ProfileDropdown.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../store/authStore";
import AddAccountModal from "./AddAccountModal";

export default function ProfileDropdown({ theme = "dark", className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const user = useAuthStore((state) => state.user);
  const shop = useAuthStore((state) => state.shop);
  const savedAccounts = useAuthStore((state) => state.savedAccounts) || [];
  const logout = useAuthStore((state) => state.logout);
  const logoutAll = useAuthStore((state) => state.logoutAll);
  const switchAccount = useAuthStore((state) => state.switchAccount);
  const removeSavedAccount = useAuthStore((state) => state.removeSavedAccount);

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
      if (e.key === "Escape") {
        setIsOpen(false);
        setIsAddAccountOpen(false);
      }
    };
    if (isOpen || isAddAccountOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isAddAccountOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    try {
      await logout();
    } catch {
      // Ignore
    }
    navigate("/login");
  };

  const handleLogoutAll = async () => {
    setIsOpen(false);
    try {
      await logoutAll();
    } catch {
      // Ignore
    }
    navigate("/login");
  };

  const handleSwitchAccount = async (targetId) => {
    if (targetId === user?.id) return;
    setIsOpen(false);
    const success = await switchAccount(targetId);
    if (success) {
      // Invalidate queries so new user gets fresh data
      queryClient.clear();
      // If user is ADMIN vs STAFF, navigate appropriately
      const target = savedAccounts.find((a) => a.id === targetId);
      if (target?.role === "ADMIN") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/pos", { replace: true });
      }
    }
  };

  const handleRemoveAccount = (e, targetId) => {
    e.stopPropagation();
    removeSavedAccount(targetId);
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

  // Filter accounts other than the currently active one
  const otherAccounts = savedAccounts.filter((acc) => acc.id !== user?.id);

  return (
    <>
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
          title="Account Profile & Switcher"
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
          <div className="absolute right-0 top-full mt-2.5 w-80 rounded-2xl border border-[#ded9d3] bg-white shadow-2xl z-[200] overflow-hidden text-[#3d0c02] animate-in fade-in zoom-in-95 duration-150">
            {/* Header: Currently Active Account */}
            <div className="bg-gradient-to-r from-[#3d0c02] to-[#5a1204] p-4 text-white">
              <div className="flex items-center justify-between text-[11px] font-bold text-white/70 mb-2">
                <span>ACTIVE ACCOUNT</span>
                <span className="flex items-center gap-1 text-emerald-400 font-extrabold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Signed In
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#feb234] text-base font-extrabold text-[#3d0c02] ring-2 ring-white/30 shadow-md">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-extrabold text-sm truncate text-white leading-tight">
                    {displayName}
                  </h4>
                  <p className="text-xs text-white/75 truncate mt-0.5">{userEmail}</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="inline-block rounded-full bg-[#feb234] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#3d0c02]">
                      {userRole}
                    </span>
                  </div>
                </div>
              </div>

              {shop?.name && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 text-xs text-white/90">
                  <span className="text-sm">🏪</span>
                  <span className="font-bold truncate">{shop.name}</span>
                </div>
              )}
            </div>

            {/* Switch Accounts Section */}
            <div className="p-3 border-b border-[#ded9d3] bg-[#faf6f0]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#7d6861]">
                  Signed-in Accounts ({savedAccounts.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setIsAddAccountOpen(true);
                  }}
                  className="text-xs font-bold text-[#8c5307] hover:text-[#3d0c02] flex items-center gap-1 hover:underline"
                >
                  <span className="text-sm font-extrabold">+</span> Add Account
                </button>
              </div>

              {/* List of other signed-in accounts */}
              {otherAccounts.length > 0 ? (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
                  {otherAccounts.map((acc) => {
                    const accInitials = (
                      acc.name
                        ? acc.name.trim().slice(0, 2)
                        : acc.email
                        ? acc.email.slice(0, 2)
                        : "U"
                    ).toUpperCase();

                    return (
                      <div
                        key={acc.id}
                        onClick={() => handleSwitchAccount(acc.id)}
                        className="group flex items-center justify-between p-2 rounded-xl bg-white hover:bg-[#fff9ef] border border-[#ece7e1] hover:border-[#dfc49c] cursor-pointer transition-all shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f4eee6] group-hover:bg-[#feb234] text-xs font-extrabold text-[#3d0c02] transition-colors">
                            {accInitials}
                          </div>
                          <div className="min-w-0 flex-1 text-left">
                            <p className="text-xs font-bold truncate text-[#3d0c02]">
                              {acc.name || acc.email}
                            </p>
                            <p className="text-[11px] text-[#7d6861] truncate">
                              {acc.email} · <span className="font-semibold uppercase text-[10px]">{acc.role || "Staff"}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 ml-2">
                          <span className="text-[11px] font-bold text-[#8c5307] group-hover:underline px-1.5 py-0.5 rounded bg-[#f3e7cb]/50">
                            Switch
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleRemoveAccount(e, acc.id)}
                            title="Remove account from device"
                            className="p-1 text-[#a8988e] hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-2 text-center text-xs text-[#7d6861] bg-white rounded-xl border border-[#ece7e1]">
                  <span>No other accounts signed in.</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setIsAddAccountOpen(true);
                    }}
                    className="block mx-auto mt-1 text-xs font-bold text-[#8c5307] hover:underline"
                  >
                    + Add Another Account
                  </button>
                </div>
              )}
            </div>

            {/* Quick Navigation Menu */}
            <div className="p-2 space-y-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate("/settings");
                }}
                className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-[#f8f3ec] transition-colors"
              >
                <span className="text-sm">⚙️</span>
                <span>Settings</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate("/change-password");
                }}
                className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-[#f8f3ec] transition-colors"
              >
                <span className="text-sm">🔒</span>
                <span>Change Password</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate("/sales-sessions?next=business-report");
                }}
                className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-[#f8f3ec] transition-colors"
              >
                <span className="text-sm">📊</span>
                <span>Business Reports</span>
              </button>
            </div>

            {/* Sign Out Options */}
            <div className="border-t border-[#ded9d3] p-2 bg-[#fdfaf7] space-y-1">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-between rounded-xl px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
              >
                <span>Sign Out ({displayName})</span>
                <span>🚪</span>
              </button>

              {savedAccounts.length > 1 && (
                <button
                  type="button"
                  onClick={handleLogoutAll}
                  className="w-full flex items-center justify-between rounded-xl px-3 py-1.5 text-[11px] font-bold text-[#7d6861] hover:text-red-700 hover:bg-red-50/50 transition-colors"
                >
                  <span>Sign out of all accounts</span>
                  <span>✕</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Account Modal */}
      <AddAccountModal
        isOpen={isAddAccountOpen}
        onClose={() => setIsAddAccountOpen(false)}
        onSuccess={() => {
          queryClient.clear();
          navigate("/pos");
        }}
      />
    </>
  );
}
