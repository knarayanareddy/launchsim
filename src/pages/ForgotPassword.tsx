import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-[440px] space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-2xl">🐟</span>
            <span className="font-bold text-xl text-foreground">LaunchSim</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Reset your password</h1>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
          {sent ? (
            <div className="text-center py-4 space-y-3">
              <Mail className="w-10 h-10 mx-auto text-primary" />
              <p className="text-foreground font-medium">Check your email</p>
              <p className="text-sm text-muted-foreground">We sent a reset link to <span className="text-foreground">{email}</span></p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="bg-white/5 border-white/10 text-foreground focus-visible:ring-primary" />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Send reset link
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          <Link to="/login" className="text-primary hover:underline font-medium">← Back to sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
