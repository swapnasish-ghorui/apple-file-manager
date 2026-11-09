import React, { useState, useEffect } from "react";
import { X, Cloud, Key, Lock, Database, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { getR2Config, saveR2Config } from "../services/api";
import type { R2Config } from "../services/api";

interface R2SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export const R2SettingsModal: React.FC<R2SettingsModalProps> = ({ isOpen, onClose, onUpdated }) => {
  const [config, setConfig] = useState<R2Config | null>(null);
  const [accountId, setAccountId] = useState("");
  const [accessKeyId, setAccessKeyId] = useState("");
  const [secretAccessKey, setSecretAccessKey] = useState("");
  const [bucketName, setBucketName] = useState("");
  const [publicDomain, setPublicDomain] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      getR2Config()
        .then((cfg) => {
          setConfig(cfg);
          if (cfg.bucketName) setBucketName(cfg.bucketName);
          if (cfg.publicDomain) setPublicDomain(cfg.publicDomain);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      const res = await saveR2Config({
        accountId: accountId.trim(),
        accessKeyId: accessKeyId.trim(),
        secretAccessKey: secretAccessKey.trim(),
        bucketName: bucketName.trim(),
        publicDomain: publicDomain.trim(),
      });

      setFeedback(res);
      if (res.success) {
        if (onUpdated) onUpdated();
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setFeedback({ success: false, message: err.message || "Failed to update R2 settings" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(12px)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 p-6 shadow-2xl flex flex-col gap-5 text-white"
        style={{ background: "rgba(34,34,38,0.98)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/8 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <Cloud size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Cloudflare R2 Storage</h3>
              <p className="text-[10px] text-white/40">S3-Compatible Zero Egress Cloud</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Current Status Badge */}
        <div className="p-3 rounded-xl bg-white/[0.04] border border-white/8 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                config?.isConfigured ? "bg-emerald-400 shadow-sm shadow-emerald-400" : "bg-amber-400"
              }`}
            />
            <span className="font-medium">
              {config?.isConfigured
                ? `Connected to R2 (${config.bucketName})`
                : "Using Local Virtual Cloud (Ready to connect)"}
            </span>
          </div>
          <span className="text-[10px] font-mono text-white/40 uppercase">
            {config?.mode || "local"}
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-[10px] font-semibold tracking-wider uppercase text-white/40 mb-1">
              Cloudflare Account ID
            </label>
            <div className="relative">
              <Key size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                required
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="e.g. 9b752a81234f9812..."
                className="w-full h-8 pl-8 pr-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/25 outline-none focus:border-sky-400 text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold tracking-wider uppercase text-white/40 mb-1">
              R2 Access Key ID
            </label>
            <div className="relative">
              <Key size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                required
                value={accessKeyId}
                onChange={(e) => setAccessKeyId(e.target.value)}
                placeholder="e.g. 78a9c01bf28..."
                className="w-full h-8 pl-8 pr-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/25 outline-none focus:border-sky-400 text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold tracking-wider uppercase text-white/40 mb-1">
              R2 Secret Access Key
            </label>
            <div className="relative">
              <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="password"
                required
                value={secretAccessKey}
                onChange={(e) => setSecretAccessKey(e.target.value)}
                placeholder="Secret Access Key"
                className="w-full h-8 pl-8 pr-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/25 outline-none focus:border-sky-400 text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold tracking-wider uppercase text-white/40 mb-1">
              R2 Bucket Name
            </label>
            <div className="relative">
              <Database size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                required
                value={bucketName}
                onChange={(e) => setBucketName(e.target.value)}
                placeholder="e.g. my-personal-drive"
                className="w-full h-8 pl-8 pr-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/25 outline-none focus:border-sky-400 text-xs"
              />
            </div>
          </div>

          {/* Feedback message */}
          {feedback && (
            <div
              className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                feedback.success
                  ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                  : "bg-red-500/15 border border-red-500/30 text-red-300"
              }`}
            >
              {feedback.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              <span className="leading-tight">{feedback.message}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-white/8">
            <a
              href="https://dash.cloudflare.com/?to=/:account/r2"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-sky-400 hover:underline flex items-center gap-1"
            >
              Cloudflare R2 Dashboard <ExternalLink size={10} />
            </a>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/8 transition-colors text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-white font-medium shadow-lg shadow-orange-500/25 transition-all text-xs disabled:opacity-50"
              >
                {isSaving ? "Connecting…" : "Save & Connect"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
