import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import type { UploadResult } from '../types/RH';

interface UseFileUploadLogicProps {
  onUploadSuccess?: () => void; // A função é opcional
}

export const useFileUploadLogic = ({ onUploadSuccess }: UseFileUploadLogicProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prevFiles => [...prevFiles, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
    }
  });

  const removeFile = (fileToRemove: File) => {
    setFiles(prevFiles => prevFiles.filter(file => file !== fileToRemove));
  };

  const handleUpload = useCallback(async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    const token = localStorage.getItem('token');
    if (!token) {
      setUploadResult({ status: 'error', title: 'Erro de Autenticação', message: 'Por favor, faça login novamente.' });
      setIsUploading(false);
      return;
    }

    try {
      const response = await fetch('https://arraiaware-backend.onrender.com/api/rh/import/history/batch', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (response.status === 201) {
        setUploadResult({
          status: 'success',
          title: 'Importação Bem-Sucedida!',
          message: `${files.length} arquivo(s) foram enviados para processamento.`
        });
        setFiles([]);
        
        onUploadSuccess?.();

      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || `Falha no upload. Status: ${response.status}`);
      }
    } catch (error) {
      setUploadResult({
        status: 'error',
        title: 'Erro na Importação',
        message: (error as Error).message,
      });
    } finally {
      setIsUploading(false);
    }
  }, [files, onUploadSuccess]);

  return {
    files,
    isUploading,
    uploadResult,
    setUploadResult,
    getRootProps,
    getInputProps,
    isDragActive,
    removeFile,
    handleUpload,
  };
};