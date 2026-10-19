import { useNavigate } from "react-router-dom";
import ChangePasswordForm from "../components/settings/ChangePasswordForm";

function ChangePasswordPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#fef9f2] font-sans text-[#1d1c18]">
      <header className="sticky top-0 z-50 flex w-full items-center justify-between bg-[#3d0c02] px-4 py-3 sm:px-6 sm:py-4 text-white shadow-md">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            type="button"
            onClick={() => navigate("/settings")}
            className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full transition hover:bg-white/10 active:scale-95"
            aria-label="Back to Settings"
          >
            <span className="text-2xl sm:text-[28px]">←</span>
          </button>

          <div className="flex flex-col min-w-0">
            <h1 className="text-xl sm:text-[24px] font-bold leading-tight text-white truncate">
              Change Password
            </h1>
            <p className="text-xs sm:text-[14px] font-medium text-white/70 truncate">
              Update your account password securely
            </p>
          </div>
        </div>
      </header>

      <main className="min-h-screen px-4 sm:px-6 pb-6 pt-4 sm:pt-6">
        <div className="mx-auto max-w-3xl py-10">
          <ChangePasswordForm />
        </div>
      </main>
    </div>
  );
}

export default ChangePasswordPage;