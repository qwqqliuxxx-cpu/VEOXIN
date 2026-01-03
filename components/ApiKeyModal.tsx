import React from 'react';
import { Key, ExternalLink } from 'lucide-react';

interface ApiKeyModalProps {
  onSuccess: () => void;
}

// Fixed: Removed local AIStudio and window.aistudio declarations to resolve
// conflict with pre-configured global types in the execution context, fixing
// duplicate identifier and identical modifier errors.

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSuccess }) => {
  const handleSelectKey = async () => {
    try {
      await window.aistudio.openSelectKey();
      // Assume success as per instructions to avoid race conditions
      onSuccess();
    } catch (error) {
      console.error("Failed to open key selection", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="glass max-w-md w-full p-8 rounded-2xl shadow-2xl text-center">
        <div className="mx-auto w-16 h-16 bg-indigo-600/20 rounded-full flex items-center justify-center mb-6">
          <Key className="text-indigo-500" size={32} />
        </div>
        <h2 className="text-2xl font-bold mb-4">需要 API 密钥</h2>
        <p className="text-gray-400 mb-8 leading-relaxed">
          Veo Studio Pro 需要您选择一个启用了结算功能的 Google Cloud 项目 API 密钥。
        </p>
        
        <button
          onClick={handleSelectKey}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 transition-colors rounded-xl font-semibold flex items-center justify-center gap-2 mb-4"
        >
          选择 API 密钥
        </button>

        <a 
          href="https://ai.google.dev/gemini-api/docs/billing" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center justify-center gap-1"
        >
          查看结算设置指南 <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
};

export default ApiKeyModal;