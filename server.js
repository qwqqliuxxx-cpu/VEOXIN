import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { GoogleGenAI, VideoGenerationReferenceType } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 视频生成 API 端点
app.post('/api/generate-video', async (req, res) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                error: 'GEMINI_API_KEY 环境变量未设置',
                message: '服务器配置错误，请联系管理员'
            });
        }

        const { model, prompt, config, image, referenceImages } = req.body;

        console.log('>>> [Proxy] 开始视频生成请求');

        const ai = new GoogleGenAI({ apiKey });

        // 构建请求配置
        const requestConfig = {
            model,
            prompt,
            config
        };

        // 添加可选参数
        if (image) requestConfig.image = image;
        if (referenceImages) {
            requestConfig.config.referenceImages = referenceImages.map(ref => ({
                image: ref.image,
                referenceType: VideoGenerationReferenceType.ASSET
            }));
        }

        // 发起视频生成
        let operation = await ai.models.generateVideos(requestConfig);

        // 返回初始操作状态
        res.json({
            name: operation.name,
            done: operation.done,
            error: operation.error,
            response: operation.response
        });

    } catch (error) {
        console.error('>>> [Proxy] 视频生成错误:', error);
        res.status(500).json({
            error: error.message || '视频生成失败',
            message: '请求处理失败，请稍后重试'
        });
    }
});

// 轮询操作状态端点
app.post('/api/poll-operation', async (req, res) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                error: 'GEMINI_API_KEY 环境变量未设置'
            });
        }

        const { operation } = req.body;

        console.log('>>> [Proxy] 轮询操作状态');

        const ai = new GoogleGenAI({ apiKey });
        const currentOp = await ai.operations.getVideosOperation({ operation });

        res.json({
            name: currentOp.name,
            done: currentOp.done,
            error: currentOp.error,
            response: currentOp.response
        });

    } catch (error) {
        console.error('>>> [Proxy] 轮询错误:', error);
        res.status(500).json({
            error: error.message || '轮询操作失败'
        });
    }
});

// 下载视频端点
app.post('/api/download-video', async (req, res) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                error: 'GEMINI_API_KEY 环境变量未设置'
            });
        }

        const { uri } = req.body;

        console.log('>>> [Proxy] 下载视频:', uri);

        // 通过代理下载视频
        const response = await fetch(`${uri}&key=${apiKey}`);

        if (!response.ok) {
            throw new Error('视频下载失败');
        }

        // 转发视频流
        res.setHeader('Content-Type', 'video/mp4');
        response.body.pipe(res);

    } catch (error) {
        console.error('>>> [Proxy] 下载错误:', error);
        res.status(500).json({
            error: error.message || '视频下载失败'
        });
    }
});

// 静态文件服务
app.use(express.static(join(__dirname, 'dist')));

// Catch-all 路由 - 支持客户端路由
app.get(/(.*)/, (req, res) => {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`>>> [Server] 服务器运行在端口 ${PORT}`);
    console.log(`>>> [Server] API Key 状态: ${process.env.GEMINI_API_KEY ? '已配置 ✓' : '未配置 ✗'}`);
});
