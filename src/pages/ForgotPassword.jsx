import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2 } from "lucide-react";
import AuthSplitLayout from "@/components/AuthSplitLayout";
import { LIFT_HOVER } from "@/components/shared/liftHover";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.auth.resetPasswordRequest(email);
    } catch {
      // Always show success
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <AuthSplitLayout
      leftTitle="Reset Your Password"
      leftSubtitle="We'll send you a link to get back in."
      leftLinkLabel="Back to Login"
      leftLinkTo="/login"
    >
      <h1 className="text-3xl font-bold text-center text-foreground mb-2">Forgot Password</h1>
      <p className="text-sm text-muted-foreground text-center mb-6">Enter your email and we'll send you a reset link.</p>

      {sent ? (
        <div className="text-center">
          <p className="text-sm text-foreground mb-6">
            If an account exists with that email, you'll receive a password reset link shortly.
          </p>
          <Link
            to="/login"
            className={`inline-flex items-center gap-1 text-sm text-primary font-medium hover:underline ${LIFT_HOVER}`}
          >
            <ArrowLeft className="w-3 h-3" /> Back to Login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            autoComplete="email"
            autoFocus
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 bg-[#f0f2f8] border-transparent focus:border-primary"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : "Send Reset Link"}
          </button>
          <div className="text-center">
            <Link to="/login" className={`inline-flex items-center gap-1 text-sm text-primary hover:underline ${LIFT_HOVER}`}>
              <ArrowLeft className="w-3 h-3" /> Back to Login
            </Link>
          </div>
        </form>
      )}
    </AuthSplitLayout>
  );
}