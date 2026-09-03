const fs = require('fs');

const views = [
  { file: 'client/src/views/ExperiencesView.tsx', var: 'experiences', fetchCall: 'fetchExperiences', endpoint: '/api/portfolio/experiences/bulk' },
  { file: 'client/src/views/CertificatesView.tsx', var: 'certificates', fetchCall: 'fetchCertificates', endpoint: '/api/portfolio/certificates/bulk' },
  { file: 'client/src/views/EducationView.tsx', var: 'education', fetchCall: 'fetchEducation', endpoint: '/api/portfolio/education/bulk' },
  { file: 'client/src/views/ProjectsView.tsx', var: 'projects', fetchCall: 'fetchProjects', endpoint: '/api/portfolio/projects/bulk' },
  { file: 'client/src/views/ServicesView.tsx', var: 'services', fetchCall: 'fetchServices', endpoint: '/api/portfolio/services/bulk' },
  { file: 'client/src/views/TestimonialsView.tsx', var: 'testimonials', fetchCall: 'fetchTestimonials', endpoint: '/api/portfolio/testimonials/bulk' }
];

for (const v of views) {
  let code = fs.readFileSync(v.file, 'utf8');

  if (!code.includes('JsonEditorModal')) {
    // Add import
    code = code.replace("import { useForm } from 'react-hook-form';", "import { useForm } from 'react-hook-form';\nimport JsonEditorModal from '../components/JsonEditorModal';\nimport { FileJson } from 'lucide-react';");
    
    // Add state
    code = code.replace(`const [editingId, setEditingId] = useState<string | null>(null);`, `const [editingId, setEditingId] = useState<string | null>(null);\n  const [isJsonEditorOpen, setIsJsonEditorOpen] = useState(false);`);

    // Add button next to "Add ..."
    const addButtonRegex = /(<button\s+onClick=\{openNewForm\}.*?>[\s\S]*?<\/button>)/;
    code = code.replace(addButtonRegex, `$1\n        <button onClick={() => setIsJsonEditorOpen(true)} className="bg-[var(--foreground)] text-[var(--background)] px-5 py-2.5 rounded-2xl flex items-center gap-2 hover:scale-105 transition-transform font-semibold shadow-md ml-3"><FileJson className="w-5 h-5" /> Edit JSON</button>`);

    // Ensure buttons are in a flex container if they aren't already
    code = code.replace(/(<h2.*?<\/h2>\s*)(<button\s+onClick=\{openNewForm\}.*?<\/button>\s*<button.*?<\/button>)/s, `$1<div className="flex items-center">$2</div>`);

    // Add handler
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
    code = code.replace(`if (loading) {`, handler + '\n  if (loading) {');

    // Add Modal to JSX
    const modalJSX = `
      <JsonEditorModal 
        isOpen={isJsonEditorOpen} 
        onClose={() => setIsJsonEditorOpen(false)} 
        onSave={handleBulkSave} 
        initialData={${v.var}} 
        title="${v.var.charAt(0).toUpperCase() + v.var.slice(1)}" 
      />
    </div>
  );
}`;
    code = code.replace(/<\/div>\s*<br\/>\s*<\/div>\s*\);\s*}\s*$/s, "</div>\n  );\n}"); // clean up just in case
    code = code.replace(/<\/div>\s*\);\s*}\s*$/, modalJSX);

    fs.writeFileSync(v.file, code);
  }
}
