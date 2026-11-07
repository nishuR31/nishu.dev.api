import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  UploadCloud,
  FileType,
  CheckCircle2,
  Copy,
  Trash2,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";

export default function MediaView() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadedAssetType, setUploadedAssetType] = useState<
    "project" | "certificate" | null
  >(null);
  const [copiedAssetPath, setCopiedAssetPath] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [assetType, setAssetType] = useState<"project" | "certificate">("project");
  const [assets, setAssets] = useState<
    {
      name: string;
      path: string;
      url: string;
      bucket?: string;
      assetType?: "project" | "certificate";
      contentType?: string | null;
      size?: number | null;
    }[]
  >([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAssets = async () => {
    try {
      const response = await axios.get("/api/portfolio/media", {
        withCredentials: true,
      });
      if (response.data.success) setAssets(response.data.data || []);
    } catch (err: any) {
      console.error("[media] failed to load assets", {
        status: err.response?.status,
        data: err.response?.data,
      });
      setError(
        err.response?.status === 401
          ? "Your admin session expired. Log in again to view uploaded assets."
          : err.response?.data?.message || "Unable to load uploaded assets.",
      );
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadedUrl(null);
      setError("");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setUploadedUrl(null);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    const uploadUrl = `/api/portfolio/upload?assetType=${assetType}`;
    console.info("[media] upload started", {
      endpoint: uploadUrl,
      assetType,
      filename: file.name,
      contentType: file.type,
      size: file.size,
    });

    try {
      const response = await axios.post(uploadUrl, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      });
      console.info("[media] upload response", {
        status: response.status,
        success: response.data?.success,
        requestId: response.data?.requestId,
      });

      if (response.data.success) {
        setUploadedUrl(response.data.data.url);
        setUploadedAssetType(assetType);
        setFile(null);
        await fetchAssets();
      }
    } catch (err: any) {
      console.error("[media] upload failed", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        endpoint: uploadUrl,
      });
      const requestId = err.response?.data?.requestId;
      setError(
        `${err.response?.data?.message || "Upload failed before reaching the storage provider."}${
          requestId ? ` Reference: ${requestId}` : ""
        }`,
      );
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = () => {
    if (uploadedUrl) {
      navigator.clipboard.writeText(uploadedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyAssetUrl = async (url: string, path: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedAssetPath(path);
    setTimeout(() => setCopiedAssetPath(null), 2000);
  };

  const deleteAsset = async (asset: (typeof assets)[number]) => {
    if (
      !window.confirm(
        `Delete "${asset.name}" from the ${
          asset.assetType === "certificate" ? "certificates" : "project images"
        } bucket? This cannot be undone.`,
      )
    ) {
      return;
    }

    setError("");
    try {
      await axios.delete("/api/portfolio/media", {
        params: {
          assetType: asset.assetType,
          path: asset.path,
        },
        withCredentials: true,
      });
      setAssets((currentAssets) =>
        currentAssets.filter(
          (currentAsset) =>
            !(
              currentAsset.assetType === asset.assetType &&
              currentAsset.path === asset.path
            ),
        ),
      );
    } catch (err: any) {
      console.error("[media] delete failed", {
        status: err.response?.status,
        data: err.response?.data,
        path: asset.path,
      });
      const requestId = err.response?.data?.requestId;
      setError(
        `${err.response?.data?.message || "Unable to delete asset."}${
          requestId ? ` Reference: ${requestId}` : ""
        }`,
      );
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-24 md:pb-0">
      <div className="flex items-center justify-between glass-panel p-4 sm:p-6 rounded-2xl sm:rounded-3xl  shadow-sm">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gradient-heading gap-2">
          <ImageIcon className="w-6 h-6 sm:w-7 sm:h-7 text-[var(--primary)]" />
          Media & Assets
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
        {/* Upload Zone */}
        <div className="glass-panel p-4 sm:p-8 rounded-2xl sm:rounded-3xl  shadow-sm">
          <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-xl font-bold">Upload to Supabase CDN</h3>
            <label className="text-sm text-[var(--muted-foreground)]">
              Asset bucket
              <select
                value={assetType}
                onChange={(event) =>
                  setAssetType(event.target.value as "project" | "certificate")
                }
                className="ml-2 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-[var(--foreground)]"
                disabled={uploading}
              >
                <option value="project">Project images</option>
                <option value="certificate">Certificates</option>
              </select>
            </label>
          </div>

          <div
            className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center transition-all ${file ? "border-[var(--primary)] bg-[var(--foreground)]/5" : "border-[var(--border)] hover:border-[var(--foreground)]/30 hover:bg-[var(--muted)]"}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,application/pdf"
            />

            {file ? (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-[var(--foreground)]/20 rounded-2xl flex items-center justify-center mx-auto">
                  <FileType className="w-8 h-8 text-[var(--primary)]" />
                </div>
                <div>
                  <p className="font-medium text-[var(--background)] truncate max-w-[200px]">
                    {file.name}
                  </p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 cursor-pointer">
                <div className="w-16 h-16 bg-[var(--card)] rounded-full flex items-center justify-center mx-auto">
                  <UploadCloud className="w-8 h-8 text-[var(--muted-foreground)]" />
                </div>
                <div>
                  <p className="font-medium text-white">
                    Click or drag file to this area
                  </p>
                  <p className="text-sm text-[var(--muted-foreground)] mt-1">
                    Supports JPG, PNG, WEBP, AVIF, PDF
                  </p>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 rounded-xl text-[var(--destructive)] text-sm">
              {error}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="px-6 py-3 rounded-xl bg-[var(--primary)] hover:opacity-90 text-[var(--background)] font-semibold transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-[var(--foreground)]/10"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="w-5 h-5" /> Upload File
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Zone */}
        <div className="glass-panel p-8 rounded-3xl  shadow-sm flex flex-col items-center justify-center text-center">
          {uploadedUrl ? (
            <div className="space-y-6 w-full animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-[var(--success)]/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-[var(--success)]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Upload Successful!</h3>
                <p className="text-[var(--muted-foreground)] text-sm mt-1">
                  Saved to the{" "}
                  <strong className="text-[var(--foreground)]">
                    {uploadedAssetType === "certificate"
                      ? "Certificates"
                      : "Project images"}
                  </strong>{" "}
                  bucket.
                </p>
              </div>

              {uploadedUrl.match(/\.(jpeg|jpg|gif|png|avif|webp)$/i) ? (
                <div className="w-full h-48 rounded-2xl overflow-hidden  bg-[var(--background)] relative group">
                  <img
                    src={uploadedUrl}
                    alt="Uploaded preview"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-full p-6 rounded-2xl  bg-[var(--background)] flex items-center justify-center gap-3">
                  <FileType className="w-8 h-8 text-[var(--primary)]" />
                  <span className="font-medium">Document Uploaded</span>
                </div>
              )}

              <div className="relative group">
                <input
                  type="text"
                  readOnly
                  value={uploadedUrl}
                  className="w-full bg-[var(--background)]  rounded-xl py-3 px-4 pr-12 text-sm text-[var(--foreground)] opacity-80 focus:outline-none"
                />
                <button
                  onClick={copyToClipboard}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[var(--card)] rounded-lg hover:bg-[var(--muted)] text-[var(--background)] transition-colors flex items-center justify-center"
                  title="Copy URL"
                >
                  {copied ? (
                    <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-[var(--muted-foreground)] max-w-sm">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
            </div>
          )}
        </div>
      </div>

      <div className="glass-panel p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-xl font-bold">Uploaded assets</h3>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Files already stored in both configured Supabase buckets.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchAssets}
            className="px-3 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-[var(--muted)]"
          >
            Refresh
          </button>
        </div>
        {assets.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {assets.map((asset) => (
              <div
                key={asset.path || asset.url}
                className="group rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--background)]"
              >
                <a href={asset.url} target="_blank" rel="noopener noreferrer">
                  {asset.contentType?.startsWith("image/") ? (
                    <img
                      src={asset.url}
                      alt={asset.name}
                      className="w-full aspect-square object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full aspect-square flex items-center justify-center">
                      <FileType className="w-8 h-8 opacity-60" />
                    </div>
                  )}
                </a>
                <div className="p-2">
                  <span className="block text-xs truncate">{asset.name}</span>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="inline-block rounded-full bg-[var(--muted)] px-2 py-0.5 text-[10px] uppercase tracking-wide">
                      {asset.assetType === "certificate" ? "Certificate" : "Project"}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyAssetUrl(asset.url, asset.path || asset.url)}
                      className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] px-2 py-1 text-[10px] hover:bg-[var(--muted)]"
                      title="Copy asset URL"
                    >
                      {copiedAssetPath === (asset.path || asset.url) ? (
                        <CheckCircle2 className="h-3 w-3 text-[var(--success)]" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      Copy URL
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteAsset(asset)}
                      className="inline-flex items-center gap-1 rounded-md border border-[var(--destructive)]/40 px-2 py-1 text-[10px] text-[var(--destructive)] hover:bg-[var(--destructive)]/10"
                      title="Delete asset"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--muted-foreground)]">
            No uploaded assets found.
          </p>
        )}
      </div>
    </div>
  );
}
