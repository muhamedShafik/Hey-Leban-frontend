import { useState, useEffect } from "react";
import { useSearchParams, useParams, useNavigate, Link } from "react-router-dom";
import { validateResetToken, resetPassword } from "../services/authService";

const EyeIcon = ({ open }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="h-5 w-5"
    aria-hidden="true"
  >
    {open ? (
      <>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="m3 3 18 18" />
        <path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58" />
        <path d="M9.88 5.09A10.94 10.94 0 0 1 12 5c6.5 0 10 7 10 7a13.16 13.16 0 0 1-2.17 2.94" />
        <path d="M6.61 6.61C4.62 7.95 3.3 10 2 12c0 0 3.5 7 10 7 2.05 0 3.81-.7 5.29-1.72" />
      </>
    )}
  </svg>
);

function LinkExpiredMessage({ message }) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
        <svg
          className="h-8 w-8 text-amber-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <h1 className="text-2xl font-extrabold text-[#3d0c02]">
        Link Invalid or Expired
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-[#54433f]">
        {message || "This link is invalid or has expired"}
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <Link
          to="/forgot-password"
          className="flex h-12 w-full items-center justify-center rounded-xl bg-[#E8A020] text-sm font-bold text-white transition hover:brightness-105 active:scale-[0.99]"
        >
          Request a New Link
        </Link>
        <Link
          to="/login"
          className="flex h-12 w-full items-center justify-center rounded-xl bg-[#f8f3ec] text-sm font-semibold text-[#54433f] transition hover:bg-[#f0e7db] active:scale-[0.99]"
        >
          Return to Login
        </Link>
      </div>
    </div>
  );
}

function NewPasswordForm({ token }) {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [inlineError, setInlineError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setInlineError("");

    if (!newPassword) {
      setInlineError("Please enter a new password");
      return;
    }

    if (newPassword.length < 8) {
      setInlineError("Password must be at least 8 characters long");
      return;
    }

    if (!confirmPassword) {
      setInlineError("Please confirm your new password");
      return;
    }

    if (newPassword !== confirmPassword) {
      setInlineError("Passwords do not match");
      return;
    }

    try {
      setSubmitting(true);
      await resetPassword(token, newPassword);
      setSuccessMessage("Password reset! Redirecting to login...");

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1500);
    } catch (err) {
      const errMessage =
        err?.response?.data?.message ||
        "Failed to reset password. The link may have expired.";
      setInlineError(errMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
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
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#3d0c02]">
          Create New Password
        </h1>
        <p className="mt-2 text-sm text-[#54433f]">
          Your identity has been verified. Enter a secure new password for your account.
        </p>
      </div>

      {successMessage ? (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-bold">
            ✓
          </div>
          <p className="text-sm font-bold text-emerald-900">{successMessage}</p>
          <p className="mt-1 text-xs text-emerald-700">Please wait while we redirect you...</p>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="newPassword"
            className="px-1 text-sm font-bold text-[#54433f]"
          >
            New Password
          </label>
          <div className="flex items-center rounded-xl bg-[#f8f3ec] pr-3 transition focus-within:ring-2 focus-within:ring-[#E8A020]">
            <input
              id="newPassword"
              name="newPassword"
              type={showNew ? "text" : "password"}
              placeholder="At least 8 characters"
              value={newPassword}
              disabled={submitting || Boolean(successMessage)}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setInlineError("");
              }}
              className="h-12 w-full rounded-xl bg-transparent px-4 text-sm outline-none"
            />
            <button
              type="button"
              onClick={() => setShowNew((prev) => !prev)}
              className="p-1 text-[#6f5a54] transition hover:text-[#3d0c02]"
              aria-label={showNew ? "Hide password" : "Show password"}
            >
              <EyeIcon open={showNew} />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="confirmPassword"
            className="px-1 text-sm font-bold text-[#54433f]"
          >
            Confirm New Password
          </label>
          <div className="flex items-center rounded-xl bg-[#f8f3ec] pr-3 transition focus-within:ring-2 focus-within:ring-[#E8A020]">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="Re-enter new password"
              value={confirmPassword}
              disabled={submitting || Boolean(successMessage)}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setInlineError("");
              }}
              className="h-12 w-full rounded-xl bg-transparent px-4 text-sm outline-none"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((prev) => !prev)}
              className="p-1 text-[#6f5a54] transition hover:text-[#3d0c02]"
              aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
            >
              <EyeIcon open={showConfirm} />
            </button>
          </div>
        </div>

        {inlineError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {inlineError}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting || Boolean(successMessage)}
          className={`flex h-12 w-full items-center justify-center rounded-xl text-sm font-bold text-white transition hover:brightness-105 active:scale-[0.99] ${
            submitting || Boolean(successMessage)
              ? "cursor-not-allowed bg-gray-300 text-gray-500"
              : "bg-[#E8A020]"
          }`}
        >
          {submitting ? (
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
              Updating password...
            </span>
          ) : (
            "Reset Password"
          )}
        </button>
      </form>

      <div className="mt-6 flex flex-col items-center gap-2 border-t border-[#f2eae1] pt-5 text-center">
        <Link
          to="/login"
          className="text-sm font-semibold text-[#54433f] transition hover:text-[#3d0c02]"
        >
          Back to Login
        </Link>
      </div>
    </>
  );
}

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const { tokenParam } = useParams();
  const token = searchParams.get("token") || tokenParam;

  // State: 'loading' | 'valid' | 'invalid'
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isCancelled = false;

    if (!token) {
      setStatus("invalid");
      setErrorMessage("This link is invalid or has expired");
      return;
    }

    const validateToken = async () => {
      try {
        setStatus("loading");
        const res = await validateResetToken(token);

        if (isCancelled) return;

        // If backend returns { valid: false } or similar
        if (res && res.valid === false) {
          setStatus("invalid");
          setErrorMessage(res.message || "This link is invalid or has expired");
        } else {
          setStatus("valid");
        }
      } catch (err) {
        if (isCancelled) return;
        setStatus("invalid");
        const msg =
          err?.response?.data?.message || "This link is invalid or has expired";
        setErrorMessage(msg);
      }
    };

    validateToken();

    return () => {
      isCancelled = true;
    };
  }, [token]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fef9f2] px-4 py-8">
      <div className="w-full max-w-md rounded-3xl bg-white px-6 py-8 shadow-[0_10px_30px_rgba(61,12,2,0.08)]">
        {status === "loading" && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#f8f3ec] border-t-[#E8A020]" />
            <h2 className="mt-4 text-base font-bold text-[#3d0c02]">
              Verifying reset link...
            </h2>
            <p className="mt-1 text-xs text-[#54433f]">
              Please hold on while we validate your token.
            </p>
          </div>
        )}

        {status === "invalid" && (
          <LinkExpiredMessage message={errorMessage} />
        )}

        {status === "valid" && (
          <NewPasswordForm token={token} />
        )}
      </div>
    </div>
  );
}

export default ResetPasswordPage;
