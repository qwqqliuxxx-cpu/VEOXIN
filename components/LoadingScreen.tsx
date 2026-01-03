
import React, { useState, useEffect } from 'react';
import { LOADING_MESSAGES } from '../constants';

interface LoadingScreenProps {
  statusMessage: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  statusMessage 
}) => {
  const [funMessage, setFunMessage] = useState(LOADING_MESSAGES[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFunMessage(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl">
      <div className="w-full max-w-sm px-8 text-center">
        <div className="relative mb-12">
          {/* Main Orbiting Loader */}
          <div className="w-24 h-24 border-2 border-indigo-600/10 border-t-indigo-600 rounded-full animate-spin mx-auto relative z-10"></div>
          {/* Inner pulse */}
          <div className="absolute inset-0 w-16 h-16 bg-indigo-600/20 rounded-full blur-2xl animate-pulse mx-auto self-center"></div>
        </div>

        <h3 className="text-xl font-black uppercase tracking-tighter mb-2 text-white">正在塑造视觉奇观</h3>
        <p className="text-indigo-400 text-xs font-bold mb-8 animate-pulse uppercase tracking-widest">{funMessage}</p>
        
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2">
             <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-100"></div>
             <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-200"></div>
             <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-300"></div>
          </div>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">{statusMessage}</p>
        </div>
        
        <div className="mt-12 text-[10px] text-gray-700 font-medium leading-relaxed uppercase tracking-tighter">
          提示：高质量视频渲染约耗时 1-2 分钟<br/>
          请保持当前页面活跃以确保下载链接正确生成
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
