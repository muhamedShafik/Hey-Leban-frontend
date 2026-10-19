import { useRegisterSW } from "virtual:pwa-register/react";

/**
 * Shows a small toast at the bottom of the screen when a new
 * service-worker update is available and lets the user reload.
 */
export default function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Check for updates every hour
      r && setInterval(() => r.update(), 60 * 60 * 1000);
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "env(safe-area-inset-bottom, 24px)",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        background: "rgba(15,23,42,0.95)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "16px",
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        minWidth: "280px",
        maxWidth: "calc(100vw - 32px)",
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{ color: "#60a5fa", fontSize: "20px", flexShrink: 0 }}
      >
        system_update
      </span>
      <span style={{ color: "#e2e8f0", fontSize: "14px", flex: 1 }}>
        New version available
      </span>
      <button
        onClick={() => updateServiceWorker(true)}
        style={{
          background: "#3b82f6",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          padding: "6px 14px",
          fontSize: "13px",
          fontWeight: 600,
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        Reload
      </button>
      <button
        onClick={() => setNeedRefresh(false)}
        style={{
          background: "transparent",
          color: "#94a3b8",
          border: "none",
          borderRadius: "8px",
          padding: "6px",
          fontSize: "13px",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  );
}
