import { Download, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function AuditLogDownloader() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setIsLoading(true);
    setError(null);

    const token = localStorage.getItem('token');
    if (!token) {
        setError("Autenticação necessária.");
        setIsLoading(false);
        return;
    }

    try {
      const response = await fetch('https://arraiaware-backend.onrender.com/api/audit-logs/export', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`Erro na rede: ${response.statusText}`);
      }

      const csvString = await response.text();
      
      if (!csvString) {
        setError("Não há dados de auditoria para exportar.");
        setIsLoading(false);
        return;
      }
      
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;

      link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (err: unknown) {
      console.error("Falha ao baixar os logs:", err);
      if (err instanceof SyntaxError) {
        setError("Ocorreu um erro ao processar os dados. Tente novamente.");
      } else {
        setError("Não foi possível baixar os logs. Tente novamente mais tarde.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-8 p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
      <h2 className="text-xl font-semibold text-gray-800">Logs de Auditoria</h2>
      <p className="text-gray-600 mt-2">
        Baixe o arquivo completo com todos os registros de auditoria do sistema.
        O arquivo será gerado no formato <strong>CSV</strong>.
      </p>

      <div className="mt-6">
        <button
          onClick={handleDownload}
          disabled={isLoading}
          className="inline-flex items-center justify-center px-4 py-2 font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Baixando...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Baixar Logs de Auditoria
            </>
          )}
        </button>
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-600 bg-red-100 p-3 rounded-md">
          {error}
        </p>
      )}
    </div>
  );
}