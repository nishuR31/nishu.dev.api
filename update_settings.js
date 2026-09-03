const fs = require('fs');
const file = 'client/src/views/SettingsView.tsx';
let code = fs.readFileSync(file, 'utf8');

// Add import
code = code.replace("import { useForm, Controller } from 'react-hook-form';", "import { useForm, Controller } from 'react-hook-form';\nimport { startRegistration } from '@simplewebauthn/browser';");

// Add handleAddPasskey
const handler = `
  const handleAddPasskey = async () => {
    try {
      // 1. Get options from server
      const optRes = await axios.post('/api/auth/passkey/generate-options');
      const options = optRes.data.data;
      
      // 2. Pass options to browser authenticator
      const attResp = await startRegistration(options);
      
      // 3. Send response to server to verify
      await axios.post('/api/auth/passkey/verify-registration', attResp);
      alert("Passkey successfully registered!");
    } catch (err: any) {
      console.error("Passkey registration failed", err);
      if (err.name === 'NotAllowedError') {
        alert('Passkey registration was cancelled or timed out.');
      } else {
        alert('Failed to register passkey: ' + (err.response?.data?.message || err.message));
      }
    }
  };
`;

code = code.replace(`const handleEnable2FA = async () => {`, handler + '\n  const handleEnable2FA = async () => {');

// Update button onClick
code = code.replace(`onClick={() => alert("Passkey backend integration pending.")}`, `onClick={handleAddPasskey}`);

fs.writeFileSync(file, code);
