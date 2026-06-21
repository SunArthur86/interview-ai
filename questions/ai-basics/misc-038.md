---
id: misc-038
difficulty: L2
category: ai-basics
subcategory: 多模态
feynman:
  essence: 通过对比学习打通图像与文本的语义空间，实现跨模态理解。
  analogy: 像训练翻译官，把“猫”的图片和“猫”这个词拉进同一个房间，把“狗”赶出去。
  first_principle: 如何让计算机理解图像内容并关联自然语言的语义概念？
  key_points:
  - 双塔架构分别编码图像和文本
  - 使用对比损失对齐正样本
  - 通过文本描述实现零样本分类
follow_up:
- CLIP的文本编码器和图像编码器维度如何对齐?
- SigLIP相比CLIP有什么改进?
---

# CLIP的原理是什么?为什么它能实现零样本图像分类

- **CLIP (Contrastive Language-Image Pre-training):**

- **核心思想:** 用对比学习将图像和文本对齐到同一向量空间. 在联合空间中，匹配的图文对距离近，不匹配的图文对距离远。

- **架构与训练流程:**
```text
   Batch N 对 (图像 I_i, 文本 T_i)
             │
    ┌────────┴────────┐
    ▼                 ▼
[Image Encoder]   [Text Encoder]
(ViT / ResNet)     (Transformer)
    │                 │
    ▼                 ▼
[Image Embedding] [Text Embedding]
(I_i ∈ R^d)       (T_i ∈ R^d)
    │                 │
    └────────┬────────┘
             ▼
   [计算余弦相似度矩阵 (N x N)]
             │
             ▼
      [Cross Entropy Loss]
   (行方向匹配图像，列方向匹配文本)
```

- **训练细节:**
1. **双编码器结构** - 图像编码器(ViT/ResNet) 和 文本编码器(Text Transformer)，各自独立提取特征。
2. **对比学习目标** - 对Batch中N对(图像,文本)，正样本对相似度高，负样本对相似度低。
3. **InfoNCE Loss (对称损失)** - 同时优化"以图找文"和"以文找图"两个方向的分类准确率。
   $$L = -1/N \sum [\log \frac{\exp(sim(I_i, T_i)/\tau)}{\sum_j \exp(sim(I_i, T_j)/\tau)} + \log \frac{\exp(sim(T_i, I_i)/\tau)}{\sum_j \exp(sim(T_i, I_j)/\tau)}]$$
   其中 $\tau$ 是温度参数，用于控制分布的锐度。

- **零样本分类:**
1. **Prompt Engineering** - 将所有类别名构造成文本提示，如:"A photo of a {dog}", "A photo of a {cat}"。
2. **编码文本** - 编码所有类别文本，得到类别向量中心。
3. **编码图像** - 编码输入图像。
4. **相似度计算** - 计算图像向量与所有类别向量的余弦相似度，选分值最高的类别。

- **影响:**
- CLIP的图像编码器成为无数多模态模型的视觉骨干
- LLaVA/BLIP-2/Flamingo等VLM都使用CLIP ViT作为视觉编码器
- 推动了视觉-语言多模态预训练的范式转移

- **实战案例:**
在做电商SKU质检时，我们没收集任何缺陷样本，直接用CLIP做零样本分类：将"A photo of damaged packaging"、"A photo of scratched surface"作为类别Prompt，直接识别流水线上的次品，上线第一天就拦截了85%的明显缺陷，省去了数千张样本标注成本。

- **代码示例 (Zero-shot Prediction):**
```python
import torch
import clip
from PIL import Image

# 加载模型
device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load("ViT-B/32", device=device)

# 准备类别Prompt (Prompt Engineering是关键)
text_inputs = torch.cat([clip.tokenize(f"A photo of a {c}") for c in ["dog", "cat", "car"]]).to(device)

# 推理
image = preprocess(Image.open("dog.jpg")).unsqueeze(0).to(device)
with torch.no_grad():
    image_features = model.encode_image(image)
    text_features = model.encode_text(text_inputs)
    
    # 计算相似度
    logits_per_image = (100.0 * image_features @ text_features.T).softmax(dim=-1)
    probs = logits_per_image.cpu().numpy()
```

## 常见考点
1. **CLIP为何能做零样本分类？** 
   因为在预训练阶段，CLIP已经学习到了图像内容和文本语义之间的对应关系。通过构造"A photo of..."这样的文本，模型能理解未知类别的语义含义。
2. **CLIP的局限性是什么？** 
   对细粒度分类（如区分不同车型）、抽象概念理解、OCR文字识别等方面表现较弱；且对训练数据分布外的新数据泛化性有挑战。
3. **Temperature参数 $\tau$ 的作用？** 
   控制 softmax 分布的平滑程度。较小的 $\tau$ 使分布更尖锐，更关注难分样本；较大的 $\tau$ 使分布更平滑，有助于优化。
