import React, { useState } from 'react';
import { Download, Package, CheckCircle, AlertCircle } from 'lucide-react';

export function DownloadProject() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadStatus('idle');

    try {
      const response = await fetch('/project.zip');
      if (!response.ok) {
        throw new Error('Zip file not found');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'youtube-video-streaming-app.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setDownloadStatus('success');
    } catch (error) {
      console.error('Download error:', error);
      setDownloadStatus('error');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center mb-4">
        <Package className="w-6 h-6 text-purple-400 mr-3" />
        <h3 className="text-xl font-semibold text-white">Projeyi İndir</h3>
      </div>
      
      <p className="text-gray-300 mb-6">
        Tüm proje dosyalarını zip formatında indirin. Bu dosya tüm kaynak kodları, 
        bileşenleri ve yapılandırma dosyalarını içerir.
      </p>

      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
      >
        {isDownloading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>İndiriliyor...</span>
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            <span>Projeyi İndir (ZIP)</span>
          </>
        )}
      </button>

      {downloadStatus === 'success' && (
        <div className="mt-4 p-3 bg-green-900 border border-green-600 rounded-lg flex items-center">
          <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
          <span className="text-green-200">Proje başarıyla indirildi!</span>
        </div>
      )}

      {downloadStatus === 'error' && (
        <div className="mt-4 p-3 bg-red-900 border border-red-600 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
          <span className="text-red-200">İndirme sırasında hata oluştu. Lütfen tekrar deneyin.</span>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-400">
        <p className="mb-2">Zip dosyası şunları içerir:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Tüm React bileşenleri ve hooks</li>
          <li>Veritabanı mantığı ve şema</li>
          <li>TypeScript tip tanımları</li>
          <li>Tailwind CSS yapılandırması</li>
          <li>Vite yapılandırması</li>
          <li>Package.json ve bağımlılıklar</li>
        </ul>
      </div>
    </div>
  );
}