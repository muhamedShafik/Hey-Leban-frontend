import AppRouter from "./router/AppRouter";
import { useEffect, useRef } from "react";
import { useAuthStore } from "./store/authStore";
import PWAUpdatePrompt from "./components/PWAUpdatePrompt";

function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    initializeAuth();
  }, [initializeAuth]);

  return (
    <>
      <AppRouter />
      <PWAUpdatePrompt />
    </>
  );
}

export default App;