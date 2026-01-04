import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
// Node 18+ 自带 fetch，无需 import node-fetch

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
// 托管前端静态文件
app.use(express.static(path.join(__dirname, 'dist')));

// ----------------------------------------------------
// 1. 通用聊天代理 (Gemini Pro) - 保持不变或使用 fetch
// ----------------------------------------------------
app.post('/api/chat', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'No API Key set' });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Chat Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 2. 视频生成代理 (Veo) - 关键修改！改用原生 fetch
// ----------------------------------------------------
app.post('/api/generate-video', async (req, res) => {
  console.log('>>> [Proxy] 收到视频生成请求');
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'No API Key set' });

    // A. 发起生成请求
    const generateUrl = `https://generativelanguage.googleapis.com/v1beta/models/veo-2.0-generate-video-preview:predict?key=${apiKey}`;
    
    const initialResp = await fetch(generateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    if (!initialResp.ok) {
      const errText = await initialResp.text();
      throw new Error(`Google API Error: ${errText}`);
    }

    const initialData = await initialResp.json();
    console.log('>>> [Proxy] 任务已提交，操作名称:', initialData.name);

    // B. 开始轮询 (手动实现，不依赖库)
    let operation = initialData;
    const operationName = initialData.name; // 格式通常是 operations/xxxx
    
    // 简单的轮询逻辑：最多轮询 60 次，每次间隔 2 秒
    for (let i = 0; i < 60; i++) {
        if (operation.done) {
            console.log('>>> [Proxy] 视频生成完成！');
            return res.json(operation); // 返回最终结果给前端
        }

        console.log(`>>> [Proxy] 轮询中... 第 ${i+1} 次`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // 等待 2 秒

        // 查询操作状态
        const pollUrl = `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${apiKey}`;
        const pollResp = await fetch(pollUrl);
        operation = await pollResp.json();
    }

    throw new Error('Timeout: Video generation took too long.');

  } catch (error) {
    console.error('>>> [Proxy] Video Error:', error);
    res.status(500).json({ error: error.message || 'Video generation failed' });
  }
});


// ----------------------------------------------------
// 路由兜底
// ----------------------------------------------------
app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`>>> [Server] 服务器运行在端口 ${PORT}`);
  console.log(`>>> [Server] API Key 状态: ${process.env.GEMINI_API_KEY ? '已配置 ✓' : '未配置 ✗'}`);
});
