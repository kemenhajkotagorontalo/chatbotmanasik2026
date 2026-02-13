
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, X, FileJson, Loader2, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { URLGroup } from '../types';

interface KnowledgeBaseManagerProps {
  urls: string[];
  onAddUrl: (url: string) => void;
  onImportUrls: (urls: string[]) => void;
  onRemoveUrl: (url: string) => void;
  maxUrls?: number;
  urlGroups: URLGroup[];
  activeUrlGroupId: string;
  onSetGroupId: (id: string) => void;
  onCloseSidebar?: () => void;
}

const KnowledgeBaseManager: React.FC<KnowledgeBaseManagerProps> = ({ 
  urls, 
  onAddUrl, 
  onImportUrls,
  onRemoveUrl, 
  maxUrls = 20,
  urlGroups,
  activeUrlGroupId,
  onSetGroupId,
  onCloseSidebar,
}) => {
  const [currentUrlInput, setCurrentUrlInput] = useState('');
  const [jsonUrlInput, setJsonUrlInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isValidUrl = (urlString: string): boolean => {
    if (!urlString || typeof urlString !== 'string') return false;
    try {
      const trimmed = urlString.trim();
      const url = new URL(trimmed);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (e) {
      return false;
    }
  };

  const handleAddUrl = (manualUrl?: string) => {
    const urlToUse = (manualUrl || currentUrlInput).trim();
    if (!urlToUse) {
      setError('URL tidak boleh kosong.');
      return;
    }
    if (!isValidUrl(urlToUse)) {
      setError('Format URL tidak valid. Gunakan http:// atau https://');
      return;
    }
    if (urls.length >= maxUrls) {
      setError(`Maksimum ${maxUrls} URL telah tercapai untuk grup ini.`);
      return;
    }
    if (urls.includes(urlToUse)) {
      setError('URL ini sudah ada di dalam daftar.');
      return;
    }
    onAddUrl(urlToUse);
    setCurrentUrlInput('');
    setError(null);
    showTempSuccess('Sumber data berhasil ditambahkan');
  };

  const showTempSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const extractUrls = (data: any): string[] => {
    const foundUrls: string[] = [];
    
    const walk = (node: any) => {
      if (node === null || node === undefined) return;
      
      if (typeof node === 'string') {
        const trimmed = node.trim();
        if (isValidUrl(trimmed) && trimmed.length > 10) { 
          foundUrls.push(trimmed);
        }
      } else if (Array.isArray(node)) {
        node.forEach(item => walk(item));
      } else if (typeof node === 'object') {
        Object.values(node).forEach(val => walk(val));
      }
    };

    walk(data);
    return Array.from(new Set(foundUrls));
  };

  const handleImportFromJson = async () => {
    const targetUrl = jsonUrlInput.trim();
    if (!targetUrl) {
      setError('URL JSON tidak boleh kosong.');
      return;
    }
    if (!isValidUrl(targetUrl)) {
      setError('Format URL tidak valid.');
      return;
    }

    setIsImporting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(targetUrl, { 
        cache: 'no-store',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Gagal mengambil file: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const importedUrls = extractUrls(data);

      if (importedUrls.length > 0) {
        onImportUrls(importedUrls);
        showTempSuccess(`${importedUrls.length} URL berhasil diimpor`);
      } else {
        // Fallback: Jika tidak ada link di dalam JSON, tambahkan file JSON itu sendiri
        // Ini memperbaiki error yang Anda alami
        if (urls.includes(targetUrl)) {
          throw new Error('File data ini sudah ada di dalam daftar.');
        }
        if (urls.length >= maxUrls) {
          throw new Error(`Grup penuh (Maksimum ${maxUrls} URL).`);
        }
        onAddUrl(targetUrl);
        showTempSuccess('File JSON ditambahkan sebagai sumber data tunggal');
      }
      
      setJsonUrlInput('');
      setError(null);
    } catch (err: any) {
      console.error("KnowledgeBase Import error:", err);
      setError(err.message || "Gagal mengimpor data.");
    } finally {
      setIsImporting(false);
    }
  };

  const activeGroupName = urlGroups.find(g => g.id === activeUrlGroupId)?.name || "Grup";

  return (
    <div className="p-4 bg-[#1E1E1E] shadow-md rounded-xl h-full flex flex-col border border-[rgba(255,255,255,0.05)]">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold text-[#E2E2E2]">Knowledge Base</h2>
        {onCloseSidebar && (
          <button
            onClick={onCloseSidebar}
            className="p-1 text-[#A8ABB4] hover:text-white rounded-md hover:bg-white/10 transition-colors md:hidden"
          >
            <X size={24} />
          </button>
        )}
      </div>
      
      <div className="mb-4">
        <label className="block text-xs font-medium text-[#A8ABB4] mb-1.5 uppercase tracking-wider">
          Workspace Aktif
        </label>
        <div className="relative w-full">
          <select
            value={activeUrlGroupId}
            onChange={(e) => onSetGroupId(e.target.value)}
            className="w-full py-2 pl-3 pr-8 appearance-none border border-[rgba(255,255,255,0.1)] bg-[#2C2C2C] text-[#E2E2E2] rounded-md focus:ring-1 focus:ring-white/20 text-sm cursor-pointer"
          >
            {urlGroups.map(group => (
              <option key={group.id} value={group.id}>{group.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A8ABB4] pointer-events-none" />
        </div>
      </div>

      <div className="space-y-4 mb-4">
        <div className="bg-[#2C2C2C]/50 p-3 rounded-lg border border-white/5">
          <label className="block text-xs font-semibold text-white mb-2 uppercase tracking-wide flex items-center gap-1.5">
            <Plus size={14} className="text-blue-400" /> Tambah Sumber Data
          </label>
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={currentUrlInput}
              onChange={(e) => setCurrentUrlInput(e.target.value)}
              placeholder="Paste link JSON/Dataset/PDF"
              className="flex-grow h-9 py-1 px-3 border border-white/10 bg-[#1E1E1E] text-[#E2E2E2] placeholder-[#555] rounded-lg focus:ring-1 focus:ring-blue-500/50 text-sm"
              onKeyPress={(e) => e.key === 'Enter' && handleAddUrl()}
            />
            <button
              onClick={() => handleAddUrl()}
              disabled={urls.length >= maxUrls}
              className="h-9 w-9 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:bg-gray-700 flex items-center justify-center shadow-lg"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        <div className="bg-white/5 p-3 rounded-lg border border-white/5">
          <label className="block text-xs font-medium text-[#A8ABB4] mb-2 uppercase tracking-wider flex items-center gap-1.5">
            <FileJson size={14} /> Impor Massal JSON
          </label>
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={jsonUrlInput}
              onChange={(e) => setJsonUrlInput(e.target.value)}
              placeholder="Link sitemap.json atau daftar link"
              className="flex-grow h-9 py-1 px-3 border border-white/5 bg-[#1E1E1E] text-[#E2E2E2] placeholder-[#555] rounded-lg text-sm"
              onKeyPress={(e) => e.key === 'Enter' && handleImportFromJson()}
            />
            <button
              onClick={handleImportFromJson}
              disabled={isImporting || urls.length >= maxUrls}
              className="h-9 w-9 bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center justify-center transition-all shadow-md"
            >
              {isImporting ? <Loader2 size={16} className="animate-spin" /> : <FileJson size={16} />}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-200 leading-relaxed font-medium">{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-4 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-green-200 leading-relaxed font-medium">{successMessage}</p>
          </div>
        </div>
      )}
      
      <div className="flex-grow overflow-y-auto space-y-2 chat-container">
        <div className="flex items-center justify-between sticky top-0 bg-[#1E1E1E] py-2 z-10 border-b border-white/5 mb-1">
          <h3 className="text-xs font-semibold text-[#A8ABB4] uppercase tracking-wider">
            Sumber Data Terpasang ({urls.length})
          </h3>
          {urls.length > 0 && (
            <div className="flex items-center text-[10px] text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/20">
              <Info size={10} className="mr-1" /> Aktif
            </div>
          )}
        </div>
        
        {urls.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 opacity-30">
            <FileJson size={32} className="mb-2" />
            <p className="text-center text-sm italic">Belum ada sumber data.<br/>Masukkan link di atas.</p>
          </div>
        )}
        
        {urls.map((url) => (
          <div key={url} className="flex items-center justify-between p-2.5 bg-[#2C2C2C] border border-white/5 rounded-lg hover:border-blue-500/30 transition-all group">
            <div className="flex flex-col min-w-0 flex-grow">
              <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest truncate">
                {url.split('.').pop()?.toUpperCase() === 'JSON' ? 'DATABASE' : 'DOCUMENT'}
              </span>
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 hover:underline truncate pr-2">
                {url}
              </a>
            </div>
            <button 
              onClick={() => onRemoveUrl(url)}
              className="p-2 text-gray-600 hover:text-red-400 rounded-md hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KnowledgeBaseManager;
