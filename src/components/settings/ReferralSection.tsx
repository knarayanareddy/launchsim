import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Copy, Mail, Twitter, Linkedin, Gift, Check } from "lucide-react";

const APP_URL = "https://launchsim.lovable.app";

interface ReferralEvent {
  id: string;
  referred_id: string;
  credit_awarded: boolean;
  created_at: string;
}

const TIERS = [
  { min: 1, badge: "🌱", label: "Getting started", credits: 3 },
  { min: 5, badge: "🌊", label: "Wave maker", credits: 15 },
  { min: 10, badge: "🐟", label: "Swarm leader", credits: 30 },
];

export default function ReferralSection() {
  const { profile, refreshProfile } = useAuth();
  const [events, setEvents] = useState<ReferralEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const referralCode = profile?.referral_code || "";
  const referralUrl = `${APP_URL}/signup?ref=${referralCode}`;
  const totalReferrals = profile?.total_referrals || 0;
  const creditsEarned = totalReferrals * 3;

  const currentTier = [...TIERS].reverse().find((t) => totalReferrals >= t.min) || null;
  const nextTier = TIERS.find((t) => totalReferrals < t.min) || null;
  const progressToNext = nextTier
    ? Math.round((totalReferrals / nextTier.min) * 100)
    : 100;

  useEffect(() => {
    if (!profile) return;
    supabase
      .from("referral_events")
      .select("id, referred_id, credit_awarded, created_at")
      .eq("referrer_id", profile.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setEvents((data as ReferralEvent[]) || []);
        setLoading(false);
      });
  }, [profile]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const tweetText = encodeURIComponent(
    `I've been using @LaunchSimApp to simulate user reactions to my product ideas — it's 🔥 Sign up with my link and get a bonus simulation: ${referralUrl}`
  );

  const emailSubject = encodeURIComponent("Try LaunchSim — simulate your product launch");
  const emailBody = encodeURIComponent(
    `Hey!\n\nI've been using LaunchSim to test product ideas with AI-generated crowds. It's really cool — you get a launch readiness score in 60 seconds.\n\nSign up with my link and you'll get a bonus simulation credit:\n${referralUrl}\n\nCheck it out!`
  );

  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`;

  return (
    <section className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Gift className="w-5 h-5 text-primary" /> Refer Friends
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Give 1 bonus credit, get 3 free simulations for each signup
        </p>
      </div>

      {/* Referral link */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Your referral link
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm font-mono text-foreground truncate">
            {referralUrl}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="border-white/10 shrink-0 gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>

      {/* Share buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className="border-white/10 text-xs gap-1.5"
          onClick={() => window.open(`mailto:?subject=${emailSubject}&body=${emailBody}`, "_blank")}
        >
          <Mail className="w-3.5 h-3.5" /> Email
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-white/10 text-xs gap-1.5"
          onClick={() => window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, "_blank")}
        >
          <Twitter className="w-3.5 h-3.5" /> Twitter
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-white/10 text-xs gap-1.5"
          onClick={() => window.open(linkedInUrl, "_blank")}
        >
          <Linkedin className="w-3.5 h-3.5" /> LinkedIn
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/[0.03] rounded-lg p-3">
          <p className="text-xs text-muted-foreground">People referred</p>
          <p className="text-xl font-bold text-foreground">{totalReferrals}</p>
        </div>
        <div className="bg-white/[0.03] rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Credits earned</p>
          <p className="text-xl font-bold text-success">+{creditsEarned}</p>
        </div>
      </div>

      {/* Tier progress */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Referral tier
        </p>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{currentTier?.badge || "🌱"}</span>
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-foreground font-medium">
                {currentTier?.label || "No referrals yet"}
              </span>
              {nextTier && (
                <span className="text-muted-foreground">
                  {totalReferrals}/{nextTier.min} to {nextTier.badge} {nextTier.label}
                </span>
              )}
            </div>
            <Progress value={progressToNext} className="h-1.5" />
          </div>
        </div>

        {/* All tiers */}
        <div className="flex gap-4 mt-2">
          {TIERS.map((tier) => (
            <div
              key={tier.min}
              className={`text-center text-xs ${
                totalReferrals >= tier.min ? "opacity-100" : "opacity-40"
              }`}
            >
              <span className="text-lg">{tier.badge}</span>
              <p className="text-muted-foreground mt-0.5">{tier.min}+</p>
              <p className="text-foreground font-medium">{tier.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Referral history */}
      {events.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Recent referrals
          </p>
          <div className="space-y-1.5">
            {events.slice(0, 5).map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between bg-white/[0.02] rounded-lg px-3 py-2 text-xs"
              >
                <span className="text-muted-foreground">
                  Referral · {new Date(event.created_at).toLocaleDateString()}
                </span>
                <span className={event.credit_awarded ? "text-success" : "text-warning"}>
                  {event.credit_awarded ? "✅ +3 credits" : "⏳ Pending"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
