
import React, { useState } from 'react';
import { VideoMode, GenerateVideoParams, Resolution, AspectRatio } from '../types';
import { 
  Sparkles, 
  Settings2, 
  Type, 
  Image as ImageIcon, 
  Video, 
  UserSquare2,
  ChevronDown,
  Clock,
  Layout,
  Monitor
} from 'lucide-react';

interface PromptFormProps {
  onGenerate: (params: GenerateVideoParams) => void;
  isLoading: boolean;
}

const MODE_LABELS: Record<VideoMode, string> = {
  [VideoMode.TEXT_TO_VIDEO]: '文字生成',
  [VideoMode.FRAMES_TO_VIDEO]: '首尾帧',
  [VideoMode.REFERENCES_TO_VIDEO]: '参考图',
  [VideoMode.AVATAR]: '数字人'
};

const PromptForm: React.FC<PromptFormProps> = ({ onGenerate, isLoading }) => {
  const [params, setParams] = useState<GenerateVideoParams>({
    mode: VideoMode.TEXT_TO_VIDEO,
    prompt: '',
    script: '',
    aspectRatio: '9:16', // 默认 9:16
    resolution: '720p', // 默认 720p
    duration: 7,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'startFrame' | 'endFrame' | 'referenceImages') => {
    const files = e.target.files;
    if (!files) return;

    if (field === 'referenceImages') {
      const filesArray = Array.from(files) as File[];
      const bases = await Promise.all(filesArray.slice(0, 3).map(file => fileToBase64(file)));
      setParams(p => ({ ...p, referenceImages: bases }));
    } else {
      const base = await fileToBase64(files[0]);
      setParams(p => ({ ...p, [field]: base }));
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]);
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Mode Switcher */}
      <div className="flex bg-gray-900/50 p-1 rounded-xl glass border border-white/5">
        {(Object.keys(VideoMode) as Array<keyof typeof VideoMode>).map((modeKey) => {
          const modeValue = VideoMode[modeKey];
          return (
            <button
              key={modeKey}
              onClick={() => setParams(p => ({ ...p, mode: modeValue }))}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                params.mode === modeValue 
                  ? 'bg-indigo-600 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {modeValue === VideoMode.TEXT_TO_VIDEO && <Type size={14} />}
              {modeValue === VideoMode.FRAMES_TO_VIDEO && <Video size={14} />}
              {modeValue === VideoMode.REFERENCES_TO_VIDEO && <ImageIcon size={14} />}
              {modeValue === VideoMode.AVATAR && <UserSquare2 size={14} />}
              <span>{MODE_LABELS[modeValue]}</span>
            </button>
          );
        })}
      </div>

      {/* Main Input */}
      <div className="space-y-4">
        <div className="relative">
          <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2 block">
            {params.mode === VideoMode.AVATAR ? '视觉场景描述' : '创作提示词'}
          </label>
          <textarea
            value={params.prompt}
            onChange={(e) => setParams(p => ({ ...p, prompt: e.target.value }))}
            placeholder={params.mode === VideoMode.AVATAR ? "描述演播室背景、主播外观等..." : "例如：一个赛博朋克风格的繁华都市，霓虹灯闪烁..."}
            className="w-full bg-gray-900/80 border border-gray-800 rounded-xl p-4 min-h-[140px] focus:ring-1 focus:ring-indigo-600 outline-none transition-all text-gray-200 placeholder:text-gray-600"
          />
        </div>

        {params.mode === VideoMode.AVATAR && (
          <div className="animate-in slide-in-from-top-2 duration-300">
            <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2 block">播报脚本</label>
            <textarea
              value={params.script}
              onChange={(e) => setParams(p => ({ ...p, script: e.target.value }))}
              placeholder="输入需要同步播报的文字内容..."
              className="w-full bg-gray-900/80 border border-gray-800 rounded-xl p-4 min-h-[100px] focus:ring-1 focus:ring-indigo-600 outline-none text-gray-200 placeholder:text-gray-600"
            />
          </div>
        )}

        {/* Mode-specific file inputs */}
        {params.mode === VideoMode.FRAMES_TO_VIDEO && (
          <div className="grid grid-cols-2 gap-3 animate-in fade-in duration-500">
            <div className="p-3 bg-gray-900/50 rounded-xl border border-gray-800">
              <span className="text-[10px] font-bold text-gray-500 block mb-2 uppercase">起始帧</span>
              <input type="file" onChange={(e) => handleFileChange(e, 'startFrame')} className="text-[10px] w-full text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-indigo-600/20 file:text-indigo-400" />
            </div>
            <div className="p-3 bg-gray-900/50 rounded-xl border border-gray-800">
              <span className="text-[10px] font-bold text-gray-500 block mb-2 uppercase">结束帧</span>
              <input type="file" onChange={(e) => handleFileChange(e, 'endFrame')} className="text-[10px] w-full text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-indigo-600/20 file:text-indigo-400" />
            </div>
          </div>
        )}

        {params.mode === VideoMode.REFERENCES_TO_VIDEO && (
          <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800 animate-in fade-in duration-500">
            <span className="text-[10px] font-bold text-gray-500 block mb-2 uppercase">参考图 (资产控制)</span>
            <input type="file" multiple onChange={(e) => handleFileChange(e, 'referenceImages')} className="text-[10px] w-full text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-indigo-600/20 file:text-indigo-400" />
          </div>
        )}
      </div>

      {/* Advanced Panel */}
      <button 
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-gray-500 hover:text-indigo-400 transition-colors"
      >
        <Settings2 size={14} />
        规格配置
        <ChevronDown size={12} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
      </button>

      {showAdvanced && (
        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-gray-900/40 border border-gray-800 animate-in slide-in-from-top-2 duration-300">
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1"><Layout size={10}/> 画幅</label>
            <div className="flex gap-2">
              {['16:9', '9:16'].map(ratio => (
                <button
                  key={ratio}
                  onClick={() => setParams(p => ({ ...p, aspectRatio: ratio as AspectRatio }))}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-bold border ${
                    params.aspectRatio === ratio ? 'bg-indigo-600/20 border-indigo-600 text-indigo-400' : 'border-gray-800 text-gray-500'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1"><Monitor size={10}/> 分辨率</label>
            <div className="flex gap-2">
              {['720p', '1080p'].map(res => (
                <button
                  key={res}
                  onClick={() => setParams(p => ({ ...p, resolution: res as Resolution }))}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-bold border ${
                    params.resolution === res ? 'bg-indigo-600/20 border-indigo-600 text-indigo-400' : 'border-gray-800 text-gray-500'
                  }`}
                >
                  {res}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Status Info */}
      <div className="flex items-center gap-3 p-3 bg-indigo-600/5 rounded-xl border border-indigo-600/10">
        <Clock size={14} className="text-indigo-500" />
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          预设时长: <span className="text-indigo-400">~7.0 Seconds</span> (单段峰值)
        </span>
      </div>

      <button
        disabled={isLoading || !params.prompt}
        onClick={() => onGenerate(params)}
        className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-xl ${
          isLoading || !params.prompt
            ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white transform active:scale-95'
        }`}
      >
        {isLoading ? <span className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white" /> : <Sparkles size={18} />}
        {isLoading ? '正在构思渲染中...' : '启动视觉渲染'}
      </button>
    </div>
  );
};

export default PromptForm;
