import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit2, Loader2, Briefcase, Save, MapPin, Calendar, Building, X, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import JsonEditorModal from '../components/JsonEditorModal';
import { FileJson } from 'lucide-react';

type ExperienceFormData = {
  position: string;
  company: string;
  period: string;
  location: string;
  description: string;
  responsibilities: string;
  technologies: string;
  companyUrl: string;
  companyLogo: string;
  isCurrent: boolean;
  visible: boolean;
};

export default function ExperiencesView() {
  const [experiences, setExperiences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isJsonEditorOpen, setIsJsonEditorOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<ExperienceFormData>({
    defaultValues: {
      position: "", company: "", period: "", location: "", description: "", responsibilities: "", technologies: "",
      companyUrl: "", companyLogo: "", isCurrent: false, visible: true
    }
  });

  useEffect(() => {
    fetchExperiences();
  }, []);

  const fetchExperiences = async () => {
    try {
      const response = await axios.get('/api/portfolio');
      setExperiences(response.data.data.experiences || []);
    } catch (error) {
      console.error('Failed to fetch experiences', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (exp: any) => {
    setEditingId(exp.id);
    reset({
      position: exp.position,
      company: exp.company,
      period: exp.period,
      location: exp.location,
      description: exp.description,
      responsibilities: exp.responsibilities ? exp.responsibilities.join(", ") : "",
      technologies: exp.technologies ? exp.technologies.join(", ") : "",
      companyUrl: exp.companyUrl || "",
      companyLogo: exp.companyLogo || "",
      isCurrent: exp.isCurrent || false,
      visible: exp.visible ?? true
    });
    setIsFormOpen(true);
  };

  const openNewForm = () => {
    setEditingId(null);
    reset({ position: "", company: "", period: "", location: "", description: "", responsibilities: "", technologies: "", companyUrl: "", companyLogo: "", isCurrent: false, visible: true });
    setIsFormOpen(true);
  };

  const onSubmit = async (data: ExperienceFormData) => {
    try {
      const payload = {
        ...data,
        responsibilities: data.responsibilities ? data.responsibilities.split(',').map(s => s.trim()).filter(Boolean) : [],
        technologies: data.technologies ? data.technologies.split(',').map(s => s.trim()).filter(Boolean) : [],
        companyUrl: data.companyUrl || null,
        companyLogo: data.companyLogo || null,
        visible: data.visible
      };

      if (editingId) {
        await axios.put(`/api/portfolio/experiences/${editingId}`, payload, { withCredentials: true });
      } else {
        await axios.post('/api/portfolio/experiences', payload, { withCredentials: true });
      }
      
      await fetchExperiences();
      setIsFormOpen(false);
    } catch (err) {
      console.error('Failed to save experience', err);
      alert('Error saving experience');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this experience?')) return;
    try {
      await axios.delete(`/api/portfolio/experiences/${id}`, { withCredentials: true });
      await fetchExperiences();
    } catch (err) {
      console.error('Failed to delete experience', err);
      alert('Error deleting experience');
    }
  };

  const toggleVisibility = async (exp: any) => {
    try {
      const payload = {
        ...exp,
        visible: !exp.visible
      };
      await axios.put(`/api/portfolio/experiences/${exp.id}`, payload, { withCredentials: true });
      await fetchExperiences();
    } catch (error) {
      console.error('Failed to toggle visibility', error);
      alert('Failed to toggle visibility.');
    }
  };

  
  const handleBulkSave = async (parsedData: any) => {
    try {
      await axios.post('/api/portfolio/experiences/bulk', parsedData, { withCredentials: true });
      await fetchExperiences();
    } catch (err) {
      console.error('Failed to bulk save', err);
      throw new Error('Failed to save JSON data. Check console for details.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[var(--foreground)] opacity-60 font-medium tracking-wide">Loading Experiences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-24 md:pb-0">
      <div className="flex items-center justify-between bg-[var(--card)] p-6 rounded-3xl border border-[var(--border)] shadow-sm">
        <h2 className="text-3xl font-bold flex items-center gap-3">
          <Briefcase className="w-8 h-8 text-purple-500" />
          Experiences
        </h2>
        <div className="flex items-center"><button 
          onClick={openNewForm}
          className="bg-purple-500 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 hover:scale-105 transition-transform font-semibold shadow-md"
        >
          <Plus className="w-5 h-5" /> Add Experience
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {experiences.map((exp) => (
          <div key={exp.id} className={`bg-[var(--card)] p-8 rounded-3xl border border-[var(--border)] shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group ${exp.visible === false ? 'opacity-50 grayscale-[0.5]' : ''}`}>
            <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-purple-500 to-pink-500 opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="flex justify-between items-start mb-6">
              <div className="flex gap-4 items-center">
                {exp.companyLogo ? (
                  <img src={exp.companyLogo} alt={exp.company} className="w-12 h-12 rounded-xl object-contain bg-white/5 p-1 border border-[var(--border)]" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                    <Building className="w-6 h-6 text-purple-500" />
                  </div>
                )}
                <div>
                  <h3 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-2">
                    {exp.position}
                    {exp.isCurrent && <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-purple-500/10 text-purple-500 border border-purple-500/20 whitespace-nowrap uppercase tracking-wider">Current</span>}
                  </h3>
                  <a href={exp.companyUrl || "#"} target="_blank" rel="noreferrer" className="text-purple-500 font-bold flex items-center gap-1.5 mt-1 hover:underline">
                    {exp.company}
                  </a>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleVisibility(exp)} className={`p-2.5 rounded-xl transition-colors ${exp.visible !== false ? 'text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20' : 'text-slate-400 bg-slate-400/10 hover:bg-slate-400/20'}`} title="Toggle Visibility">
                  {exp.visible !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => handleEdit(exp)} className="p-2.5 bg-purple-500/10 rounded-xl hover:bg-purple-500/20 text-purple-500 transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button></div>
                <button onClick={() => handleDelete(exp.id)} className="p-2.5 bg-red-500/10 rounded-xl hover:bg-red-500/20 text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 text-sm opacity-60 mb-6 font-semibold">
              <span className="flex items-center gap-1.5 bg-[var(--background)] px-3 py-1.5 rounded-lg border border-[var(--border)]"><Calendar className="w-4 h-4" /> {exp.period}</span>
              <span className="flex items-center gap-1.5 bg-[var(--background)] px-3 py-1.5 rounded-lg border border-[var(--border)]"><MapPin className="w-4 h-4" /> {exp.location}</span>
            </div>
            
            <p className="text-sm opacity-80 mb-6 leading-relaxed">{exp.description}</p>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--border)]">
              <div>
                <h4 className="text-xs uppercase tracking-widest opacity-50 font-bold mb-2">Technologies</h4>
                <div className="text-xs font-mono opacity-80">{exp.technologies?.slice(0,3).join(", ")}{exp.technologies?.length > 3 && "..."}</div>
              </div>
              <div>
                <h4 className="text-xs uppercase tracking-widest opacity-50 font-bold mb-2">Responsibilities</h4>
                <div className="text-xs opacity-80">{exp.responsibilities?.length || 0} Listed</div>
              </div>
            </div>
          </div>
        ))}
        {experiences.length === 0 && (
          <div className="col-span-full py-20 text-center opacity-50 border-2 border-dashed border-[var(--border)] rounded-3xl">
             <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
            No experiences found. Add your first role!
          </div>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[var(--card)] w-full max-w-3xl rounded-[2rem] border border-[var(--border)] shadow-2xl my-auto animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[var(--border)] flex items-center justify-between sticky top-0 bg-[var(--card)] rounded-t-[2rem] z-10">
              <h3 className="text-2xl font-bold">{editingId ? 'Edit' : 'New'} Experience</h3>
              <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-[var(--background)] rounded-full transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold opacity-80">Position *</label>
                  <input required {...register("position")} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium" placeholder="e.g. Senior Frontend Developer" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold opacity-80">Company *</label>
                  <input required {...register("company")} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium" placeholder="e.g. Google" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold opacity-80">Period *</label>
                  <input required {...register("period")} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium" placeholder="e.g. Jan 2022 - Present" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold opacity-80">Location *</label>
                  <input required {...register("location")} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium" placeholder="e.g. Remote" />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-bold opacity-80">Description *</label>
                <textarea required rows={3} {...register("description")} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium resize-none" placeholder="High-level description of your role..." />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-bold opacity-80">Responsibilities (comma separated)</label>
                <textarea rows={3} {...register("responsibilities")} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium resize-none" placeholder="Led a team of 5, Increased performance by 40%..." />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-bold opacity-80">Technologies (comma separated)</label>
                <input {...register("technologies")} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium" placeholder="React, Node.js, GraphQL..." />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold opacity-80">Company URL (Optional)</label>
                  <input type="url" {...register("companyUrl")} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium" placeholder="https://..." />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold opacity-80">Company Logo URL (Optional)</label>
                  <input type="url" {...register("companyLogo")} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium" placeholder="https://..." />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" id="isCurrent" {...register("isCurrent")} className="w-5 h-5 rounded border-[var(--border)] text-purple-500 focus:ring-purple-500 bg-[var(--background)]" />
                <label htmlFor="isCurrent" className="text-sm font-bold opacity-80 cursor-pointer">I currently work here</label>
              </div>
              
              <div className="flex justify-end gap-3 pt-6 border-t border-[var(--border)] mt-4">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-3 rounded-xl border border-[var(--border)] hover:bg-[var(--background)] transition-colors font-bold opacity-70">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-8 py-3 rounded-xl bg-purple-500 text-white hover:scale-105 transition-transform font-bold flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:hover:scale-100">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} {editingId ? "Update" : "Create"} Experience
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    
      <JsonEditorModal 
        isOpen={isJsonEditorOpen} 
        onClose={() => setIsJsonEditorOpen(false)} 
        onSave={handleBulkSave} 
        initialData={experiences} 
        title="Experiences" 
      />
    </div>
  );
}