import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Plus,
  Trash2,
  Edit2,
  Loader2,
  Save,
  X,
  FileText,
  Eye,
  EyeOff,
} from "lucide-react";
import { useForm } from "react-hook-form";
import JsonEditorModal from "../components/JsonEditorModal";
import { FileJson } from "lucide-react";

type CVFormData = {
  title: string;
  url: string;
  description: string;
  cvId: string;
  lastUpdated: string;
};

export default function CVsView() {
  const [cvs, setCvs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isJsonEditorOpen, setIsJsonEditorOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<CVFormData>({
    defaultValues: {
      title: "",
      url: "",
      description: "",
      cvId: "",
      lastUpdated: "",
    },
  });

  useEffect(() => {
    fetchCvs();
  }, []);

  const fetchCvs = async () => {
    try {
      const response = await axios.get("/api/portfolio");
      setCvs(response.data.data.cvs || []);
    } catch (error) {
      console.error("Failed to fetch CVs", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cv: any) => {
    setEditingId(cv.id);
    reset({
      title: cv.title,
      url: cv.url,
      description: cv.description,
      cvId: cv.cvId,
      lastUpdated: cv.lastUpdated,
    });
    setIsFormOpen(true);
  };

  const openNewForm = () => {
    setEditingId(null);
    reset({
      title: "",
      url: "",
      description: "",
      cvId: "",
      lastUpdated: "",
    });
    setIsFormOpen(true);
  };

  const onSubmit = async (data: CVFormData) => {
    try {
      // For a full CRUD, the user would need individual POST/PUT endpoints.
      // But since we only have bulkUpdateCVs, we'll append/update locally and submit in bulk.
      let updatedCvs = [...cvs];
      if (editingId) {
        updatedCvs = updatedCvs.map(cv => cv.id === editingId ? { ...cv, ...data } : cv);
      } else {
        updatedCvs.push({ ...data, id: Math.random().toString(36).substring(7) });
      }

      await axios.post("/api/portfolio/cvs/bulk", updatedCvs, { withCredentials: true });
      await fetchCvs();
      setIsFormOpen(false);
    } catch (err) {
      console.error("Failed to save CV", err);
      alert("Error saving CV. Check console.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this CV?")) return;
    try {
      const updatedCvs = cvs.filter(cv => cv.id !== id);
      await axios.post("/api/portfolio/cvs/bulk", updatedCvs, { withCredentials: true });
      await fetchCvs();
    } catch (err) {
      console.error("Failed to delete CV", err);
      alert("Error deleting CV");
    }
  };

  const handleBulkSave = async (parsedData: any) => {
    try {
      await axios.post("/api/portfolio/cvs/bulk", parsedData, {
        withCredentials: true,
      });
      await fetchCvs();
    } catch (err) {
      console.error("Failed to bulk save", err);
      throw new Error("Failed to save JSON data. Check console for details.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-[var(--foreground)] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[var(--foreground)] text-[var(--muted-foreground)] font-medium tracking-wide">
            Loading CVs...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-700 pb-24 md:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 glass-premium p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gradient-heading gap-2 sm:gap-3">
          <FileText className="floating-gravity w-6 h-6 sm:w-8 sm:h-8 text-[var(--foreground)]" />
          Resumes (CVs)
        </h2>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={openNewForm}
            className="btn-shimmer bg-[var(--foreground)] text-[var(--background)] px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl flex items-center gap-1.5 sm:gap-2 hover:scale-105 transition-transform font-semibold shadow-md text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" /> Add
          </button>
          <button
            onClick={() => setIsJsonEditorOpen(true)}
            className="bg-[var(--foreground)] text-[var(--background)] px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl flex items-center gap-1.5 sm:gap-2 hover:scale-105 transition-transform font-semibold shadow-md text-sm sm:text-base"
          >
            <FileJson className="w-4 h-4 sm:w-5 sm:h-5" /> JSON
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {cvs.map((cv) => (
          <div
            key={cv.id}
            className="glass-panel p-6 rounded-3xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover-lift group relative overflow-hidden flex flex-col duration-300"
          >
            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-emerald-500 to-emerald-300" />
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-lg sm:text-xl text-[var(--foreground)] leading-tight">
                {cv.title}
              </h3>
              <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-[var(--background)] p-1 rounded-xl shadow-sm border border-black/5 dark:border-white/5">
                <button
                  onClick={() => handleEdit(cv)}
                  className="p-2 text-[var(--foreground)] hover:bg-[var(--foreground)]/5 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(cv.id)}
                  className="p-2 text-[var(--destructive)] hover:bg-[var(--destructive)]/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <p className="text-sm font-medium text-[var(--foreground)] mb-3">{cv.cvId}</p>
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 mb-4">
              {cv.description}
            </p>
            
            <div className="mt-auto pt-4 border-t border-black/5 dark:border-white/5 flex justify-between items-center text-xs sm:text-sm text-muted-foreground/70">
               <span>Last updated: {cv.lastUpdated}</span>
               <a href={cv.url} target="_blank" rel="noopener noreferrer" className="text-[var(--foreground)] hover:underline">Link</a>
            </div>
          </div>
        ))}
        {cvs.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-[var(--foreground)]/5 rounded-3xl border border-dashed border-black/10 dark:border-white/10">
            No CVs added yet.
          </div>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[var(--background)] w-full max-w-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 sm:p-6 border-b border-white/5">
              <h3 className="text-xl font-bold">
                {editingId ? "Edit CV" : "Add CV"}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-2 hover:bg-[var(--foreground)]/5 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar">
              <form id="cv-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold ml-1">Title</label>
                  <input
                    {...register("title", { required: true })}
                    className="w-full bg-[var(--foreground)]/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                    placeholder="e.g. Backend Engineer Resume"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold ml-1">URL (File Link)</label>
                  <input
                    {...register("url", { required: true })}
                    className="w-full bg-[var(--foreground)]/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                    placeholder="e.g. /resume.pdf or https://..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold ml-1">CV ID (Slug)</label>
                  <input
                    {...register("cvId", { required: true })}
                    className="w-full bg-[var(--foreground)]/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                    placeholder="e.g. cv-1"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold ml-1">Description</label>
                  <textarea
                    {...register("description")}
                    className="w-full bg-[var(--foreground)]/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all min-h-[100px]"
                    placeholder="Short summary of this resume"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold ml-1">Last Updated</label>
                  <input
                    {...register("lastUpdated", { required: true })}
                    className="w-full bg-[var(--foreground)]/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                    placeholder="e.g. 2024 or Oct 2024"
                  />
                </div>
              </form>
            </div>
            <div className="p-5 sm:p-6 border-t border-white/5 bg-[var(--foreground)]/[0.02] flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-5 py-2.5 rounded-xl font-semibold hover:bg-[var(--foreground)]/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="cv-form"
                disabled={isSubmitting}
                className="btn-shimmer bg-[var(--foreground)] text-[var(--background)] px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:opacity-90 transition-colors shadow-md disabled:opacity-70"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JSON Editor Modal */}
      <JsonEditorModal
        isOpen={isJsonEditorOpen}
        onClose={() => setIsJsonEditorOpen(false)}
        title="Edit CVs JSON"
        data={cvs}
        onSave={handleBulkSave}
      />
    </div>
  );
}
