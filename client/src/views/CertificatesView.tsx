import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit2, Loader2, Award, Save, ExternalLink, X, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import JsonEditorModal from '../components/JsonEditorModal';
import { FileJson } from 'lucide-react';

type CertificateFormData = {
  certId: string;
  title: string;
  url: string;
  type: string;
  issuer: string;
  issueDate: string;
  expirationDate: string;
  visible: boolean;
};

export default function CertificatesView() {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isJsonEditorOpen, setIsJsonEditorOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<CertificateFormData>({
    defaultValues: {
      certId: "", title: "", url: "", type: "Certificate", issuer: "", issueDate: "", expirationDate: "", visible: true
    }
  });

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const response = await axios.get('/api/portfolio');
      setCertificates(response.data.data.certificates || []);
    } catch (error) {
      console.error('Failed to fetch certificates', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cert: any) => {
    setEditingId(cert.id);
    reset({
      certId: cert.certId,
      title: cert.title,
      url: cert.url,
      type: cert.type,
      issuer: cert.issuer || "",
      issueDate: cert.issueDate ? new Date(cert.issueDate).toISOString().split('T')[0] : "",
      expirationDate: cert.expirationDate ? new Date(cert.expirationDate).toISOString().split('T')[0] : "",
      visible: cert.visible ?? true
    });
    setIsFormOpen(true);
  };

  const openNewForm = () => {
    setEditingId(null);
    reset({ certId: "", title: "", url: "", type: "Certificate", issuer: "", issueDate: "", expirationDate: "", visible: true });
    setIsFormOpen(true);
  };

  const onSubmit = async (data: CertificateFormData) => {
    try {
      const payload = {
        ...data,
        issuer: data.issuer || null,
        issueDate: data.issueDate ? new Date(data.issueDate).toISOString() : null,
        expirationDate: data.expirationDate ? new Date(data.expirationDate).toISOString() : null,
        visible: data.visible
      };

      if (editingId) {
        await axios.put(`/api/portfolio/certificates/${editingId}`, payload, { withCredentials: true });
      } else {
        await axios.post('/api/portfolio/certificates', payload, { withCredentials: true });
      }
      await fetchCertificates();
      setIsFormOpen(false);
    } catch (err) {
      console.error('Failed to save certificate', err);
      alert('Error saving certificate');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this certificate?')) return;
    try {
      await axios.delete(`/api/portfolio/certificates/${id}`, { withCredentials: true });
      await fetchCertificates();
    } catch (err) {
      console.error('Failed to delete certificate', err);
      alert('Error deleting certificate');
    }
  };

  const toggleVisibility = async (cert: any) => {
    try {
      const payload = {
        ...cert,
        visible: !cert.visible
      };
      await axios.put(`/api/portfolio/certificates/${cert.id}`, payload, { withCredentials: true });
      await fetchCertificates();
    } catch (error) {
      console.error('Failed to toggle visibility', error);
      alert('Failed to toggle visibility.');
    }
  };


  const handleBulkSave = async (parsedData: any) => {
    try {
      await axios.post('/api/portfolio/certificates/bulk', parsedData, { withCredentials: true });
      await fetchCertificates();
    } catch (err) {
      console.error('Failed to bulk save', err);
      throw new Error('Failed to save JSON data. Check console for details.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[var(--foreground)] opacity-60 font-medium tracking-wide">Loading Certificates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-700 pb-24 md:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[var(--card)] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[var(--border)] shadow-sm">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 sm:gap-3">
          <Award className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500" />
          Certificates
        </h2>
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={openNewForm} className="bg-amber-500 text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl flex items-center gap-1.5 sm:gap-2 hover:scale-105 transition-transform font-semibold shadow-md text-sm sm:text-base">
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" /> Add
          </button>
          <button onClick={() => setIsJsonEditorOpen(true)} className="bg-[var(--foreground)] text-[var(--background)] px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl flex items-center gap-1.5 sm:gap-2 hover:scale-105 transition-transform font-semibold shadow-md text-sm sm:text-base">
            <FileJson className="w-4 h-4 sm:w-5 sm:h-5" /> JSON
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {certificates.map((cert) => (
          <div key={cert.id} className={`bg-[var(--card)] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[var(--border)] shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all group relative overflow-hidden flex flex-col duration-300 ${cert.visible === false ? 'opacity-50 grayscale-[0.5]' : ''}`}>
            <div className="absolute top-0 right-0 p-4 opacity-10 transition-opacity group-hover:opacity-20">
              <Award className="w-24 h-24 text-amber-500" />
            </div>
            <div className="flex-1 relative z-10">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-4 border border-amber-500/20 shadow-sm">
                {cert.type}
              </span>
              <h3 className="text-xl font-bold text-[var(--foreground)] mb-1 line-clamp-2">{cert.title}</h3>
              {cert.issuer && <p className="text-sm font-medium text-slate-400 mb-3">{cert.issuer}</p>}
              <p className="text-xs text-amber-600 dark:text-amber-400 font-mono bg-amber-500/10 px-3 py-1.5 rounded-xl inline-block border border-amber-500/20 font-bold">ID: {cert.certId}</p>
              {(cert.issueDate || cert.expirationDate) && (
                <div className="mt-4 text-xs font-semibold text-slate-400 flex flex-col gap-1">
                  {cert.issueDate && <span>Issued: {new Date(cert.issueDate).toLocaleDateString()}</span>}
                  {cert.expirationDate && <span>Expires: {new Date(cert.expirationDate).toLocaleDateString()}</span>}
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between mt-8 pt-5 border-t border-[var(--border)] relative z-10">
              <a href={cert.url} target="_blank" rel="noreferrer" className="text-sm font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1.5 transition-colors">
                View Credential <ExternalLink className="w-4 h-4" />
              </a>
              <div className="flex gap-2">
                <button onClick={() => toggleVisibility(cert)} className={`p-2.5 rounded-xl transition-colors shadow-sm ${cert.visible !== false ? 'text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 border' : 'text-slate-400 bg-slate-400/10 hover:bg-slate-400/20 border-[var(--border)] border'}`} title="Toggle Visibility">
                  {cert.visible !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => handleEdit(cert)} className="p-2.5 bg-[var(--background)] border border-[var(--border)] hover:border-blue-500/50 rounded-xl text-slate-400 hover:text-blue-500 transition-colors shadow-sm">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(cert.id)} className="p-2.5 bg-[var(--background)] border border-[var(--border)] hover:border-red-500/50 rounded-xl text-slate-400 hover:text-red-500 transition-colors shadow-sm">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {certificates.length === 0 && (
          <div className="col-span-full py-20 text-center opacity-50 border-2 border-dashed border-[var(--border)] rounded-3xl">
             <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
            No certificates found. Add your achievements!
          </div>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--card)] w-full max-w-lg rounded-[2rem] border border-[var(--border)] shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--card)] rounded-t-[2rem]">
              <h3 className="text-2xl font-bold">{editingId ? 'Edit' : 'Add'} Certificate</h3>
              <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-[var(--background)] rounded-full transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-bold opacity-80">Title *</label>
                <input required {...register("title")} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium" placeholder="e.g. AWS Certified Solutions Architect" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold opacity-80">Credential ID *</label>
                <input required {...register("certId")} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium" placeholder="e.g. AWS-12345" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold opacity-80">Credential URL *</label>
                <input type="url" required {...register("url")} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium" placeholder="https://..." />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold opacity-80">Type</label>
                <select {...register("type")} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium">
                  <option value="Certificate">Certificate</option>
                  <option value="Degree">Degree</option>
                  <option value="Badge">Badge</option>
                  <option value="Award">Award</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold opacity-80">Issuer (Optional)</label>
                <input {...register("issuer")} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium" placeholder="e.g. Amazon Web Services" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold opacity-80">Issue Date (Optional)</label>
                  <input type="date" {...register("issueDate")} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium [color-scheme:dark]" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold opacity-80">Expiration Date (Optional)</label>
                  <input type="date" {...register("expirationDate")} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium [color-scheme:dark]" />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-6 border-t border-[var(--border)] mt-4">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-3 rounded-xl border border-[var(--border)] hover:bg-[var(--background)] transition-colors font-bold opacity-70">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-8 py-3 rounded-xl bg-amber-500 text-white hover:scale-105 transition-transform font-bold flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:hover:scale-100">
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
        initialData={certificates} 
        title="Certificates" 
      />
    </div>
  );
}