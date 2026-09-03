import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit2, Loader2, FolderGit2, Save, X, Eye, EyeOff } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';

type ProjectFormData = {
  title: string;
  description: string;
  image: string;
  technologies: string;
  github: string;
  demo: string;
  problem: string;
  solution: string;
  role: string;
  timeline: string;
  highlights: string;
  categories: string;
  featured: boolean;
  slug: string;
  status: string;
  architecture: string;
  company: string;
  stars: number | null;
  visible: boolean;
};

export default function ProjectsView() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { register, handleSubmit, reset, control, formState: { isSubmitting } } = useForm<ProjectFormData>({
    defaultValues: {
      title: "", description: "", image: "", technologies: "", github: "", demo: "",
      problem: "", solution: "", role: "", timeline: "", highlights: "", categories: "", featured: false,
      slug: "", status: "Completed", architecture: "", company: "", stars: null, visible: true
    }
  });

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
      reset({
        title: project.title,
        description: project.description,
        image: project.image || "",
        technologies: project.technologies ? project.technologies.join(", ") : "",
        github: project.github || "",
        demo: project.demo || "",
        problem: project.problem || "",
        solution: project.solution || "",
        role: project.role || "",
        timeline: project.timeline || "",
        highlights: project.highlights ? project.highlights.join(", ") : "",
        categories: project.categories ? project.categories.join(", ") : "",
        featured: project.featured || false,
        slug: project.slug || "",
        status: project.status || "Completed",
        architecture: project.architecture ? project.architecture.join(", ") : "",
        company: project.company || "",
        stars: project.stars || null,
        visible: project.visible ?? true
      });
    } else {
      setEditingId(null);
      reset({
        title: "", description: "", image: "", technologies: "", github: "", demo: "",
        problem: "", solution: "", role: "", timeline: "", highlights: "", categories: "", featured: false,
        slug: "", status: "Completed", architecture: "", company: "", stars: null, visible: true
      });
    }
    setIsFormOpen(true);
  };

  const onSubmit = async (data: ProjectFormData) => {
    try {
      const payload = {
        ...data,
        technologies: data.technologies ? data.technologies.split(',').map(s => s.trim()).filter(Boolean) : [],
        highlights: data.highlights ? data.highlights.split(',').map(s => s.trim()).filter(Boolean) : [],
        categories: data.categories ? data.categories.split(',').map(s => s.trim()).filter(Boolean) : [],
        github: data.github || null,
        demo: data.demo || null,
        problem: data.problem || null,
        solution: data.solution || null,
        role: data.role || null,
        timeline: data.timeline || null,
        slug: data.slug || null,
        status: data.status || null,
        architecture: data.architecture ? data.architecture.split(',').map(s => s.trim()).filter(Boolean) : [],
        company: data.company || null,
        stars: data.stars ? Number(data.stars) : null,
        visible: data.visible
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

  const toggleVisibility = async (project: any) => {
    try {
      const payload = {
        ...project,
        visible: !project.visible
      };
      await axios.put(`/api/portfolio/projects/${project.id}`, payload);
      await fetchProjects();
    } catch (error) {
      console.error('Failed to toggle visibility', error);
      alert('Failed to toggle visibility.');
    }
  };


  const handleBulkSave = async (parsedData: any) => {
    try {
      await axios.post('/api/portfolio/projects/bulk', parsedData, { withCredentials: true });
      await fetchProjects();
    } catch (err) {
      console.error('Failed to bulk save', err);
      throw new Error('Failed to save JSON data. Check console for details.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[var(--foreground)] opacity-60 font-medium tracking-wide">Loading Projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-24 md:pb-0">
      <div className="flex items-center justify-between bg-[var(--card)] p-6 rounded-3xl border border-[var(--border)] shadow-sm">
        <h2 className="text-3xl font-bold flex items-center gap-3"><FolderGit2 className="text-blue-500 w-8 h-8" /> Projects</h2>
        <div className="flex items-center"><button onClick={() => openForm()} className="bg-blue-500 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 hover:scale-105 transition-transform shadow-md font-semibold">
          <Plus className="w-5 h-5" /> Add Project
        </button>
        <button onClick={() => setIsJsonEditorOpen(true)} className="bg-[var(--foreground)] text-[var(--background)] px-5 py-2.5 rounded-2xl flex items-center gap-2 hover:scale-105 transition-transform font-semibold shadow-md ml-3"><FileJson className="w-5 h-5" /> Edit JSON</button></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {projects.map((p) => (
          <div key={p.id} className={`p-6 bg-[var(--card)] rounded-3xl border border-[var(--border)] shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group ${p.visible === false ? 'opacity-50 grayscale-[0.5]' : ''}`}>
            <div>
              <div className="w-full h-40 bg-[var(--background)] rounded-2xl mb-4 overflow-hidden border border-[var(--border)]">
                {p.image ? (
                  <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-20"><FolderGit2 className="w-12 h-12" /></div>
                )}
              </div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-xl font-bold line-clamp-1 flex items-center gap-2">
                  {p.title}
                  {p.status === "In Progress" && <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-amber-500/10 text-amber-500 border border-amber-500/20 whitespace-nowrap">In Progress</span>}
                </h3>
                {p.featured && <span className="bg-amber-500/10 text-amber-600 text-xs px-2 py-1 rounded-lg font-bold border border-amber-500/20 shrink-0">Featured</span>}
              </div>
              <p className="text-sm opacity-60 mt-2 line-clamp-2">{p.description}</p>
            </div>
            
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--border)]">
              <div className="text-xs opacity-50 font-mono truncate max-w-[150px]">
                {p.technologies?.slice(0,2).join(", ")}{p.technologies?.length > 2 && "..."}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleVisibility(p)} className={`p-2 rounded-xl transition-colors ${p.visible !== false ? 'text-emerald-500 hover:bg-emerald-500/10' : 'text-slate-400 hover:bg-slate-400/10'}`} title="Toggle Visibility">
                  {p.visible !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => openForm(p)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-xl transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(p.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {projects.length === 0 && (
          <div className="col-span-full py-20 text-center opacity-50 border-2 border-dashed border-[var(--border)] rounded-3xl">
            <FolderGit2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            No projects found. Add your first project!
          </div>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-6 overflow-y-auto">
          <div className="bg-[var(--card)] rounded-[2rem] w-full max-w-4xl border border-[var(--border)] shadow-2xl my-auto animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[var(--border)] flex items-center justify-between sticky top-0 bg-[var(--card)] rounded-t-[2rem] z-10">
              <h3 className="text-2xl font-bold">{editingId ? "Edit Project" : "New Project"}</h3>
              <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-[var(--background)] rounded-full transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 opacity-80">Title *</label>
                    <input required {...register("title")} className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 opacity-80">Description *</label>
                    <textarea required {...register("description")} className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all h-24 resize-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 opacity-80">Image URL</label>
                    <input {...register("image")} className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 opacity-80">Technologies (comma separated)</label>
                    <input {...register("technologies")} placeholder="React, Node.js, Tailwind..." className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1.5 opacity-80">GitHub URL</label>
                      <input type="url" {...register("github")} className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] outline-none focus:border-blue-500 transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1.5 opacity-80">Demo URL</label>
                      <input type="url" {...register("demo")} className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] outline-none focus:border-blue-500 transition-all" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1.5 opacity-80">Slug (Optional)</label>
                      <input {...register("slug")} placeholder="e.g. gh-control" className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] outline-none focus:border-blue-500 transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1.5 opacity-80">Status</label>
                      <select {...register("status")} className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] outline-none focus:border-blue-500 transition-all">
                        <option value="Completed">Completed</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Archived">Archived</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 opacity-80">Architecture / System Design (comma separated)</label>
                    <input {...register("architecture")} placeholder="Microservices, Redis Cache..." className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] outline-none focus:border-blue-500 transition-all" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 opacity-80">Problem</label>
                    <textarea {...register("problem")} className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] outline-none focus:border-blue-500 transition-all h-20 resize-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 opacity-80">Solution</label>
                    <textarea {...register("solution")} className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] outline-none focus:border-blue-500 transition-all h-20 resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1.5 opacity-80">Role</label>
                      <input {...register("role")} className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] outline-none focus:border-blue-500 transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1.5 opacity-80">Timeline</label>
                      <input {...register("timeline")} placeholder="e.g. 2 Months" className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] outline-none focus:border-blue-500 transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 opacity-80">Highlights (comma separated)</label>
                    <input {...register("highlights")} className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] outline-none focus:border-blue-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 opacity-80">Categories (comma separated)</label>
                    <input {...register("categories")} className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] outline-none focus:border-blue-500 transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1.5 opacity-80">Company / Client</label>
                      <input {...register("company")} placeholder="e.g. Acme Corp" className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] outline-none focus:border-blue-500 transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1.5 opacity-80">GitHub Stars</label>
                      <input type="number" {...register("stars")} className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] outline-none focus:border-blue-500 transition-all" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <Controller
                      name="featured"
                      control={control}
                      render={({ field }) => (
                        <button
                          type="button"
                          onClick={() => field.onChange(!field.value)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${field.value ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${field.value ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      )}
                    />
                    <span className="text-sm font-semibold opacity-80">Featured Project</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-8 mt-6 border-t border-[var(--border)]">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-3 font-semibold opacity-70 hover:bg-[var(--background)] rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-blue-500 text-white font-bold rounded-xl flex items-center gap-2 hover:scale-105 transition-transform shadow-lg disabled:opacity-50 disabled:hover:scale-100">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} {editingId ? "Update" : "Create"} Project
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
        initialData={projects} 
        title="Projects" 
      />
    </div>
  );
}