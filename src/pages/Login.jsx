import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import AuthSplitLayout from "@/components/AuthSplitLayout";
import GoogleIcon from "@/components/GoogleIcon";
import MicrosoftIcon from "@/components/MicrosoftIcon";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      leftTitle="Hello, Welcome!"
      leftSubtitle="Don't have an account?"
      leftLinkLabel="Register"
      leftLinkTo="/register"
    >
      <h1 className="text-3xl font-bold text-center text-foreground mb-6">Login</h1>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 mb-5">
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
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-12 bg-[#f0f2f8] border-transparent focus:border-primary"
          required
        />
        <div className="text-right">
          <Link to="/forgot-password" className="text-xs text-primary hover:underline">
            Forgot Password?
          </Link>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Logging in...</> : "Login"}
        </button>
      </form>

      <div className="relative mb-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-muted-foreground">or continue with</span>
        </div>
      </div>

      <div className="flex gap-3">
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

      {/* Mobile link */}
      <p className="md:hidden text-center text-sm text-muted-foreground mt-6">
        Don't have an account?{" "}
        <Link to="/register" className="text-primary font-medium hover:underline">Register</Link>
      </p>
    </AuthSplitLayout>
  );
}