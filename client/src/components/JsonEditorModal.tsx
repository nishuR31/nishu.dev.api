import React, { useState } from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';

type JsonEditorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (parsedData: any) => Promise<void>;
  initialData: any;
  title: string;
};

export default function JsonEditorModal({ isOpen, onClose, onSave, initialData, title }: JsonEditorModalProps) {
  const [jsonText, setJsonText] = useState(JSON.stringify(initialData, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      setError(null);
      const parsed = JSON.parse(jsonText);
      setIsSaving(true);
      await onSave(parsed);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid JSON format');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
      <div className="bg-[var(--card)] w-full max-w-4xl max-h-[90vh] flex flex-col rounded-[2rem] border border-[var(--border)] shadow-2xl">
        <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
          <h3 className="text-2xl font-bold flex items-center gap-2">
            Raw JSON Editor: {title}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-[var(--background)] rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 p-6 overflow-hidden flex flex-col">
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-500">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold">JSON Error</h4>
                <p className="text-sm opacity-80 font-mono">{error}</p>
              </div>
            </div>
          )}
          
          <textarea 
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            className="flex-1 w-full bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm p-4 rounded-xl border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none shadow-inner"
            spellCheck="false"
          />
        </div>

        <div className="p-6 border-t border-[var(--border)] flex justify-end gap-3 bg-[var(--card)] rounded-b-[2rem]">
          <button 
            onClick={onClose}
            className="px-6 py-3 rounded-xl border border-[var(--border)] hover:bg-[var(--background)] transition-colors font-bold opacity-70"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-colors font-bold flex items-center gap-2 shadow-lg disabled:opacity-50"
          >
            {isSaving ? (
               <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
               <Save className="w-5 h-5" />
            )}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
