import React, { useState, useRef } from 'react';
import axios from 'axios';
import { UploadCloud, FileType, CheckCircle2, Copy, Loader2, Image as ImageIcon } from 'lucide-react';

export default function MediaView() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadedUrl(null);
      setError('');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setUploadedUrl(null);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await axios.post('/api/portfolio/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true
      });
      
      if (response.data.success) {
        setUploadedUrl(response.data.data.url);
        setFile(null);
      }
    } catch (err: any) {
      console.error('Upload failed', err);
      setError(err.response?.data?.message || 'Upload failed due to server error.');
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = () => {
    if (uploadedUrl) {
      navigator.clipboard.writeText(uploadedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ImageIcon className="w-7 h-7 text-[var(--primary)]" />
          Media & Assets
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Upload Zone */}
        <div className="bg-[var(--card)] p-8 rounded-3xl border border-[var(--border)] shadow-sm">
          <h3 className="text-xl font-bold mb-6">Upload to Supabase CDN</h3>
          
          <div 
            className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center transition-all ${file ? 'border-[var(--primary)] bg-blue-500/5' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50'}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange}
              accept="image/*,application/pdf"
            />
            
            {file ? (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto">
                  <FileType className="w-8 h-8 text-[var(--primary)]" />
                </div>
                <div>
                  <p className="font-medium text-white truncate max-w-[200px]">{file.name}</p>
                  <p className="text-sm text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 cursor-pointer">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                  <UploadCloud className="w-8 h-8 text-slate-400" />
                </div>
                <div>
                  <p className="font-medium text-white">Click or drag file to this area</p>
                  <p className="text-sm text-slate-400 mt-1">Supports JPG, PNG, WEBP, AVIF, PDF</p>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button 
              onClick={handleUpload}
              disabled={!file || uploading}
              className="px-6 py-3 rounded-xl bg-[var(--primary)] hover:bg-blue-600 text-white font-semibold transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-500/20"
            >
              {uploading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Uploading...</>
              ) : (
                <><UploadCloud className="w-5 h-5" /> Upload File</>
              )}
            </button>
          </div>
        </div>

        {/* Results Zone */}
        <div className="bg-[var(--card)] p-8 rounded-3xl border border-[var(--border)] shadow-sm flex flex-col items-center justify-center text-center">
          {uploadedUrl ? (
            <div className="space-y-6 w-full animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Upload Successful!</h3>
                <p className="text-slate-400 text-sm mt-1">Your asset is now served globally via Supabase CDN.</p>
              </div>

              {uploadedUrl.match(/\.(jpeg|jpg|gif|png|avif|webp)$/i) ? (
                <div className="w-full h-48 rounded-2xl overflow-hidden border border-[var(--border)] bg-slate-900 relative group">
                  <img src={uploadedUrl} alt="Uploaded preview" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-full p-6 rounded-2xl border border-[var(--border)] bg-slate-900 flex items-center justify-center gap-3">
                  <FileType className="w-8 h-8 text-[var(--primary)]" />
                  <span className="font-medium">Document Uploaded</span>
                </div>
              )}

              <div className="relative group">
                <input 
                  type="text" 
                  readOnly 
                  value={uploadedUrl}
                  className="w-full bg-slate-900 border border-[var(--border)] rounded-xl py-3 px-4 pr-12 text-sm text-slate-300 focus:outline-none"
                />
                <button 
                  onClick={copyToClipboard}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-slate-800 rounded-lg hover:bg-slate-700 text-white transition-colors flex items-center justify-center"
                  title="Copy URL"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-slate-500 max-w-sm">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>Uploaded files will appear here. Use the copied URL for your projects and certificates.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
