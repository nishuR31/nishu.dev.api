const fs = require('fs');

const views = [
  { file: 'client/src/views/ExperiencesView.tsx', var: 'experiences', fetchCall: 'fetchExperiences', endpoint: '/api/portfolio/experiences/bulk', modelTitle: 'Experience' },
  { file: 'client/src/views/CertificatesView.tsx', var: 'certificates', fetchCall: 'fetchCertificates', endpoint: '/api/portfolio/certificates/bulk', modelTitle: 'Certificate' },
  { file: 'client/src/views/EducationView.tsx', var: 'education', fetchCall: 'fetchEducation', endpoint: '/api/portfolio/education/bulk', modelTitle: 'Education' },
  { file: 'client/src/views/ProjectsView.tsx', var: 'projects', fetchCall: 'fetchProjects', endpoint: '/api/portfolio/projects/bulk', modelTitle: 'Project' },
  { file: 'client/src/views/ServicesView.tsx', var: 'services', fetchCall: 'fetchServices', endpoint: '/api/portfolio/services/bulk', modelTitle: 'Service' },
  { file: 'client/src/views/TestimonialsView.tsx', var: 'testimonials', fetchCall: 'fetchTestimonials', endpoint: '/api/portfolio/testimonials/bulk', modelTitle: 'Testimonial' }
];

for (const v of views) {
  let code = fs.readFileSync(v.file, 'utf8');

  // Import
  if (!code.includes('JsonEditorModal')) {
    code = code.replace("import { useForm } from 'react-hook-form';", "import { useForm } from 'react-hook-form';\nimport JsonEditorModal from '../components/JsonEditorModal';\nimport { FileJson } from 'lucide-react';");
    
    // State
    code = code.replace(`const [editingId, setEditingId] = useState<string | null>(null);`, `const [editingId, setEditingId] = useState<string | null>(null);\n  const [isJsonEditorOpen, setIsJsonEditorOpen] = useState(false);`);

    // Handler
    const handler = `
  const handleBulkSave = async (parsedData: any) => {
    try {
      await axios.post('${v.endpoint}', parsedData, { withCredentials: true });
      await ${v.fetchCall}();
    } catch (err) {
      console.error('Failed to bulk save', err);
      throw new Error('Failed to save JSON data. Check console for details.');
    }
  };
`;
    code = code.replace(`  if (loading) {`, handler + '\n  if (loading) {');

    // Button wrap start
    code = code.replace(/<button\s*\n\s*onClick=\{openNewForm\}/, '<div className="flex items-center"><button \n          onClick={openNewForm}');

    // Button wrap end
    const buttonText = `Add ${v.modelTitle}`;
    // Replace the exact closing button tag that follows "Add X"
    const regex = new RegExp(`(<Plus className="[^"]+" \\/> ${buttonText}\\s*<\\/button>)`);
    
    code = code.replace(regex, `$1\n        <button onClick={() => setIsJsonEditorOpen(true)} className="bg-[var(--foreground)] text-[var(--background)] px-5 py-2.5 rounded-2xl flex items-center gap-2 hover:scale-105 transition-transform font-semibold shadow-md ml-3"><FileJson className="w-5 h-5" /> Edit JSON</button></div>`);

    // Modal JSX at the end
    const modalJSX = `
      <JsonEditorModal 
        isOpen={isJsonEditorOpen} 
        onClose={() => setIsJsonEditorOpen(false)} 
        onSave={handleBulkSave} 
        initialData={${v.var}} 
        title="${v.modelTitle}s" 
      />
    </div>
  );
}`;
    // Find last </div> ); }
    const lastIndex = code.lastIndexOf('</div>');
    if (lastIndex !== -1) {
      code = code.substring(0, lastIndex) + modalJSX;
    }

    fs.writeFileSync(v.file, code);
  }
}
