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
// 1. 通用聊天代理 (Gemini Pro)
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
// 2. 视频生成代理 (Veo) - 已修复数据格式问题
// ----------------------------------------------------
app.post('/api/generate-video', async (req, res) => {
  console.log('>>> [Proxy] 收到视频生成请求');
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'No API Key set' });

    // 1. 从前端获取原始数据
    const { prompt, config } = req.body;

    // 2. 构造 Google 需要的格式 (REST API 标准格式)
    // Google 要求必须把 prompt 放在 instances 里，把配置放在 parameters 里
    const googlePayload = {
        instances: [
            { prompt: prompt }
        ],
        parameters: config || {} // 把前端传来的 config (如宽高比) 放入 parameters
    };

    console.log('>>> [Proxy] 正在转发请求给 Google...');

    // A. 发起生成请求
    const generateUrl = `https://generativelanguage.googleapis.com/v1beta/models/veo-2.0-generate-video-preview:predict?key=${apiKey}`;
    
    const initialResp = await fetch(generateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(googlePayload) // <--- 这里发送包装后的数据
    });

    if (!initialResp.ok) {
      const errText = await initialResp.text();
      console.error('>>> [Proxy] Google API 报错:', errText);
      throw new Error(`Google API Error: ${errText}`);
    }

    const initialData = await initialResp.json();
    console.log('>>> [Proxy] 任务已提交，操作名称:', initialData.name);

    // B. 开始轮询
    let operation = initialData;
    const operationName = initialData.name; 
    
    // 轮询逻辑：最多 60 次，每次 2 秒
    for (let i = 0; i < 60; i++) {
        // 如果 response 里包含 error 字段，说明生成失败
        if (operation.error) {
            throw new Error(JSON.stringify(operation.error));
        }

        // 如果 done 为 true，说明完成
        if (operation.done) {
            console.log('>>> [Proxy] 视频生成完成！');
            // 注意：API 返回的结果通常在 response 字段里
            // 我们直接把整个 operation 返回给前端，让前端去解析 output uri
            return res.json(operation); 
        }

        console.log(`>>> [Proxy] 轮询中... 第 ${i+1} 次`);
        await new Promise(resolve => setTimeout(resolve, 2000)); 

        // 查询状态
        const pollUrl = `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${apiKey}`;
        const pollResp = await fetch(pollUrl);
        operation = await pollResp.json();
    }

    throw new Error('Timeout: Video generation took too long.');

  } catch (error) {
    console.error('>>> [Proxy] Video Process Error:', error);
    res.status(500).json({ error: error.message || 'Video generation failed' });
  }
});


// ----------------------------------------------------
// 路由兜底
// ----------------------------------------------------
app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// 绑定 0.0.0.0
app.listen(PORT, '0.0.0.0', () => {
  console.log(`>>> [Server] 服务器运行在端口 ${PORT}`);
  console.log(`>>> [Server] API Key 状态: ${process.env.GEMINI_API_KEY ? '已配置 ✓' : '未配置 ✗'}`);
});
