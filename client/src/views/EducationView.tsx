import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit2, Loader2, Save, X, GraduationCap, Calendar, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import JsonEditorModal from '../components/JsonEditorModal';
import { FileJson } from 'lucide-react';

type EducationFormData = {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  grade: string;
  visible: boolean;
};

export default function EducationView() {
  const [education, setEducation] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isJsonEditorOpen, setIsJsonEditorOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<EducationFormData>({
    defaultValues: { institution: "", degree: "", field: "", startDate: "", endDate: "", grade: "", visible: true }
  });

  useEffect(() => {
    fetchEducation();
  }, []);

  const fetchEducation = async () => {
    try {
      const response = await axios.get('/api/portfolio');
      setEducation(response.data.data.education || []);
    } catch (error) {
      console.error('Failed to fetch education', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (edu: any) => {
    setEditingId(edu.id);
    reset({
      institution: edu.institution,
      degree: edu.degree,
      field: edu.field,
      startDate: edu.startDate ? new Date(edu.startDate).toISOString().split('T')[0] : "",
      endDate: edu.endDate ? new Date(edu.endDate).toISOString().split('T')[0] : "",
      grade: edu.grade || "",
      visible: edu.visible ?? true
    });
    setIsFormOpen(true);
  };

  const openNewForm = () => {
    setEditingId(null);
    reset({ institution: "", degree: "", field: "", startDate: "", endDate: "", grade: "", visible: true });
    setIsFormOpen(true);
  };

  const onSubmit = async (data: EducationFormData) => {
    try {
      const payload = {
        ...data,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : null,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
        grade: data.grade || null,
        visible: data.visible
      };

      if (editingId) {
        await axios.put(`/api/portfolio/education/${editingId}`, payload, { withCredentials: true });
      } else {
        await axios.post('/api/portfolio/education', payload, { withCredentials: true });
      }
      await fetchEducation();
      setIsFormOpen(false);
    } catch (err) {
      console.error('Failed to save education', err);
      alert('Error saving education');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this education entry?')) return;
    try {
      await axios.delete(`/api/portfolio/education/${id}`, { withCredentials: true });
      await fetchEducation();
    } catch (err) {
      console.error('Failed to delete education', err);
      alert('Error deleting education');
    }
  };

  const toggleVisibility = async (edu: any) => {
    try {
      const payload = {
        ...edu,
        visible: !edu.visible
      };
      await axios.put(`/api/portfolio/education/${edu.id}`, payload, { withCredentials: true });
      await fetchEducation();
    } catch (error) {
      console.error('Failed to toggle visibility', error);
      alert('Failed to toggle visibility.');
    }
  };


  const handleBulkSave = async (parsedData: any) => {
    try {
      await axios.post('/api/portfolio/education/bulk', parsedData, { withCredentials: true });
      await fetchEducation();
    } catch (err) {
      console.error('Failed to bulk save', err);
      throw new Error('Failed to save JSON data. Check console for details.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[var(--foreground)] opacity-60 font-medium tracking-wide">Loading Education...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-24 md:pb-0">
      <div className="flex items-center justify-between bg-[var(--card)] p-6 rounded-3xl border border-[var(--border)] shadow-sm">
        <h2 className="text-3xl font-bold flex items-center gap-3">
          <GraduationCap className="w-8 h-8 text-emerald-500" />
          Education
        </h2>
        <div className="flex items-center"><button 
          onClick={openNewForm}
          className="bg-emerald-500 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 hover:scale-105 transition-transform font-semibold shadow-md"
        >
          <Plus className="w-5 h-5" /> Add Education
        </button>
        <button onClick={() => setIsJsonEditorOpen(true)} className="bg-[var(--foreground)] text-[var(--background)] px-5 py-2.5 rounded-2xl flex items-center gap-2 hover:scale-105 transition-transform font-semibold shadow-md ml-3"><FileJson className="w-5 h-5" /> Edit JSON</button></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {education.map((edu) => (
          <div key={edu.id} className={`bg-[var(--card)] p-6 rounded-3xl border border-[var(--border)] shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all group relative overflow-hidden flex flex-col duration-300 ${edu.visible === false ? 'opacity-50 grayscale-[0.5]' : ''}`}>
            <div className="absolute top-0 right-0 p-4 opacity-10 transition-opacity group-hover:opacity-20">
              <GraduationCap className="w-24 h-24 text-emerald-500" />
            </div>
            <div className="flex-1 relative z-10">
              <h3 className="text-xl font-bold text-[var(--foreground)] mb-1 line-clamp-2">{edu.institution}</h3>
              <p className="text-sm font-medium text-emerald-500 mb-3">{edu.degree} in {edu.field}</p>
              
              <div className="flex flex-col gap-2 mt-4 text-xs font-semibold text-slate-400">
                {(edu.startDate || edu.endDate) && (
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> 
                    {edu.startDate ? new Date(edu.startDate).getFullYear() : "?"} - {edu.endDate ? new Date(edu.endDate).getFullYear() : "Present"}
                  </span>
                )}
                {edu.grade && (
                  <span className="inline-block px-2 py-1 rounded bg-[var(--background)] border border-[var(--border)] self-start">
                    Grade: {edu.grade}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-end mt-6 pt-5 border-t border-[var(--border)] relative z-10">
              <div className="flex gap-2">
                <button onClick={() => toggleVisibility(edu)} className={`p-2.5 rounded-xl transition-colors shadow-sm ${edu.visible !== false ? 'text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 border' : 'text-slate-400 bg-slate-400/10 hover:bg-slate-400/20 border-[var(--border)] border'}`} title="Toggle Visibility">
                  {edu.visible !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => handleEdit(edu)} className="p-2.5 bg-[var(--background)] border border-[var(--border)] hover:border-emerald-500/50 rounded-xl text-slate-400 hover:text-emerald-500 transition-colors shadow-sm">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(edu.id)} className="p-2.5 bg-[var(--background)] border border-[var(--border)] hover:border-red-500/50 rounded-xl text-slate-400 hover:text-red-500 transition-colors shadow-sm">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {education.length === 0 && (
          <div className="col-span-full py-20 text-center opacity-50 border-2 border-dashed border-[var(--border)] rounded-3xl">
             <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
            No education history found. Add your academic background!
          </div>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--card)] w-full max-w-lg rounded-[2rem] border border-[var(--border)] shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--card)] rounded-t-[2rem]">
              <h3 className="text-2xl font-bold">{editingId ? 'Edit' : 'Add'} Education</h3>
              <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-[var(--background)] rounded-full transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-sm font-bold opacity-80">Institution *</label>
                <input required {...register("institution")} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium" placeholder="e.g. Stanford University" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold opacity-80">Degree *</label>
                  <input required {...register("degree")} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium" placeholder="e.g. B.S." />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold opacity-80">Field of Study *</label>
                  <input required {...register("field")} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium" placeholder="e.g. Computer Science" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold opacity-80">Start Date (Optional)</label>
                  <input type="date" {...register("startDate")} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium [color-scheme:dark]" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold opacity-80">End Date (Optional)</label>
                  <input type="date" {...register("endDate")} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium [color-scheme:dark]" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold opacity-80">Grade / GPA (Optional)</label>
                <input {...register("grade")} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium" placeholder="e.g. 3.9/4.0" />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-[var(--border)]">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-3 rounded-xl border border-[var(--border)] hover:bg-[var(--background)] transition-colors font-bold opacity-70">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-8 py-3 rounded-xl bg-emerald-500 text-white hover:scale-105 transition-transform font-bold flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:hover:scale-100">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} {editingId ? "Update" : "Create"}
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
        initialData={education} 
        title="Educations" 
      />
    </div>
  );
}