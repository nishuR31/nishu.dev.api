import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit2, Loader2, FolderGit2, Save } from 'lucide-react';

export default function ProjectsView() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [github, setGithub] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/api/portfolio');
      setProjects(response.data.data.projects || []);
    } catch (error) {
      console.error('Failed to fetch projects', error);
    } finally {
      setLoading(false);
    }
  };

  const openForm = (project?: any) => {
    if (project) {
      setEditingId(project.id);
      setTitle(project.title);
      setDescription(project.description);
      setGithub(project.github || "");
    } else {
      setEditingId(null);
      setTitle("");
      setDescription("");
      setGithub("");
    }
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title,
        description,
        github: github || null,
        technologies: [], // simplified for demo
        highlights: [],
        categories: [],
        featured: false
      };

      if (editingId) {
        await axios.put(`/api/portfolio/projects/${editingId}`, payload);
      } else {
        await axios.post('/api/portfolio/projects', payload);
      }
      setIsFormOpen(false);
      await fetchProjects();
    } catch (error) {
      console.error('Failed to save project', error);
      alert('Failed to save project. Ensure you have the developer role.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this project?")) {
      try {
        await axios.delete(`/api/portfolio/projects/${id}`);
        await fetchProjects();
      } catch (error) {
        console.error('Failed to delete', error);
      }
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-[var(--foreground)] opacity-60">Loading Projects...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold flex items-center gap-2"><FolderGit2 className="text-[var(--primary)]" /> Projects</h2>
        <button onClick={() => openForm()} className="bg-[var(--primary)] text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:opacity-90">
          <Plus className="w-4 h-4" /> Add Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((p) => (
          <div key={p.id} className="p-6 bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold">{p.title}</h3>
              <p className="text-sm opacity-70 mt-2 line-clamp-2">{p.description}</p>
            </div>
            <div className="flex items-center justify-end gap-2 mt-6">
              <button onClick={() => openForm(p)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(p.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--card)] p-6 rounded-3xl w-full max-w-lg border border-[var(--border)] shadow-2xl">
            <h3 className="text-2xl font-bold mb-4">{editingId ? "Edit Project" : "New Project"}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Title</label>
                <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Description</label>
                <textarea required value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] outline-none h-24" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">GitHub URL (Optional)</label>
                <input type="url" value={github} onChange={(e) => setGithub(e.target.value)} className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] outline-none" />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 opacity-70 hover:bg-[var(--background)] rounded-xl">Cancel</button>
                <button type="submit" disabled={saving} className="px-6 py-2 bg-[var(--primary)] text-white rounded-xl flex items-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
