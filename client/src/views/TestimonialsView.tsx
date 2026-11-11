import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Plus,
  Trash2,
  Edit2,
  Loader2,
  Save,
  X,
  MessageSquareQuote,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  ExternalLink,
  Link2,
  ShieldCheck,
  Mail,
  Star,
  Sparkles,
  Send,
  Search,
  RefreshCw,
  FileJson,
  Flag,
} from "lucide-react";
import { useForm } from "react-hook-form";
import JsonEditorModal from "../components/JsonEditorModal";

type TestimonialFormData = {
  authorName: string;
  authorRole: string;
  authorCompany: string;
  content: string;
  avatarUrl: string;
  visible: boolean;
  rating?: number;
  relationship?: string;
  status?: string;
  email?: string;
  moderationNote?: string;
};

export default function TestimonialsView() {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [counts, setCounts] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, flagged: 0 });
  const [settings, setSettings] = useState<any>({ collectionEnabled: true, emailVerificationReq: true });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modals & Drawers
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isJsonEditorOpen, setIsJsonEditorOpen] = useState(false);
  const [reviewItem, setReviewItem] = useState<any | null>(null);
  const [moderationNoteInput, setModerationNoteInput] = useState("");
  const [isInvitationModalOpen, setIsInvitationModalOpen] = useState(false);
  const [invitationEmail, setInvitationEmail] = useState("");
  const [generatedInvitationUrl, setGeneratedInvitationUrl] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  
  // Preview Form State
  const [previewName, setPreviewName] = useState("Alex Vance");
  const [previewEmail, setPreviewEmail] = useState("alex.vance@example.com");
  const [previewRole, setPreviewRole] = useState("Senior Staff Engineer");
  const [previewCompany, setPreviewCompany] = useState("TechCorp Labs");
  const [previewRelationship, setPreviewRelationship] = useState("Collaborator");
  const [previewRating, setPreviewRating] = useState(5);
  const [previewTestimonial, setPreviewTestimonial] = useState(
    "Nishu is an exceptionally talented engineer who delivered our microservices architecture ahead of schedule. Highly recommended!"
  );
  const [previewVerified, setPreviewVerified] = useState(false);
  const [previewSubmitting, setPreviewSubmitting] = useState(false);
  const [previewSuccess, setPreviewSuccess] = useState(false);

  const [copiedLink, setCopiedLink] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<TestimonialFormData>({
    defaultValues: {
      authorName: "",
      authorRole: "",
      authorCompany: "",
      content: "",
      avatarUrl: "",
      visible: true,
      rating: 5,
      relationship: "Collaborator",
      status: "APPROVED",
    },
  });

  const publicUrl = typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3000/testimonials/submit`
    : "http://localhost:3000/testimonials/submit";

  useEffect(() => {
    fetchTestimonials();
    const handleRefresh = () => fetchTestimonials();
    window.addEventListener("portfolio-data-refresh", handleRefresh);
    return () => window.removeEventListener("portfolio-data-refresh", handleRefresh);
  }, [activeTab]);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (activeTab !== "ALL") params.status = activeTab;
      if (searchQuery) params.search = searchQuery;

      const response = await axios.get("/api/portfolio/testimonials/admin", {
        params,
        withCredentials: true,
      });

      if (response.data.success) {
        setTestimonials(response.data.data.items || []);
        if (response.data.data.counts) {
          setCounts(response.data.data.counts);
        }
        if (response.data.data.settings) {
          setSettings(response.data.data.settings);
        }
      }
    } catch (error) {
      console.error("Failed to fetch testimonials", error);
      // Fallback to legacy endpoint if moderation route fails
      try {
        const fallback = await axios.get("/api/portfolio/admin", { withCredentials: true });
        const list = fallback.data.data.testimonials || [];
        setTestimonials(list);
        setCounts({
          total: list.length,
          pending: list.filter((t: any) => t.status === "PENDING").length,
          approved: list.filter((t: any) => t.status === "APPROVED" || t.visible).length,
          rejected: list.filter((t: any) => t.status === "REJECTED").length,
          flagged: list.filter((t: any) => t.status === "FLAGGED").length,
        });
      } catch (err) {
        console.error("Fallback error", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (id: string, action: "APPROVE" | "REJECT" | "FLAG", note?: string) => {
    try {
      await axios.patch(
        `/api/portfolio/testimonials/${id}/moderation`,
        { action, moderationNote: note ?? moderationNoteInput },
        { withCredentials: true }
      );
      if (reviewItem && reviewItem.id === id) {
        setReviewItem(null);
      }
      fetchTestimonials();
    } catch (e) {
      console.error("Moderation error", e);
      alert("Failed to moderate testimonial.");
    }
  };

  const handleToggleCollection = async () => {
    try {
      const nextState = !settings.collectionEnabled;
      const res = await axios.patch(
        "/api/portfolio/testimonials/settings",
        { collectionEnabled: nextState },
        { withCredentials: true }
      );
      if (res.data.success) {
        setSettings(res.data.data);
      }
    } catch (e) {
      console.error("Failed to toggle settings", e);
    }
  };

  const handleCreateInvitation = async () => {
    try {
      const res = await axios.post(
        "/api/portfolio/testimonials/invitations",
        { email: invitationEmail || undefined, expiresInDays: 7 },
        { withCredentials: true }
      );
      if (res.data.success) {
        const token = res.data.data.token;
        const link = `${publicUrl}?invite=${token}`;
        setGeneratedInvitationUrl(link);
      }
    } catch (e) {
      console.error("Invitation creation failed", e);
      alert("Failed to generate invitation.");
    }
  };

  const handleCopyLink = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleTestPreviewSubmit = async () => {
    try {
      setPreviewSubmitting(true);
      const payload = {
        fullName: previewName,
        email: previewEmail,
        role: previewRole,
        organization: previewCompany,
        relationship: previewRelationship,
        rating: previewRating,
        testimonial: previewTestimonial,
        profileUrl: "",
        genuineExperienceConfirmed: true,
        publicDisplayConsent: true,
      };

      const res = await axios.post("/api/portfolio/testimonials/submit", payload);
      if (res.data.success) {
        setPreviewSuccess(true);
        setTimeout(() => {
          setPreviewSuccess(false);
          setIsPreviewModalOpen(false);
          fetchTestimonials();
        }, 1500);
      }
    } catch (e: any) {
      alert("Preview submission error: " + (e.response?.data?.message || e.message));
    } finally {
      setPreviewSubmitting(false);
    }
  };

  const handleEdit = (testimonial: any) => {
    setEditingId(testimonial.id);
    reset({
      authorName: testimonial.authorName,
      authorRole: testimonial.authorRole,
      authorCompany: testimonial.authorCompany || "",
      content: testimonial.content,
      avatarUrl: testimonial.avatarUrl || "",
      visible: testimonial.visible ?? true,
      rating: testimonial.rating ?? 5,
      relationship: testimonial.relationship || "Collaborator",
      status: testimonial.status || "APPROVED",
      email: testimonial.email || "",
      moderationNote: testimonial.moderationNote || "",
    });
    setIsFormOpen(true);
  };

  const openNewForm = () => {
    setEditingId(null);
    reset({
      authorName: "",
      authorRole: "",
      authorCompany: "",
      content: "",
      avatarUrl: "",
      visible: true,
      rating: 5,
      relationship: "Collaborator",
      status: "APPROVED",
      email: "",
      moderationNote: "",
    });
    setIsFormOpen(true);
  };

  const onSubmit = async (data: TestimonialFormData) => {
    try {
      if (editingId) {
        await axios.put(`/api/portfolio/testimonials/${editingId}`, data, {
          withCredentials: true,
        });
      } else {
        await axios.post("/api/portfolio/testimonials", data, {
          withCredentials: true,
        });
      }
      setIsFormOpen(false);
      fetchTestimonials();
    } catch (error) {
      console.error("Failed to save testimonial", error);
      alert("Failed to save testimonial");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this testimonial?")) return;
    try {
      await axios.delete(`/api/portfolio/testimonials/${id}`, {
        withCredentials: true,
      });
      fetchTestimonials();
    } catch (error) {
      console.error("Failed to delete testimonial", error);
    }
  };

  const handleBulkSave = async (data: any[]) => {
    try {
      await axios.post("/api/portfolio/testimonials/bulk", data, {
        withCredentials: true,
      });
      fetchTestimonials();
    } catch (error) {
      console.error("Failed to bulk save testimonials", error);
      throw error;
    }
  };

  const openReviewDrawer = (item: any) => {
    setReviewItem(item);
    setModerationNoteInput(item.moderationNote || "");
  };

  const filteredTestimonials = testimonials.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.authorName?.toLowerCase().includes(q) ||
      t.authorCompany?.toLowerCase().includes(q) ||
      t.content?.toLowerCase().includes(q) ||
      t.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight flex items-center gap-3">
            <MessageSquareQuote className="w-8 h-8 text-amber-500" />
            Testimonials & Moderation
          </h1>
          <p className="text-sm sm:text-base text-[var(--muted-foreground)] mt-1">
            Review public submissions, moderate recommendations, or generate private client invitations.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsJsonEditorOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--foreground)]/5 transition font-semibold text-xs sm:text-sm"
          >
            <FileJson className="w-4 h-4 text-emerald-500" /> JSON Editor
          </button>
          <button
            onClick={openNewForm}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--foreground)] text-[var(--background)] font-bold text-xs sm:text-sm shadow-md hover:scale-105 transition"
          >
            <Plus className="w-4 h-4" /> Add Testimonial
          </button>
          <button
            onClick={fetchTestimonials}
            title="Refresh list"
            className="p-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--foreground)]/5 transition"
          >
            <RefreshCw className="w-4 h-4 text-[var(--muted-foreground)]" />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 sm:gap-4">
        <div
          onClick={() => setActiveTab("ALL")}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            activeTab === "ALL"
              ? "border-[var(--foreground)] bg-[var(--foreground)]/5 shadow-sm"
              : "border-[var(--border)] bg-[var(--background)] hover:border-[var(--foreground)]/40"
          }`}
        >
          <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider block">
            Total Submissions
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold mt-1 block">{counts.total}</span>
        </div>

        <div
          onClick={() => setActiveTab("PENDING")}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            activeTab === "PENDING"
              ? "border-amber-500 bg-amber-500/10 shadow-sm"
              : "border-[var(--border)] bg-[var(--background)] hover:border-amber-500/50"
          }`}
        >
          <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> Pending
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-amber-500 mt-1 block">
            {counts.pending}
          </span>
        </div>

        <div
          onClick={() => setActiveTab("APPROVED")}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            activeTab === "APPROVED"
              ? "border-emerald-500 bg-emerald-500/10 shadow-sm"
              : "border-[var(--border)] bg-[var(--background)] hover:border-emerald-500/50"
          }`}
        >
          <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Published
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-500 mt-1 block">
            {counts.approved}
          </span>
        </div>

        <div
          onClick={() => setActiveTab("FLAGGED")}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            activeTab === "FLAGGED"
              ? "border-yellow-500 bg-yellow-500/10 shadow-sm"
              : "border-[var(--border)] bg-[var(--background)] hover:border-yellow-500/50"
          }`}
        >
          <span className="text-xs font-semibold text-yellow-500 uppercase tracking-wider flex items-center gap-1.5">
            <Flag className="w-3 h-3" /> Flagged
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-yellow-500 mt-1 block">
            {counts.flagged}
          </span>
        </div>

        <div
          onClick={() => setActiveTab("REJECTED")}
          className={`p-4 rounded-2xl border cursor-pointer transition col-span-2 sm:col-span-1 ${
            activeTab === "REJECTED"
              ? "border-rose-500 bg-rose-500/10 shadow-sm"
              : "border-[var(--border)] bg-[var(--background)] hover:border-rose-500/50"
          }`}
        >
          <span className="text-xs font-semibold text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-rose-500 mt-1 block">
            {counts.rejected}
          </span>
        </div>
      </div>

      {/* Public Collection System Card (Wireframe Section 6) */}
      <div className="p-6 rounded-3xl border border-[var(--border)] bg-[var(--foreground)]/[0.02] shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                Public Testimonials Workflow
              </span>
              <button
                onClick={handleToggleCollection}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition ${
                  settings.collectionEnabled
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                }`}
              >
                Status: {settings.collectionEnabled ? "Collection Enabled" : "Collection Paused"}
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm font-mono text-[var(--foreground)] bg-[var(--background)] px-3 py-2 rounded-xl border border-[var(--border)] max-w-xl overflow-hidden">
              <Link2 className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="truncate">{publicUrl}</span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted-foreground)] pt-1">
              <span>Email verification: <strong>Required</strong></span>
              <span>Auto-publish: <strong>Disabled (Safe Moderation)</strong></span>
              <span>Duplicate detection: <strong>Active</strong></span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => handleCopyLink(publicUrl)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--foreground)]/5 font-semibold text-xs sm:text-sm transition"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              {copiedLink ? "Link Copied!" : "Copy Link"}
            </button>
            <button
              onClick={() => setIsPreviewModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 font-semibold text-xs sm:text-sm transition"
            >
              <Sparkles className="w-4 h-4" /> Preview & Test Fill
            </button>
            <button
              onClick={() => {
                setGeneratedInvitationUrl(null);
                setInvitationEmail("");
                setIsInvitationModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-black font-bold text-xs sm:text-sm hover:scale-105 transition shadow-md"
            >
              <ShieldCheck className="w-4 h-4" /> Create Invitation
            </button>
          </div>
        </div>
      </div>

      {/* Submissions List Header & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto">
          {["ALL", "PENDING", "APPROVED", "FLAGGED", "REJECTED"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === tab
                  ? "bg-[var(--foreground)] text-[var(--background)] shadow-sm"
                  : "bg-[var(--foreground)]/5 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[var(--muted-foreground)]" />
          <input
            type="text"
            placeholder="Search submissions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--background)] border border-[var(--border)] pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Submissions Grid / List */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-[var(--muted-foreground)]">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading testimonials...
        </div>
      ) : filteredTestimonials.length === 0 ? (
        <div className="text-center p-12 rounded-3xl border border-dashed border-[var(--border)] text-[var(--muted-foreground)]">
          <MessageSquareQuote className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-semibold text-base">No testimonials found for this view</p>
          <p className="text-xs mt-1">Share the public submission link or click "Preview & Test Fill" to submit test data.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTestimonials.map((item) => {
            const isPending = item.status === "PENDING";
            const isApproved = item.status === "APPROVED";
            const isFlagged = item.status === "FLAGGED";
            const isRejected = item.status === "REJECTED";

            return (
              <div
                key={item.id}
                className={`p-6 rounded-3xl border transition flex flex-col justify-between ${
                  isPending
                    ? "border-amber-500/50 bg-amber-500/[0.03] shadow-sm"
                    : isApproved
                    ? "border-emerald-500/30 bg-[var(--background)]"
                    : isFlagged
                    ? "border-yellow-500/40 bg-yellow-500/[0.02]"
                    : "border-[var(--border)] bg-[var(--background)] opacity-70"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-bold text-base flex items-center gap-1.5">
                        {item.authorName}
                        {item.email && (
                          <span title="Verified Email" className="inline-flex text-emerald-500">
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {[item.authorRole, item.authorCompany].filter(Boolean).join(" · ")}
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isPending
                          ? "bg-amber-500 text-black animate-pulse"
                          : isApproved
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          : isFlagged
                          ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                          : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                      }`}
                    >
                      {item.status || "APPROVED"}
                    </span>
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-1 text-amber-400 mb-3">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        className={`w-3.5 h-3.5 ${
                          idx < (item.rating ?? 5) ? "fill-amber-400" : "text-gray-300 dark:text-gray-700"
                        }`}
                      />
                    ))}
                    <span className="text-[10px] text-[var(--muted-foreground)] ml-1 font-mono font-semibold">
                      {item.relationship || "Collaborator"}
                    </span>
                  </div>

                  <blockquote className="text-xs sm:text-sm text-[var(--foreground)] italic line-clamp-4 leading-relaxed mb-4">
                    "{item.content}"
                  </blockquote>
                </div>

                <div className="pt-4 border-t border-[var(--border)] space-y-3">
                  {item.moderationNote && (
                    <div className="text-[11px] bg-[var(--foreground)]/5 p-2 rounded-xl text-[var(--muted-foreground)]">
                      <strong className="text-[var(--foreground)]">Note:</strong> {item.moderationNote}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => openReviewDrawer(item)}
                      className="text-xs font-bold text-amber-500 hover:underline flex items-center gap-1"
                    >
                      Review Detail ↘
                    </button>

                    <div className="flex items-center gap-1.5">
                      {isPending && (
                        <button
                          onClick={() => handleModerate(item.id, "APPROVE")}
                          title="Approve & Publish"
                          className="px-2.5 py-1 rounded-lg bg-emerald-500 text-black text-xs font-bold hover:scale-105 transition"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--foreground)]/5 text-[var(--muted-foreground)]"
                        title="Edit Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-rose-500/10 text-rose-500"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submission Review Drawer (Wireframe Section 6) */}
      {reviewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-6">
            <button
              onClick={() => setReviewItem(null)}
              className="absolute top-5 right-5 p-2 rounded-xl hover:bg-[var(--foreground)]/5 text-[var(--muted-foreground)]"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Submission Review
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                    reviewItem.status === "PENDING"
                      ? "bg-amber-500 text-black"
                      : reviewItem.status === "APPROVED"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-rose-500/10 text-rose-500"
                  }`}
                >
                  {reviewItem.status || "APPROVED"}
                </span>
              </div>
              <h2 className="text-2xl font-black">{reviewItem.authorName}</h2>
              <p className="text-sm text-[var(--muted-foreground)]">
                {[reviewItem.authorRole, reviewItem.authorCompany].filter(Boolean).join(" at ")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-[var(--foreground)]/5 text-xs">
              <div>
                <span className="text-[var(--muted-foreground)] block">Email</span>
                <span className="font-semibold">{reviewItem.email || "Private"}</span>
              </div>
              <div>
                <span className="text-[var(--muted-foreground)] block">Relationship</span>
                <span className="font-semibold">{reviewItem.relationship || "Collaborator"}</span>
              </div>
              <div>
                <span className="text-[var(--muted-foreground)] block">Rating</span>
                <span className="font-semibold text-amber-500">{reviewItem.rating ?? 5} / 5 Stars</span>
              </div>
              <div>
                <span className="text-[var(--muted-foreground)] block">Source</span>
                <span className="font-semibold">{reviewItem.source || "PUBLIC_LINK"}</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] block mb-2">
                Testimonial Content
              </span>
              <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] text-sm leading-relaxed italic">
                "{reviewItem.content}"
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] block">
                Internal Moderation Note
              </label>
              <textarea
                value={moderationNoteInput}
                onChange={(e) => setModerationNoteInput(e.target.value)}
                rows={2}
                placeholder="Add private audit notes regarding this submitter or verification..."
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl p-3 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => handleModerate(reviewItem.id, "REJECT")}
                className="px-4 py-2.5 rounded-xl border border-rose-500/30 text-rose-500 font-bold text-xs sm:text-sm hover:bg-rose-500/10 transition"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => handleModerate(reviewItem.id, "FLAG")}
                className="px-4 py-2.5 rounded-xl border border-yellow-500/30 text-yellow-500 font-bold text-xs sm:text-sm hover:bg-yellow-500/10 transition"
              >
                Flag for Review
              </button>
              <button
                type="button"
                onClick={() => handleModerate(reviewItem.id, "APPROVE")}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 text-black font-extrabold text-xs sm:text-sm hover:scale-105 transition shadow-lg"
              >
                Approve & Publish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Invitation Modal */}
      {isInvitationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-6">
            <button
              onClick={() => setIsInvitationModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl hover:bg-[var(--foreground)]/5 text-[var(--muted-foreground)]"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-2xl font-black flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-amber-500" /> Create Invitation
              </h2>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Generates a cryptographically random, single-use submission link that expires in 7 days.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] block mb-1.5">
                  Recipient Email (Optional restriction)
                </label>
                <input
                  type="email"
                  value={invitationEmail}
                  onChange={(e) => setInvitationEmail(e.target.value)}
                  placeholder="client@company.com"
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              {!generatedInvitationUrl ? (
                <button
                  type="button"
                  onClick={handleCreateInvitation}
                  className="w-full py-3 rounded-xl bg-amber-500 text-black font-extrabold text-sm hover:scale-[1.02] transition shadow-md"
                >
                  Generate Invitation Token
                </button>
              ) : (
                <div className="space-y-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                  <span className="text-xs font-bold text-emerald-500 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Single-Use Link Ready
                  </span>
                  <div className="p-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs font-mono break-all">
                    {generatedInvitationUrl}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(generatedInvitationUrl)}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 text-black font-bold text-xs flex items-center justify-center gap-2"
                  >
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedLink ? "Link Copied to Clipboard!" : "Copy Invitation Link"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Preview & Test Fill Modal (User prompt: preview fill etc in nishudevapi) */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-6">
            <button
              onClick={() => setIsPreviewModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl hover:bg-[var(--foreground)]/5 text-[var(--muted-foreground)]"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
                  Interactive Simulator
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500">
                  Live Test
                </span>
              </div>
              <h2 className="text-2xl font-black">Public Form Preview & Test Fill</h2>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Test the submission workflow exactly as experienced by visitors. Submitting creates a PENDING review record.
              </p>
            </div>

            {previewSuccess ? (
              <div className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h3 className="text-lg font-bold text-emerald-500">Test Submission Created!</h3>
                <p className="text-xs text-[var(--muted-foreground)]">
                  The testimonial was safely stored in the database with status <strong>PENDING</strong> for admin moderation.
                </p>
              </div>
            ) : (
              <div className="space-y-4 text-xs sm:text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold opacity-80 block mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={previewName}
                      onChange={(e) => setPreviewName(e.target.value)}
                      className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 font-medium"
                    />
                  </div>
                  <div>
                    <label className="font-bold opacity-80 block mb-1">Email Address *</label>
                    <input
                      type="email"
                      value={previewEmail}
                      onChange={(e) => setPreviewEmail(e.target.value)}
                      className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold opacity-80 block mb-1">Role / Position</label>
                    <input
                      type="text"
                      value={previewRole}
                      onChange={(e) => setPreviewRole(e.target.value)}
                      className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 font-medium"
                    />
                  </div>
                  <div>
                    <label className="font-bold opacity-80 block mb-1">Organization</label>
                    <input
                      type="text"
                      value={previewCompany}
                      onChange={(e) => setPreviewCompany(e.target.value)}
                      className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold opacity-80 block mb-1">Relationship</label>
                    <select
                      value={previewRelationship}
                      onChange={(e) => setPreviewRelationship(e.target.value)}
                      className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 font-medium"
                    >
                      <option value="Client">Client</option>
                      <option value="Collaborator">Collaborator</option>
                      <option value="Colleague">Colleague</option>
                      <option value="Mentor">Mentor</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold opacity-80 block mb-1">Rating</label>
                    <div className="flex items-center gap-1 pt-1.5 text-amber-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          onClick={() => setPreviewRating(star)}
                          className={`w-5 h-5 cursor-pointer ${
                            star <= previewRating ? "fill-amber-400" : "text-gray-400"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="font-bold opacity-80 block mb-1">Testimonial Content *</label>
                  <textarea
                    rows={3}
                    value={previewTestimonial}
                    onChange={(e) => setPreviewTestimonial(e.target.value)}
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl p-3 font-medium"
                  />
                </div>

                <div className="space-y-1.5 text-xs text-[var(--muted-foreground)] pt-2 border-t border-[var(--border)]">
                  <label className="flex items-center gap-2 cursor-pointer text-[var(--foreground)]">
                    <input type="checkbox" checked={true} readOnly className="rounded" />
                    <span>This reflects my genuine experience.</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-[var(--foreground)]">
                    <input type="checkbox" checked={true} readOnly className="rounded" />
                    <span>I consent to public display if approved.</span>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewName("Sarah Lin");
                      setPreviewEmail("sarah.lin@example.com");
                      setPreviewRole("VP of Product");
                      setPreviewCompany("Fintech Scaleup");
                      setPreviewRelationship("Client");
                      setPreviewRating(5);
                      setPreviewTestimonial(
                        "Working with Nishu transformed our product roadmap. Highly resilient architecture and fast turnaround."
                      );
                    }}
                    className="px-4 py-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--foreground)]/5 font-semibold text-xs"
                  >
                    Quick Sample Fill
                  </button>
                  <button
                    type="button"
                    disabled={previewSubmitting}
                    onClick={handleTestPreviewSubmit}
                    className="px-6 py-2.5 rounded-xl bg-amber-500 text-black font-extrabold text-xs sm:text-sm hover:scale-105 transition shadow-lg flex items-center gap-2"
                  >
                    {previewSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Submit Test Testimonial
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Add / Edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-6">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl hover:bg-[var(--foreground)]/5 text-[var(--muted-foreground)]"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-2xl font-black">
                {editingId ? "Edit Testimonial" : "Create Manual Testimonial"}
              </h2>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Admin manual entry with instant approval capabilities.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold opacity-80">Author Name *</label>
                  <input
                    required
                    {...register("authorName")}
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="e.g. Jane Doe"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold opacity-80">Role / Position *</label>
                  <input
                    required
                    {...register("authorRole")}
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="e.g. Lead Architect"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold opacity-80">Company (Optional)</label>
                  <input
                    {...register("authorCompany")}
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="e.g. Acme Corp"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold opacity-80">Relationship</label>
                  <select
                    {...register("relationship")}
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="Client">Client</option>
                    <option value="Collaborator">Collaborator</option>
                    <option value="Colleague">Colleague</option>
                    <option value="Mentor">Mentor</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold opacity-80">Testimonial Content *</label>
                <textarea
                  required
                  {...register("content")}
                  rows={4}
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="What did they say?"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold opacity-80">Avatar or Profile URL (Optional)</label>
                <input
                  type="url"
                  {...register("avatarUrl")}
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="https://..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-6 py-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--foreground)]/5 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-2.5 rounded-xl bg-amber-500 text-black font-extrabold text-xs sm:text-sm hover:scale-105 transition shadow-lg flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editingId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* JSON Bulk Editor */}
      <JsonEditorModal
        isOpen={isJsonEditorOpen}
        onClose={() => setIsJsonEditorOpen(false)}
        onSave={handleBulkSave}
        initialData={testimonials}
        title="Testimonials"
      />
    </div>
  );
}
