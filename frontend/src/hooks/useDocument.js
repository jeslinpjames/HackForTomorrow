import { useState } from 'react';

export const useDocument = () => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [response, setResponse] = useState('');

  const uploadDocument = async (file) => {
    setStatus('Uploading document...');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();

      if (data.status === 'success') {
        setFile(file);
        return { success: true, message: 'Document uploaded successfully' };
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      return { success: false, message: `Upload failed: ${error.message}` };
    }
  };

  const queryDocument = async (query) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await response.json();
      
      if (data.status === 'success') {
        return { success: true, response: data.response };
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      return { success: false, message: `Query failed: ${error.message}` };
    }
  };

  const summarizeDocument = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/summarize`, {
        method: 'POST'
      });
      const data = await response.json();

      if (data.status === 'success') {
        return { success: true, summary: data.summary };
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      return { success: false, message: `Summary failed: ${error.message}` };
    }
  };

  return {
    file,
    status,
    response,
    setStatus,
    setResponse,
    uploadDocument,
    queryDocument,
    summarizeDocument
  };
};
