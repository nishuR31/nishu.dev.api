import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit2, Loader2, Save, X, Briefcase, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import JsonEditorModal from '../components/JsonEditorModal';
import { FileJson } from 'lucide-react';

type ServiceFormData = {
  title: string;
  description: string;
  icon: string;
  pricing: string;
  visible: boolean;
};

export default function ServicesView() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isJsonEditorOpen, setIsJsonEditorOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<ServiceFormData>({
    defaultValues: { title: "", description: "", icon: "", pricing: "", visible: true }
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get('/api/portfolio');
      setServices(response.data.data.services || []);
    } catch (error) {
      console.error('Failed to fetch services', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (service: any) => {
    setEditingId(service.id);
    reset({
      title: service.title,
      description: service.description,
      icon: service.icon || "",
      pricing: service.pricing || "",
      visible: service.visible ?? true
    });
    setIsFormOpen(true);
  };

  const openNewForm = () => {
    setEditingId(null);
    reset({ title: "", description: "", icon: "", pricing: "", visible: true });
    setIsFormOpen(true);
  };

  const onSubmit = async (data: ServiceFormData) => {
    try {
      if (editingId) {
        await axios.put(`/api/portfolio/services/${editingId}`, data, { withCredentials: true });
      } else {
        await axios.post('/api/portfolio/services', data, { withCredentials: true });
      }
      await fetchServices();
      setIsFormOpen(false);
    } catch (err) {
      console.error('Failed to save service', err);
      alert('Error saving service');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      await axios.delete(`/api/portfolio/services/${id}`, { withCredentials: true });
      await fetchServices();
    } catch (err) {
      console.error('Failed to delete service', err);
      alert('Error deleting service');
    }
  };

  const toggleVisibility = async (service: any) => {
    try {
      const payload = {
        ...service,
        visible: !service.visible
      };
      await axios.put(`/api/portfolio/services/${service.id}`, payload, { withCredentials: true });
      await fetchServices();
    } catch (error) {
      console.error('Failed to toggle visibility', error);
      alert('Failed to toggle visibility.');
    }
  };


  const handleBulkSave = async (parsedData: any) => {
    try {
      await axios.post('/api/portfolio/services/bulk', parsedData, { withCredentials: true });
      await fetchServices();
    } catch (err) {
      console.error('Failed to bulk save', err);
      throw new Error('Failed to save JSON data. Check console for details.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[var(--foreground)] opacity-60 font-medium tracking-wide">Loading Services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-700 pb-24 md:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[var(--card)] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[var(--border)] shadow-sm">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 sm:gap-3">
          <Briefcase className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-500" />
          Services
        </h2>
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={openNewForm} className="bg-indigo-500 text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl flex items-center gap-1.5 sm:gap-2 hover:scale-105 transition-transform font-semibold shadow-md text-sm sm:text-base">
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" /> Add
          </button>
          <button onClick={() => setIsJsonEditorOpen(true)} className="bg-[var(--foreground)] text-[var(--background)] px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl flex items-center gap-1.5 sm:gap-2 hover:scale-105 transition-transform font-semibold shadow-md text-sm sm:text-base">
            <FileJson className="w-4 h-4 sm:w-5 sm:h-5" /> JSON
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {services.map((service) => (
          <div key={service.id} className={`bg-[var(--card)] p-6 rounded-3xl border border-[var(--border)] shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all group relative overflow-hidden flex flex-col duration-300 ${service.visible === false ? 'opacity-50 grayscale-[0.5]' : ''}`}>
            <div className="absolute top-0 right-0 p-4 opacity-10 transition-opacity group-hover:opacity-20">
              <Briefcase className="w-24 h-24 text-indigo-500" />
            </div>
            <div className="flex-1 relative z-10">
              <h3 className="text-xl font-bold text-[var(--foreground)] mb-3 line-clamp-2">{service.title}</h3>
              <p className="text-sm text-slate-400 mb-4 line-clamp-3">{service.description}</p>
              {service.pricing && (
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-500 border border-green-500/20 shadow-sm">
                  {service.pricing}
                </span>
              )}
            </div>
            
            <div className="flex items-center justify-end mt-8 pt-5 border-t border-[var(--border)] relative z-10">
              <div className="flex gap-2">
                <button onClick={() => toggleVisibility(service)} className={`p-2.5 rounded-xl transition-colors shadow-sm ${service.visible !== false ? 'text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 border' : 'text-slate-400 bg-slate-400/10 hover:bg-slate-400/20 border-[var(--border)] border'}`} title="Toggle Visibility">
                  {service.visible !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => handleEdit(service)} className="p-2.5 bg-[var(--background)] border border-[var(--border)] hover:border-indigo-500/50 rounded-xl text-slate-400 hover:text-indigo-500 transition-colors shadow-sm">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(service.id)} className="p-2.5 bg-[var(--background)] border border-[var(--border)] hover:border-red-500/50 rounded-xl text-slate-400 hover:text-red-500 transition-colors shadow-sm">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {services.length === 0 && (
          <div className="col-span-full py-20 text-center opacity-50 border-2 border-dashed border-[var(--border)] rounded-3xl">
             <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
            No services found. Add your offerings!
          </div>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--card)] w-full max-w-lg rounded-[2rem] border border-[var(--border)] shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--card)] rounded-t-[2rem]">
              <h3 className="text-2xl font-bold">{editingId ? 'Edit' : 'Add'} Service</h3>
              <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-[var(--background)] rounded-full transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-bold opacity-80">Title *</label>
                <input required {...register("title")} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium" placeholder="e.g. Web Development" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold opacity-80">Description *</label>
                <textarea required {...register("description")} rows={3} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium" placeholder="Describe your service..." />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold opacity-80">Pricing (Optional)</label>
                <input {...register("pricing")} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium" placeholder="e.g. Starting at $500" />
              </div>
              
              <div className="flex justify-end gap-3 pt-6 border-t border-[var(--border)] mt-4">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-3 rounded-xl border border-[var(--border)] hover:bg-[var(--background)] transition-colors font-bold opacity-70">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-8 py-3 rounded-xl bg-indigo-500 text-white hover:scale-105 transition-transform font-bold flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:hover:scale-100">
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
        initialData={services} 
        title="Services" 
      />
    </div>
  );
}