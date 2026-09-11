import React, { useState, useEffect } from "react";
import axios from "axios";
import { Fingerprint, Plus, Trash2, Key } from "lucide-react";
import { startRegistration } from "@simplewebauthn/browser";

interface Passkey {
  id: string;
  createdAt: string;
  transports: string | null;
}

export default function PasskeysManager({
  onMessage,
}: {
  onMessage: (msg: string, type: "success" | "error") => void;
}) {
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPasskeys = async () => {
    try {
      const res = await axios.get("/api/auth/passkeys");
      if (res.data.success) {
        setPasskeys(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch passkeys", err);
    }
  };

  useEffect(() => {
    fetchPasskeys();
  }, []);

  const handleAddPasskey = async () => {
    try {
      setLoading(true);
      // 1. Get options from server
      const optRes = await axios.post("/api/auth/passkey/generate-options");
      if (!optRes.data.success) {
        throw new Error(optRes.data.message || "Failed to get passkey options");
      }
      const options = optRes.data.data;

      // 2. Pass options to browser authenticator
      const attResp = await startRegistration(options);

      // 3. Send response to server to verify
      const verificationResp = await axios.post(
        "/api/auth/passkey/verify-registration",
        attResp,
      );

      if (verificationResp.data.success) {
        onMessage("Passkey successfully registered!", "success");
        fetchPasskeys(); // refresh list
      } else {
        throw new Error(verificationResp.data.message || "Passkey registration failed");
      }
    } catch (err: any) {
      console.error("Passkey registration failed", err);
      if (err.name === "NotAllowedError") {
        onMessage("Passkey registration was cancelled or timed out.", "error");
      } else {
        onMessage(
          "Failed to register passkey: " + (err.response?.data?.message || err.message),
          "error",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this passkey?")) return;
    try {
      setLoading(true);
      const res = await axios.delete(`/api/auth/passkeys/${id}`);
      if (res.data.success) {
        onMessage("Passkey deleted.", "success");
        setPasskeys((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err: any) {
      onMessage(
        "Failed to delete passkey: " + (err.response?.data?.message || err.message),
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {passkeys.length > 0 ? (
        <div className="space-y-3">
          {passkeys.map((pk) => (
            <div
              key={pk.id}
              className="flex items-center justify-between p-4 bg-[var(--background)] border border-[var(--border)] rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--foreground)]/5 flex items-center justify-center">
                  <Key className="w-5 h-5 text-[var(--foreground)]" />
                </div>
                <div>
                  <p className="font-medium text-[var(--foreground)] text-sm">
                    Passkey Device
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Added on {new Date(pk.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(pk.id)}
                disabled={loading}
                className="p-2 text-[var(--muted-foreground)] hover:text-[var(--destructive)] hover:bg-[var(--destructive)]/10 rounded-lg transition-colors"
                title="Remove Passkey"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 bg-[var(--background)] border border-[var(--border)] rounded-xl text-center">
          <p className="text-sm text-[var(--muted-foreground)]">No passkeys added yet.</p>
        </div>
      )}

      <button
        onClick={handleAddPasskey}
        disabled={loading}
        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-[var(--foreground)] hover:bg-[var(--foreground)]/90 text-white rounded-lg text-sm font-medium transition-all shadow-sm shadow-indigo-500/20"
      >
        <Plus className="w-4 h-4" />
        Add New Passkey
      </button>
    </div>
  );
}
