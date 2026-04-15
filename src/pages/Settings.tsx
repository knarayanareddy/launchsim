import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Upload, AlertTriangle, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const Settings = () => {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [emailPrefs, setEmailPrefs] = useState(
    profile?.email_prefs || { simulation_complete: true, credit_warnings: true, product_updates: true }
  );
  const [savingPrefs, setSavingPrefs] = useState(false);

  const handleSaveEmailPrefs = async () => {
    if (!user) return;
    setSavingPrefs(true);
    const { error } = await supabase
      .from("profiles")
      .update({ email_prefs: emailPrefs as any })
      .eq("id", user.id);
    setSavingPrefs(false);
    if (error) {
      toast.error("Failed to save email preferences.");
    } else {
      toast.success("Email preferences saved!");
      await refreshProfile();
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to update profile.");
    } else {
      toast.success("Profile updated!");
      await refreshProfile();
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadError) {
      toast.error("Upload failed.");
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
    await refreshProfile();
    setUploading(false);
    toast.success("Avatar updated!");
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setChangingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPw(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password changed!");
      setNewPassword("");
    }
  };

  const handleDeleteAccount = async () => {
    // For safety, account deletion should be handled via an edge function
    // For now, sign out and show instructions
    toast.info("Please contact support to delete your account.");
    setDeleteOpen(false);
  };

  const initials = (profile?.full_name || user?.email || "?")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-6 pt-24 pb-16 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        {/* Profile */}
        <section className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6 space-y-4">
          <h2 className="text-lg font-semibold">Profile</h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div>
              <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="border-white/10 text-sm gap-1.5">
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                Upload Avatar
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-white/5 border-white/10 text-foreground focus-visible:ring-primary" />
          </div>
          <Button onClick={handleSaveProfile} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save Changes
          </Button>
        </section>

        {/* Account */}
        <section className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6 space-y-4">
          <h2 className="text-lg font-semibold">Account</h2>
          <div>
            <Label className="text-muted-foreground text-xs">Email</Label>
            <p className="text-foreground font-mono text-sm">{user?.email}</p>
          </div>
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="bg-white/5 border-white/10 text-foreground focus-visible:ring-primary" />
          </div>
          <Button variant="outline" onClick={handleChangePassword} disabled={changingPw || !newPassword} className="border-white/10">
            {changingPw ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Change Password
          </Button>
        </section>

        {/* Plan */}
        <section className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6 space-y-3">
          <h2 className="text-lg font-semibold">Plan</h2>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/20 text-primary capitalize">
              {profile?.plan_tier || "free"}
            </span>
            <span className="text-sm text-muted-foreground">
              {profile?.credits_remaining ?? 3} credits remaining · {profile?.simulations_run ?? 0} simulations run
            </span>
          </div>
          <Button variant="outline" className="border-white/10" onClick={() => navigate("/pricing")}>
            Upgrade Plan
          </Button>
        </section>

        {/* Email Preferences */}
        <section className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" /> Email Notifications
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Simulation complete</p>
                <p className="text-xs text-muted-foreground">Get notified when your simulation results are ready</p>
              </div>
              <Switch
                checked={emailPrefs.simulation_complete}
                onCheckedChange={(v) => setEmailPrefs((p) => ({ ...p, simulation_complete: v }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Credit warnings</p>
                <p className="text-xs text-muted-foreground">Alert when you're running low on simulation credits</p>
              </div>
              <Switch
                checked={emailPrefs.credit_warnings}
                onCheckedChange={(v) => setEmailPrefs((p) => ({ ...p, credit_warnings: v }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Product updates</p>
                <p className="text-xs text-muted-foreground">New features and improvements</p>
              </div>
              <Switch
                checked={emailPrefs.product_updates}
                onCheckedChange={(v) => setEmailPrefs((p) => ({ ...p, product_updates: v }))}
              />
            </div>
          </div>
          <Button onClick={handleSaveEmailPrefs} disabled={savingPrefs} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {savingPrefs ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save Preferences
          </Button>
        </section>

        {/* Danger Zone */}
        <section className="border border-destructive/30 rounded-xl p-6 space-y-3">
          <h2 className="text-lg font-semibold text-destructive flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Danger Zone
          </h2>
          <p className="text-sm text-muted-foreground">Permanently delete your account and all data.</p>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>Delete Account</Button>
        </section>

        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-destructive">Delete Account</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Type <span className="text-foreground font-mono">DELETE</span> to confirm.
            </p>
            <Input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="DELETE" className="bg-white/5 border-white/10 text-foreground" />
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)} className="border-white/10">Cancel</Button>
              <Button variant="destructive" disabled={deleteConfirm !== "DELETE"} onClick={handleDeleteAccount}>Delete My Account</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Settings;
