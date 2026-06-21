---
id: misc-040
difficulty: L2
category: ai-basics
subcategory: 多模态
tags:
- IO
- IOC
feynman:
  essence: 通过学习从噪声中逐步去噪来生成数据，U-Net负责预测噪声。
  analogy: 像把一杯清水（图像）搅浑成泥水（噪声），再训练魔法倒流还原清水。
  first_principle: 如何从随机噪声中逐步构建出符合真实分布的高质量图像？
  key_points:
  - 前向加噪，反向去噪
  - U-Net预测噪声并通过跳跃连接保留细节
  - 潜空间扩散大幅降低计算成本
follow_up:
- Latent Diffusion为什么比像素空间扩散快?
- DALL-E 3和Stable Diffusion有什么区别?
---

# 扩散模型(Diffusion)的前向和反向过程是什么?为什么U-Net是核心架构

- **扩散模型原理:**

- **前向过程 (加噪 / Diffusion Process):**
- 逐步向图像 $x_0$ 添加高斯噪声，直至变为纯高斯噪声 $x_T$。
- 数学公式: $x_t = \sqrt{\bar{\alpha}_t} x_0 + \sqrt{1-\bar{\alpha}_t} \epsilon$, 其中 $\epsilon \sim N(0, I)$。
- 关键特性：这是一个马尔可夫链，每一步只依赖前一步；可以使用重参数化技巧一次性从 $x_0$ 采样得到任意时刻 $t$ 的 $x_t$，无需逐步迭代。

- **反向过程 (去噪 / Reverse Process):**
- 训练神经网络 $\epsilon_\theta(x_t, t)$ 预测添加的噪声。
- 从高斯噪声 $x_T$ 开始，逐步去除预测的噪声，恢复图像 $x_0$。
- 条件概率: $p_\theta(x_{t-1} | x_t) = N(x_{t-1}; \mu_\theta(x_t, t), \Sigma_\theta(x_t, t))$。

- **U-Net 核心架构细节:**
U-Net 是扩散模型的核心（如在DDPM、Stable Diffusion中），用于预测噪声。其结构优势如下：
```text
      [文本条件 c (Cross-Attention 输入)]
              │
              ▼
    ┌───────────────────────────┐
    │       U-Net Backbone      │
    │  (Downsampling Path)      │
    │  ┌───┐ ┌───┐ ┌───┐        │ <─── 编码器：提取多尺度特征
    │  │ C │→│ C │→│ C │ ...      │   (Conv + ResBlock)
    │  └─┬─┘ └─┬─┘ └─┬─┘        │
    │    │     │     │          │
    │    └──┬──┴─────┘          │
    │       │ Skip Connection   │ <─── 跳跃连接：传递高频细节
    │       │ (拼接特征)         │     (对图像清晰度至关重要)
    │  ┌────┴────┐              │
    │  │ Middle  │              │ <─── 中间层：处理最深语义
    │  │ Block   │              │
    │  └────┬────┘              │
    │       │                   │
    │  ┌────┴────┐              │
    │  │Upsample │              │ <─── 解码器：恢复分辨率
    │  │  Path   │              │
    │  └───┬ ────┬─┘ ...        │
    └──────┼─────┼───────────────┘
           │     │
           ▼     ▼
      [时间步 t] [噪声预测 ε_θ]
       (AdaLN注入)
```

- **U-Net 为什么是核心:**
1. **全卷积结构** - 输入输出尺寸相同，适合图像到图像的映射任务。
2. **编码器-解码器结构** - 捕获不同分辨率的语义和纹理信息。
3. **跳跃连接** - 跨层拼接特征，补充U-Net下采样过程中丢失的高频细节（边缘、纹理），防止图像变模糊。
4. **时间与条件注入** - 
   - **时间嵌入**: 将 $t$ 编码为向量，通过 Adaptive Layer Norm (AdaLN) 注入每一层，告诉网络当前加噪了多少。
   - **交叉注意力**: 在ResBlock中引入 $Q=Image Feature, K,V=Text Feature$，实现文本控制图像生成（Text-to-Image）。

- **Stable Diffusion 改进 (LDM - Latent Diffusion Models):**
- **核心痛点**: 在像素空间(512x512x3)做扩散计算量太大。
- **改进方案**: 
  1. 使用预训练的 VAE (Variational Autoencoder) 将图像压缩到低维潜空间 (Latent Space, 如 64x64x4)。
  2. 在潜空间进行Diffusion过程训练，计算量降低数十倍。

- **实战案例:**
在做LoRA模型微调（如特定人脸或画风）时，我们发现直接在潜空间训练Loss很难收敛。解决方案是引入"Min-SNR Gamma策略"，根据噪声时间步 $t$ 动态调整Loss权重（对高噪步给予更高权重），使得模型在中低噪声阶段的细节生成能力显著提升，生成的文字不再乱码。

- **代码示例 (Diffusers 库使用):**
```python
from diffusers import StableDiffusionPipeline, DPMSolverMultistepScheduler
import torch

# 加载模型（实战中常使用 float16 节省显存）
pipe = StableDiffusionPipeline.from_pretrained(
    "runwayml/stable-diffusion-v1-5", torch_dtype=torch.float16
).to("cuda")

# 优化采样器
pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config)

# 生成
image = pipe(
    prompt="cyberpunk city street, neon lights, high detail",
    negative_prompt="blurry, low quality", # 负向提示抑制坏图
    num_inference_steps=20,
    guidance_scale=7.5 # CFG guidance scale，越高越遵循Prompt
).images[0]
image.save("cyberpunk.png")
```
