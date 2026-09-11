import React, { useState, useEffect } from "react";
import axios from "axios";
import { Target, FileJson } from "lucide-react";
import JsonEditorModal from "../components/JsonEditorModal";

export default function SkillsView() {
  const [skillsCategories, setSkillsCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isJsonEditorOpen, setIsJsonEditorOpen] = useState(false);

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      const response = await axios.get("/api/portfolio");
      setSkillsCategories(response.data.data.skills || []);
    } catch (error) {
      console.error("Failed to fetch skills", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSave = async (parsedData: any) => {
    try {
      await axios.post("/api/portfolio/skills/bulk", parsedData, {
        withCredentials: true,
      });
      await fetchSkills();
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
            Loading Skills...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-700 pb-24 md:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 glass-premium p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gradient-heading gap-2 sm:gap-3">
          <Target className="floating-gravity w-6 h-6 sm:w-8 sm:h-8 text-[var(--foreground)]" />
          Skills & Categories
        </h2>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsJsonEditorOpen(true)}
            className="bg-[var(--foreground)] text-[var(--background)] px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl flex items-center gap-1.5 sm:gap-2 hover:scale-105 transition-transform font-semibold shadow-md text-sm sm:text-base"
          >
            <FileJson className="w-4 h-4 sm:w-5 sm:h-5" /> Edit JSON
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {skillsCategories.map((cat, idx) => (
          <div
            key={idx}
            className={`glass-panel p-6 rounded-3xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all flex flex-col duration-300`}
          >
            <div className="flex items-center gap-4 mb-4 border-b border-[var(--border)] pb-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${cat.bgClass} ${cat.iconClass}`}
              >
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[var(--foreground)]">
                  {cat.title}
                </h3>
                <p className="text-sm text-[var(--muted-foreground)]">{cat.description}</p>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap gap-2">
                {cat.skills?.map((s: any, sIdx: number) => (
                  <span
                    key={sIdx}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--background)] border border-[var(--border)] flex items-center gap-2 shadow-sm"
                  >
                    {s.name}
                    <span className="text-xs opacity-50">{s.level}</span>
                    {s.hot && (
                      <span
                        className="w-2 h-2 rounded-full bg-[var(--destructive)]"
                        title="Hot Skill"
                      ></span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
        {skillsCategories.length === 0 && (
          <div className="col-span-full py-20 text-center opacity-50 border-2 border-dashed border-[var(--border)] rounded-3xl">
            <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
            No skills found. Add your skills!
          </div>
        )}
      </div>

      <JsonEditorModal
        isOpen={isJsonEditorOpen}
        onClose={() => setIsJsonEditorOpen(false)}
        onSave={handleBulkSave}
        initialData={skillsCategories}
        title="Skills"
      />
    </div>
  );
}
