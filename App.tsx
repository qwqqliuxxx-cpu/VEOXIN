
import React, { useState, useEffect } from 'react';
import { 
  GenerateVideoParams, 
  VideoResult, 
  GenerationStatus, 
  VideoMode 
} from './types';
import { VeoService } from './services/geminiService';
import ApiKeyModal from './components/ApiKeyModal';
import LoadingScreen from './components/LoadingScreen';
import PromptForm from './components/PromptForm';
import { 
  Clapperboard, 
  History, 
  Download, 
  AlertCircle,
  Play,
  Share2,
  RefreshCw,
  Layers,
  Zap,
  Maximize2
} from 'lucide-react';

const MODE_LABELS: Record<VideoMode, string> = {
  [VideoMode.TEXT_TO_VIDEO]: '文字生成',
  [VideoMode.FRAMES_TO_VIDEO]: '首尾帧控制',
  [VideoMode.REFERENCES_TO_VIDEO]: '参考图控制',
  [VideoMode.AVATAR]: '数字人播报'
};

const App: React.FC = () => {
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [status, setStatus] = useState<GenerationStatus>({ step: 'IDLE', message: '' });
  const [history, setHistory] = useState<VideoResult[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoResult | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) setShowKeyModal(true);
    };
    checkKey();
  }, []);

  const handleGenerate = async (params: GenerateVideoParams) => {
    setStatus({ step: 'GENERATING', message: '正在初始化渲染引擎...' });
    
    try {
      const videoUrl = await VeoService.generateVideo(params, (update) => {
        setStatus(prev => ({ ...prev, message: update.message }));
      });

      const newResult: VideoResult = {
        url: videoUrl,
        params,
        timestamp: Date.now()
      };

      setHistory(prev => [newResult, ...prev]);
      setSelectedVideo(newResult);
      setStatus({ step: 'SUCCESS', message: '生成成功' });
    } catch (error: any) {
      console.error(">>> [App] 渲染失败:", error);
      let displayMessage = error.message || "由于服务器连接超时，渲染未能完成。";
      if (error.message?.includes("SAFETY")) displayMessage = "内容触发安全策略，请更换描述词。";
      if (error.message?.includes("13")) displayMessage = "服务器内部错误(Error 13)，请稍后重试。";
      
      setStatus({ step: 'ERROR', message: displayMessage });
    }
  };

  const handleDownload = (url: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `veo-studio-${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 selection:bg-indigo-600/30 overflow-hidden flex flex-col">
      {showKeyModal && <ApiKeyModal onSuccess={() => setShowKeyModal(false)} />}
      
      {status.step === 'GENERATING' && (
        <LoadingScreen statusMessage={status.message} />
      )}

      {/* Header */}
      <nav className="h-14 shrink-0 border-b border-white/5 glass sticky top-0 z-40 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-1.5 rounded-lg shadow-[0_0_15px_rgba(79,70,229,0.4)]">
            <Zap size={16} className="text-white fill-current" />
          </div>
          <h1 className="text-sm font-black tracking-tighter uppercase italic">
            Veo Studio <span className="text-indigo-500">Peak</span>
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
            <span className="text-[10px] font-black uppercase text-gray-500">Live Services</span>
          </div>
          <button 
            onClick={() => window.aistudio.openSelectKey()}
            className="text-[10px] font-black text-gray-500 hover:text-white transition-colors uppercase border border-white/10 px-3 py-1 rounded-full"
          >
            Change Key
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 overflow-hidden">
        
        {/* Left: Creator Panel */}
        <div className="lg:col-span-4 xl:col-span-4 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar pb-6">
          <div className="bg-[#0a0a0a] rounded-2xl p-6 border border-white/5 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                <Layers size={14} className="text-indigo-500" /> Workstation
              </h2>
            </div>
            <PromptForm onGenerate={handleGenerate} isLoading={status.step === 'GENERATING'} />
          </div>

          <div className="bg-[#0a0a0a] rounded-2xl p-6 border border-white/5 flex flex-col flex-1 min-h-[300px]">
             <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-4">Generation Vault</h3>
             <div className="space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                {history.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-20 grayscale">
                    <History size={32} />
                    <p className="text-[10px] mt-2 font-black uppercase tracking-widest">History Empty</p>
                  </div>
                ) : (
                  history.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedVideo(item)}
                      className={`w-full text-left p-4 rounded-xl transition-all border ${
                        selectedVideo?.timestamp === item.timestamp 
                          ? 'bg-indigo-600/10 border-indigo-600/40' 
                          : 'bg-[#0f0f0f] border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex justify-between mb-2">
                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-tighter">{MODE_LABELS[item.params.mode]}</span>
                        <span className="text-[9px] text-gray-600">{new Date(item.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed italic">"{item.params.prompt}"</p>
                    </button>
                  ))
                )}
             </div>
          </div>
        </div>

        {/* Right: Theater Preview */}
        <div className="lg:col-span-8 xl:col-span-8 flex flex-col gap-4 overflow-hidden h-full">
          <div className="flex-1 rounded-3xl border border-white/5 relative group flex flex-col bg-[#020202] shadow-[inset_0_0_100px_rgba(0,0,0,1)] overflow-hidden">
            {selectedVideo ? (
              <div className="h-full flex flex-col overflow-hidden">
                <div className="flex-1 flex items-center justify-center relative bg-gradient-to-b from-transparent to-black/20 overflow-hidden p-4">
                  <div className="relative h-full w-full flex items-center justify-center">
                    <video 
                      key={selectedVideo.url}
                      controls 
                      autoPlay
                      loop
                      playsInline
                      className={`max-h-full max-w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-lg object-contain ${
                        selectedVideo.params.aspectRatio === '9:16' ? 'h-full w-auto' : 'w-full h-auto'
                      }`}
                      src={selectedVideo.url}
                    />
                  </div>
                  
                  {/* Floating Actions */}
                  <div className="absolute top-6 right-6 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 z-10">
                    <button 
                      onClick={() => handleDownload(selectedVideo.url)}
                      className="p-3 bg-black/60 hover:bg-indigo-600 backdrop-blur-xl rounded-full text-white transition-all border border-white/10 shadow-2xl"
                      title="下载视频"
                    >
                      <Download size={18} />
                    </button>
                    <button className="p-3 bg-black/60 hover:bg-white/10 backdrop-blur-xl rounded-full text-white transition-all border border-white/10 shadow-2xl">
                      <Share2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Footer Info: Fixed Height */}
                <div className="shrink-0 p-4 lg:p-6 bg-[#0a0a0a]/90 backdrop-blur-md border-t border-white/5 z-20">
                   <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="px-2 py-0.5 bg-indigo-600/20 text-indigo-400 text-[8px] font-black rounded uppercase border border-indigo-600/30 tracking-widest shrink-0">Masterpiece Render</span>
                          <span className="text-[10px] text-gray-500 font-bold bg-white/5 px-2 py-0.5 rounded shrink-0">{selectedVideo.params.resolution} • {selectedVideo.params.aspectRatio}</span>
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-1 italic">"{selectedVideo.params.prompt}"</p>
                      </div>
                      <button 
                        onClick={() => handleDownload(selectedVideo.url)}
                        className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase rounded-lg shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                      >
                        Download MP4
                      </button>
                   </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-700 p-8">
                <div className="relative mb-6">
                   <div className="absolute inset-0 bg-indigo-600/10 rounded-full blur-[60px] animate-pulse"></div>
                   <div className="relative w-24 h-24 rounded-full border border-white/5 flex items-center justify-center">
                     <Play size={32} className="text-gray-900 translate-x-1" />
                   </div>
                </div>
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-600 mb-2">Theater Ready</h3>
                <p className="text-[10px] text-gray-700 max-w-[240px] text-center uppercase font-bold leading-relaxed">
                  请在左侧面板配置渲染参数并点击生成<br/>在此处观看您的 7s 视觉短片
                </p>
              </div>
            )}
          </div>

          {/* Footer Info Bar */}
          <div className="bg-[#0a0a0a] rounded-2xl px-6 py-4 border border-white/5 flex shrink-0 items-center justify-between shadow-xl">
            <div className="flex items-center gap-4 lg:gap-8 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-2 shrink-0">
                 <div className={`w-2 h-2 rounded-full ${status.step === 'GENERATING' ? 'bg-indigo-500 animate-pulse' : 'bg-indigo-500'}`}></div>
                 <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">Engine: <span className="text-white">Veo 3.1 Peak</span></span>
              </div>
              <div className="h-4 w-px bg-white/5 shrink-0"></div>
              {status.step === 'ERROR' ? (
                <div className="flex items-center gap-2 text-red-500 animate-in fade-in slide-in-from-left-2 shrink-0">
                   <AlertCircle size={14} />
                   <span className="text-[10px] font-black uppercase tracking-tight truncate max-w-[200px] lg:max-w-[400px]">{status.message}</span>
                   <button onClick={() => setStatus({step: 'IDLE', message: ''})} className="ml-2 hover:bg-white/5 p-1 rounded transition-colors"><RefreshCw size={10} /></button>
                </div>
              ) : (
                <div className="flex items-center gap-4 text-gray-600 shrink-0">
                   <span className="text-[10px] font-bold uppercase tracking-tighter whitespace-nowrap">API: Operational</span>
                   <span className="text-[10px] font-bold uppercase tracking-tighter whitespace-nowrap hidden sm:inline">Region: Global</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4f46e5; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default App;
