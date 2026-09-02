import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit2, Loader2, Briefcase, Save, MapPin, Calendar, Building } from 'lucide-react';

export default function ExperiencesView() {
  const [experiences, setExperiences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [position, setPosition] = useState("");
  const [company, setCompany] = useState("");
  const [period, setPeriod] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

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
    setPosition(exp.position);
    setCompany(exp.company);
    setPeriod(exp.period);
    setLocation(exp.location);
    setDescription(exp.description);
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setPosition("");
    setCompany("");
    setPeriod("");
    setLocation("");
    setDescription("");
    setIsFormOpen(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        position,
        company,
        period,
        location,
        description,
        responsibilities: [],
        technologies: []
      };

      if (editingId) {
        await axios.put(`/api/portfolio/experiences/${editingId}`, payload, { withCredentials: true });
      } else {
        await axios.post('/api/portfolio/experiences', payload, { withCredentials: true });
      }
      
      await fetchExperiences();
      resetForm();
    } catch (err) {
      console.error('Failed to save experience', err);
      alert('Error saving experience');
    } finally {
      setSaving(false);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Briefcase className="w-7 h-7 text-[var(--primary)]" />
          Experiences
        </h2>
        <button 
          onClick={() => { resetForm(); setIsFormOpen(true); }}
          className="bg-[var(--primary)] text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:opacity-90 transition-all font-semibold shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-5 h-5" /> Add Experience
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {experiences.map((exp) => (
            <div key={exp.id} className="bg-[var(--card)] p-6 rounded-3xl border border-[var(--border)] shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500" />
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-[var(--foreground)]">{exp.position}</h3>
                  <p className="text-[var(--primary)] font-medium flex items-center gap-1 mt-1">
                    <Building className="w-4 h-4" /> {exp.company}
                  </p>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(exp)} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(exp.id)} className="p-2 bg-red-500/10 rounded-lg hover:bg-red-500/20 text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-slate-400 mb-4">
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {exp.period}</span>
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {exp.location}</span>
              </div>
              <p className="text-sm text-slate-400 line-clamp-3">{exp.description}</p>
            </div>
          ))}
          {experiences.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-500 border border-dashed border-[var(--border)] rounded-3xl">
              No experiences found. Add your first role!
            </div>
          )}
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--card)] w-full max-w-2xl rounded-3xl p-8 border border-[var(--border)] shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold mb-6">{editingId ? 'Edit' : 'Add'} Experience</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Position</label>
                  <input type="text" required value={position} onChange={e => setPosition(e.target.value)} className="w-full bg-slate-900/50 border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all" placeholder="e.g. Senior Frontend Developer" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Company</label>
                  <input type="text" required value={company} onChange={e => setCompany(e.target.value)} className="w-full bg-slate-900/50 border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all" placeholder="e.g. Google" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Period</label>
                  <input type="text" required value={period} onChange={e => setPeriod(e.target.value)} className="w-full bg-slate-900/50 border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all" placeholder="e.g. Jan 2022 - Present" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Location</label>
                  <input type="text" required value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-slate-900/50 border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all" placeholder="e.g. Remote" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Description</label>
                <textarea required rows={4} value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-slate-900/50 border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all" placeholder="Describe your responsibilities and achievements..." />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={resetForm} className="px-6 py-2.5 rounded-xl border border-[var(--border)] hover:bg-slate-800 transition-colors font-medium">Cancel</button>
                <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl bg-[var(--primary)] hover:bg-blue-600 text-white transition-colors font-medium flex items-center gap-2">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
