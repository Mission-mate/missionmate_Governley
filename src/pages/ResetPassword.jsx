import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Loader2, AlertTriangle } from "lucide-react";
import AuthSplitLayout from "@/components/AuthSplitLayout";

// Supabase sends people back from the reset email with ?code=… (or #type=recovery).
// Read it when the app first loads, before the Supabase client tidies the address bar.
const hasRecoveryLink = () => {
  if (typeof window === "undefined" || window.location.pathname !== "/reset-password") return false;
  const q = new URLSearchParams(window.location.search);
  if (q.get("token_hash")) return q.get("token_hash");
  if (q.get("token")) return q.get("token");
  return q.has("code") || q.get("recovery") === "1" || /type=recovery/.test(window.location.hash) ? "supabase-recovery" : null;
};
const RECOVERY_LINK_AT_LOAD = hasRecoveryLink();
// "recovery" (forgot password) or "invite" (new team member choosing their first password).
const LINK_TYPE = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("type") || "recovery" : "recovery";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [resetToken] = useState(() => RECOVERY_LINK_AT_LOAD || hasRecoveryLink() || searchParams.get("token"));

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.resetPassword({ resetToken, newPassword, type: LINK_TYPE });
      window.location.href = "/login";
    } catch (err) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (!resetToken) {
    return (
      <AuthSplitLayout
        leftTitle="Invalid Link"
        leftSubtitle="This reset link is missing or expired."
        leftLinkLabel="Request New Link"
        leftLinkTo="/forgot-password"
      >
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Invalid Reset Link</h1>
          <p className="text-sm text-muted-foreground mb-6">
            The link you used appears to be incomplete. Please request a new password reset email.
          </p>
          <Link to="/forgot-password" className="text-primary font-medium hover:underline text-sm">
            Request a new link
          </Link>
        </div>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout
      leftTitle="New Password"
      leftSubtitle="Create a strong password to secure your account."
    >
      <h1 className="text-3xl font-bold text-center text-foreground mb-2">Set New Password</h1>
      <p className="text-sm text-muted-foreground text-center mb-6">Enter and confirm your new password.</p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="password"
          autoComplete="new-password"
          autoFocus
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="h-12 bg-[#f0f2f8] border-transparent focus:border-primary"
          required
        />
        <Input
          type="password"
          autoComplete="new-password"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="h-12 bg-[#f0f2f8] border-transparent focus:border-primary"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Resetting...</> : "Reset Password"}
        </button>
      </form>
    </AuthSplitLayout>
  );
}