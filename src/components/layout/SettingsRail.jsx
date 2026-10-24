// Icon-only settings shortcuts: vertical rail (tablet/desktop) + tile grid (mobile)
import { useLocation } from "react-router-dom";

const iconProps = {
  fill: "none",
  viewBox: "0 0 24 24",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  className: "h-6 w-6",
};

export const SETTINGS_ITEMS = [
  {
    key: "items",
    label: "Add Items",
    path: "/settings/items",
    icon: (
      <svg {...iconProps}>
        <path d="M12 5v14M5 12h14" />
        <rect x="3" y="3" width="18" height="18" rx="4" />
      </svg>
    ),
  },
  {
    key: "report",
    label: "Business Report",
    path: "/sales-sessions?next=business-report",
    match: ["/business-report"],
    icon: (
      <svg {...iconProps}>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </svg>
    ),
  },
  {
    key: "summary",
    label: "Summary",
    path: "/sales-sessions?next=summary",
    match: ["/summary"],
    icon: (
      <svg {...iconProps}>
        <path d="M7 3h10a2 2 0 0 1 2 2v16l-3-2-2 2-2-2-2 2-2-2-3 2V5a2 2 0 0 1 2-2z" />
        <path d="M9 8h6M9 12h6" />
      </svg>
    ),
  },
  {
    key: "stock",
    label: "Stock Management",
    path: "/settings/inventory",
    icon: (
      <svg {...iconProps}>
        <path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8" />
      </svg>
    ),
  },
  {
    key: "password",
    label: "Change Password",
    path: "/change-password",
    icon: (
      <svg {...iconProps}>
        <rect x="4" y="11" width="16" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </svg>
    ),
  },
];

const isActive = (item, pathname) => {
  const base = item.path.split("?")[0];
  return pathname === base || (item.match || []).includes(pathname);
};

/** Vertical icon rail – shown on md+ when toggled open. */
export function SettingsRail({ open, onNavigate }) {
  const { pathname } = useLocation();
  return (
    <aside
      aria-hidden={!open}
      className={`hidden md:flex shrink-0 flex-col items-center gap-2 overflow-hidden bg-[#2c0801] transition-all duration-300 ease-in-out ${
        open ? "w-[68px] py-3 opacity-100" : "w-0 py-3 opacity-0"
      }`}
    >
      {SETTINGS_ITEMS.map((item) => (
        <button
          key={item.key}
          type="button"
          id={`rail-${item.key}`}
          title={item.label}
          aria-label={item.label}
          tabIndex={open ? 0 : -1}
          onClick={() => onNavigate(item.path)}
          className={`group relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all active:scale-90 ${
            isActive(item, pathname)
              ? "bg-[#E8A020] text-[#3d0c02] shadow-lg"
              : "text-white/70 hover:bg-white/10 hover:text-white"
          }`}
        >
          {item.icon}
          <span className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
            {item.label}
          </span>
        </button>
      ))}
    </aside>
  );
}

/** Large touch-friendly icon tiles – for the mobile menu. */
export function SettingsTiles({ onNavigate }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {SETTINGS_ITEMS.map((item) => (
        <button
          key={item.key}
          type="button"
          title={item.label}
          aria-label={item.label}
          onClick={() => onNavigate(item.path)}
          className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl bg-white/10 p-2 text-[#feb234] transition active:scale-90 active:bg-[#E8A020] active:text-[#3d0c02]"
        >
          {item.icon}
          <span className="text-center text-[10px] font-semibold leading-tight text-white/80">
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
}
