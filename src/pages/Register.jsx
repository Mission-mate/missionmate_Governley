import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "@/components/ui/use-toast";
import AuthSplitLayout from "@/components/AuthSplitLayout";
import GoogleIcon from "@/components/GoogleIcon";
import MicrosoftIcon from "@/components/MicrosoftIcon";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const result = await base44.auth.register({ email, password });
      // Supabase skips the email code when "Confirm email" is turned off.
      if (result?.session) {
        window.location.href = "/";
        return;
      }
      setShowOtp(true);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
      toast({ title: "Code sent", description: "Check your email for the new code." });
    } catch (err) {
      setError(err.message || "Failed to resend code");
    }
  };

  if (showOtp) {
    return (
      <AuthSplitLayout
        leftTitle="Almost there!"
        leftSubtitle="Verify your email to complete sign-up."
      >
        <h1 className="text-3xl font-bold text-center text-foreground mb-2">Verify Email</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">We sent a code to <span className="font-medium text-foreground">{email}</span></p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">{error}</div>
        )}

        <div className="flex justify-center mb-6">
          <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <button
          onClick={handleVerify}
          disabled={loading || otpCode.length < 6}
          className="w-full h-12 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : "Verify"}
        </button>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Didn't receive it?{" "}
          <button onClick={handleResend} className="text-primary font-medium hover:underline">Resend</button>
        </p>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout
      leftTitle="Welcome Back!"
      leftSubtitle="Already have an account? Sign in."
      leftLinkLabel="Sign In"
      leftLinkTo="/login"
    >
      <h1 className="text-3xl font-bold text-center text-foreground mb-5">Create Account</h1>

      <div className="flex gap-3 mb-5">
        <button
          onClick={() => base44.auth.loginWithProvider("google", "/")}
          className="flex-1 h-11 flex items-center justify-center gap-2 rounded-lg border border-border bg-white hover:bg-muted/40 transition-colors text-sm font-medium text-foreground"
        >
          <GoogleIcon className="w-5 h-5" />
          Google
        </button>
        <button
          onClick={() => base44.auth.loginWithProvider("microsoft", "/")}
          className="flex-1 h-11 flex items-center justify-center gap-2 rounded-lg border border-border bg-white hover:bg-muted/40 transition-colors text-sm font-medium text-foreground"
        >
          <MicrosoftIcon className="w-5 h-5" />
          Microsoft
        </button>
      </div>

      <div className="relative mb-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-muted-foreground">or use your email for registration</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          autoComplete="email"
          autoFocus
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 bg-[#f0f2f8] border-transparent focus:border-primary"
          required
        />
        <Input
          type="password"
          autoComplete="new-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-12 bg-[#f0f2f8] border-transparent focus:border-primary"
          required
        />
        <Input
          type="password"
          autoComplete="new-password"
          placeholder="Confirm Password"
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
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : "Sign Up"}
        </button>
      </form>

      <p className="md:hidden text-center text-sm text-muted-foreground mt-6">
        Already have an account?{" "}
        <Link to="/login" className="text-primary font-medium hover:underline">Sign In</Link>
      </p>
    </AuthSplitLayout>
  );
}