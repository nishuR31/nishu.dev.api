import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit2, Loader2, Award, Save, ExternalLink } from 'lucide-react';

export default function CertificatesView() {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [certId, setCertId] = useState("");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState("");
  const [saving, setSaving] = useState(false);

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
    setCertId(cert.certId);
    setTitle(cert.title);
    setUrl(cert.url);
    setType(cert.type);
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setCertId("");
    setTitle("");
    setUrl("");
    setType("Certificate");
    setIsFormOpen(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { certId, title, url, type };
      if (editingId) {
        await axios.put(`/api/portfolio/certificates/${editingId}`, payload, { withCredentials: true });
      } else {
        await axios.post('/api/portfolio/certificates', payload, { withCredentials: true });
      }
      await fetchCertificates();
      resetForm();
    } catch (err) {
      console.error('Failed to save certificate', err);
      alert('Error saving certificate');
    } finally {
      setSaving(false);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Award className="w-7 h-7 text-[var(--primary)]" />
          Certificates
        </h2>
        <button 
          onClick={() => { resetForm(); setIsFormOpen(true); }}
          className="bg-[var(--primary)] text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:opacity-90 transition-all font-semibold shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-5 h-5" /> Add Certificate
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert) => (
            <div key={cert.id} className="bg-[var(--card)] p-6 rounded-3xl border border-[var(--border)] shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Award className="w-20 h-20 text-[var(--primary)]" />
              </div>
              <div className="flex-1 relative z-10">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 mb-3 border border-blue-500/20">
                  {cert.type}
                </span>
                <h3 className="text-lg font-bold text-[var(--foreground)] mb-2 line-clamp-2">{cert.title}</h3>
                <p className="text-sm text-slate-400 font-mono bg-slate-900/50 px-3 py-1.5 rounded-lg inline-block">ID: {cert.certId}</p>
              </div>
              
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--border)] relative z-10">
                <a href={cert.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-[var(--primary)] hover:text-blue-400 flex items-center gap-1 transition-colors">
                  View Credential <ExternalLink className="w-4 h-4" />
                </a>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(cert)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(cert.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {certificates.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-500 border border-dashed border-[var(--border)] rounded-3xl">
              No certificates found. Add your achievements!
            </div>
          )}
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--card)] w-full max-w-lg rounded-3xl p-8 border border-[var(--border)] shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold mb-6">{editingId ? 'Edit' : 'Add'} Certificate</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Title</label>
                <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-900/50 border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all" placeholder="e.g. AWS Certified Solutions Architect" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Credential ID</label>
                <input type="text" required value={certId} onChange={e => setCertId(e.target.value)} className="w-full bg-slate-900/50 border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all" placeholder="e.g. AWS-12345" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Credential URL</label>
                <input type="url" required value={url} onChange={e => setUrl(e.target.value)} className="w-full bg-slate-900/50 border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all" placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Type</label>
                <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-slate-900/50 border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all text-white">
                  <option value="Certificate">Certificate</option>
                  <option value="Degree">Degree</option>
                  <option value="Badge">Badge</option>
                  <option value="Award">Award</option>
                </select>
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
