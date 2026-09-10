import React, { useState, useEffect } from "react";
import {
  User,
  Shield,
  Fingerprint,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  Globe,
  Save,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../lib/AuthContext";
import { useNavigate } from "react-router-dom";
import PasskeysManager from "../components/PasskeysManager";

export default function ProfileView() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  const [profileData, setProfileData] = useState({
    name: "",
    shortName: "",
    role: "",
    tagline: "",
    bio: "",
    location: "",
    email: "",
    about: [] as string[],
  });
  const [socialData, setSocialData] = useState({
    email: "",
    github: "",
    linkedin: "",
    discord: "",
    twitter: "",
    leetcode: "",
    hackerone: "",
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingSocial, setIsSavingSocial] = useState(false);

  useEffect(() => {
    // Check current user 2FA status
    if (user?.is2FAEnabled) {
      setIs2FAEnabled(true);
    }

    // Fetch profile data
    axios
      .get("/api/portfolio")
      .then((res) => {
        if (res.data.success && res.data.data.developer) {
          setProfileData(res.data.data.developer);
        }
        if (res.data.success && res.data.data.social) {
          setSocialData(res.data.data.social);
        }
      })
      .catch(console.error);
  }, [user]);

  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const res = await axios.put("/api/portfolio/profile", profileData, {
        withCredentials: true,
      });
      if (res.data.success) {
        showMessage("Profile updated successfully", "success");
      }
    } catch (err: any) {
      showMessage(err.response?.data?.message || "Failed to update profile", "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSocialData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSocialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSocial(true);
    try {
      const res = await axios.put("/api/portfolio/social", socialData, {
        withCredentials: true,
      });
      if (res.data.success) {
        showMessage("Social links updated successfully", "success");
      }
    } catch (err: any) {
      showMessage(
        err.response?.data?.message || "Failed to update social links",
        "error",
      );
    } finally {
      setIsSavingSocial(false);
    }
  };

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleSetup2FA = async () => {
    try {
      setLoading(true);
      const res = await axios.post("/api/auth/2fa/setup");
      if (res.data.success) {
        setQrCodeUrl(res.data.data.qrCodeUrl);
        showMessage(
          "2FA setup initialized. Scan the QR code with your authenticator app.",
          "success",
        );
      }
    } catch (err: any) {
      showMessage(err.response?.data?.message || "Failed to setup 2FA", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    try {
      setLoading(true);
      const res = await axios.post("/api/auth/2fa/disable");
      if (res.data.success) {
        setIs2FAEnabled(false);
        setQrCodeUrl("");
        showMessage("2FA has been disabled.", "success");
      }
    } catch (err: any) {
      showMessage(err.response?.data?.message || "Failed to disable 2FA", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-2">
            <User className="w-6 h-6 text-[var(--primary)]" />
            Admin Profile
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your account security, two-factor authentication, and passkeys.
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg text-sm font-medium transition-all"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      {message.text && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
              : "bg-red-500/10 border-red-500/20 text-red-500"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0" />
          )}
          <p>{message.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Info */}
        <div className="glass-panel  rounded-2xl p-6 shadow-sm flex flex-col h-full lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="floating-gravity w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
              <User className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Developer Identity
              </h2>
              <p className="text-xs text-slate-500">
                Manage your public portfolio details
              </p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4 flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold opacity-80">Full Name</label>
                <input
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  className="w-full bg-[var(--background)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold opacity-80">Short Name</label>
                <input
                  name="shortName"
                  value={profileData.shortName}
                  onChange={handleProfileChange}
                  className="w-full bg-[var(--background)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold opacity-80">Role</label>
                <input
                  name="role"
                  value={profileData.role}
                  onChange={handleProfileChange}
                  className="w-full bg-[var(--background)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold opacity-80">Location</label>
                <input
                  name="location"
                  value={profileData.location}
                  onChange={handleProfileChange}
                  className="w-full bg-[var(--background)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold opacity-80">Tagline</label>
              <input
                name="tagline"
                value={profileData.tagline}
                onChange={handleProfileChange}
                className="w-full bg-[var(--background)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold opacity-80">Bio (Short)</label>
              <textarea
                name="bio"
                value={profileData.bio}
                onChange={handleProfileChange}
                rows={3}
                className="w-full bg-[var(--background)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold opacity-80">About (Paragraphs)</label>
              <textarea
                value={profileData.about.join("\n\n")}
                onChange={(e) =>
                  setProfileData({
                    ...profileData,
                    about: e.target.value.split("\n\n").filter(Boolean),
                  })
                }
                rows={6}
                className="w-full bg-[var(--background)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                placeholder="Separate paragraphs with double newlines"
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-8 py-3 rounded-xl bg-indigo-500 text-white hover:scale-105 transition-transform font-bold flex items-center gradient-heading gap-2 shadow-lg disabled:opacity-50"
              >
                {isSavingProfile ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        </div>

        {/* Social Links */}
        <div className="glass-panel  rounded-2xl p-6 shadow-sm flex flex-col h-full lg:col-span-1">
          <div className="flex items-center gap-3 mb-6">
            <div className="floating-gravity w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Globe className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Social Links
              </h2>
              <p className="text-xs text-slate-500">Manage your social profiles</p>
            </div>
          </div>

          <form
            onSubmit={handleSocialSubmit}
            className="space-y-4 flex-1 flex flex-col justify-between"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                "email",
                "github",
                "linkedin",
                "twitter",
                "discord",
                "leetcode",
                "hackerone",
              ].map((key) => (
                <div key={key} className="space-y-1.5">
                  <label className="text-sm font-bold opacity-80 capitalize">{key}</label>
                  <input
                    name={key}
                    value={(socialData as any)[key] || ""}
                    onChange={handleSocialChange}
                    className="w-full bg-[var(--background)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                    placeholder={`Enter ${key} ${key === "email" ? "address" : "url/username"}`}
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isSavingSocial}
                className="px-6 py-2.5 rounded-xl bg-indigo-500 text-white hover:scale-105 transition-transform font-bold flex items-center gradient-heading gap-2 shadow-lg disabled:opacity-50 text-sm"
              >
                {isSavingSocial ? "Saving..." : "Save Social Links"}
              </button>
            </div>
          </form>
        </div>

        {/* Security / 2FA */}
        <div className="glass-panel  rounded-2xl p-6 shadow-sm flex flex-col h-full lg:col-span-1">
          <div className="flex items-center gap-3 mb-6">
            <div className="floating-gravity w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Security Center
              </h2>
              <p className="text-xs text-slate-500">2FA & Recovery</p>
            </div>
          </div>

          <div className="space-y-4 flex-1">
            {is2FAEnabled ? (
              <div className="flex flex-col h-full justify-between items-start gap-4">
                <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-lg text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  2FA is currently enabled
                </div>
                <button
                  onClick={handleDisable2FA}
                  disabled={loading}
                  className="px-4 py-2 bg-[var(--background)]  hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-500 rounded-lg text-sm font-medium transition-all"
                >
                  Disable 2FA
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-slate-400">
                  Secure your account with TOTP two-factor authentication (e.g. Google
                  Authenticator, Authy).
                </p>
                {!qrCodeUrl ? (
                  <button
                    onClick={handleSetup2FA}
                    disabled={loading}
                    className="self-start flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-all shadow-md"
                  >
                    <KeyRound className="w-4 h-4" />
                    Setup 2FA
                  </button>
                ) : (
                  <div className="p-4 bg-[var(--background)]  rounded-xl flex flex-col items-center gap-4">
                    <p className="text-xs text-center text-slate-400">
                      Scan this QR code with your authenticator app
                    </p>
                    <div className="bg-white p-2 rounded-xl">
                      <img src={qrCodeUrl} alt="2FA QR Code" className="w-40 h-40" />
                    </div>
                    <button
                      onClick={() => {
                        setIs2FAEnabled(true);
                        setQrCodeUrl("");
                        showMessage(
                          "2FA setup complete! Make sure you scanned the code.",
                          "success",
                        );
                      }}
                      className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-all shadow-md"
                    >
                      I have scanned the code
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Passkeys */}
        <div className="glass-panel  rounded-2xl p-6 shadow-sm flex flex-col h-full lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="floating-gravity w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
              <Fingerprint className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Passkeys</h2>
              <p className="text-xs text-slate-500">
                Passwordless login using biometrics or security keys
              </p>
            </div>
          </div>

          <div className="mt-2">
            <PasskeysManager onMessage={showMessage} />
          </div>
        </div>
      </div>
    </div>
  );
}
