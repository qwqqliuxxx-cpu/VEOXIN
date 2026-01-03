
import {
  GenerateVideoParams,
  VideoMode,
  Resolution,
  AspectRatio
} from "../types";
import {
  VEO_FAST_MODEL,
  VEO_PRO_MODEL,
  AVATAR_PROMPT_ENHANCEMENT,
  VISUAL_ENHANCEMENT
} from "../constants";

export class VeoService {
  /**
   * 生成视频 - 通过后端代理调用 Google Gemini API
   */
  static async generateVideo(
    params: GenerateVideoParams,
    onProgress: (status: { message: string }) => void
  ): Promise<string> {
    console.log(">>> [VeoService] 开始单段视频生成 (固定7s):", params);

    // 根据模式选择模型
    const selectedModel = params.mode === VideoMode.REFERENCES_TO_VIDEO ? VEO_PRO_MODEL : VEO_FAST_MODEL;

    try {
      onProgress({ message: "正在提交创作指令..." });

      const config: any = {
        model: selectedModel,
        prompt: this.buildPrompt(params),
        config: {
          numberOfVideos: 1,
          resolution: params.resolution,
          aspectRatio: params.aspectRatio,
        }
      };

      // 附加特定模式参数
      if (params.mode === VideoMode.FRAMES_TO_VIDEO) {
        if (params.startFrame) config.image = { imageBytes: params.startFrame, mimeType: 'image/png' };
        if (params.endFrame) config.config.lastFrame = { imageBytes: params.endFrame, mimeType: 'image/png' };
        if (params.looping && params.startFrame) {
          config.config.lastFrame = { imageBytes: params.startFrame, mimeType: 'image/png' };
        }
      } else if (params.mode === VideoMode.REFERENCES_TO_VIDEO && params.referenceImages) {
        config.referenceImages = params.referenceImages.map(img => ({
          image: { imageBytes: img, mimeType: 'image/png' }
        }));
      }

      console.log(`>>> [VeoService] 通过代理调用，模型: ${selectedModel}, 分辨率: ${params.resolution}`);

      // 调用后端代理 API 发起视频生成
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '未知错误' }));
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
      }

      let operation = await response.json();

      // 开始轮询检查视频生成状态
      let pollCount = 0;

      while (!operation.done) {
        pollCount++;
        onProgress({ message: `渲染中 (${pollCount * 10}s)...` });
        await new Promise(resolve => setTimeout(resolve, 10000));

        // 通过代理轮询操作状态
        const pollResponse = await fetch('/api/poll-operation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ operation })
        });

        if (!pollResponse.ok) {
          const errorData = await pollResponse.json().catch(() => ({ error: '轮询失败' }));
          throw new Error(errorData.error || errorData.message || '轮询操作失败');
        }

        operation = await pollResponse.json();

        if (operation.error) {
          throw new Error(`API Error ${operation.error.code}: ${operation.error.message}`);
        }
      }

      const downloadUri = operation.response.generatedVideos[0].video.uri;

      // 通过代理下载视频
      onProgress({ message: "正在同步视频流..." });
      const videoResponse = await fetch('/api/download-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uri: downloadUri })
      });

      if (!videoResponse.ok) {
        throw new Error("视频数据同步失败");
      }

      const videoBlob = await videoResponse.blob();
      const localUrl = URL.createObjectURL(videoBlob);

      console.log(">>> [VeoService] 生成完成，本地流地址已创建");
      return localUrl;

    } catch (error: any) {
      console.error(">>> [VeoService] 生成异常:", error);
      throw error;
    }
  }

  private static buildPrompt(params: GenerateVideoParams): string {
    if (params.mode === VideoMode.AVATAR) {
      return `[SCENE: ${params.prompt}] [SCRIPT: ${params.script}] ${AVATAR_PROMPT_ENHANCEMENT}`;
    }
    return `${params.prompt}, ${VISUAL_ENHANCEMENT}`;
  }
}
