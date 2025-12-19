// src/utils/ai.js

// 硅基流动 (SiliconFlow) 的 API 地址
const API_URL = "https://api.siliconflow.cn/v1/chat/completions"; 

// 使用的模型: DeepSeek-V3 (目前硅基流动上免费且最强)
const MODEL_NAME = "deepseek-ai/DeepSeek-V3"; 

export const generateHabitPlan = async (apiKey, userPrompt) => {
  if (!apiKey) throw new Error("请先在设置中填写 SiliconFlow API Key");

  const systemPrompt = `
  你是一个专业的习惯养成规划师。请根据用户的目标，制定一个"能量管理计划"。
  
  必须严格按照以下 JSON 格式返回数据，不要包含任何 Markdown 标记(如 \`\`\`json)或额外文字，直接返回纯 JSON 字符串：
  {
    "title": "简短的目标名称(如: 减脂)",
    "green": "高能量日的挑战性任务(具体动作+时长)",
    "blue": "低能量日的保底任务(极其简单+时长)",
    "milestones": ["第1-2天里程碑", "第3-5天里程碑", "第6-7天里程碑"]
  }
  `;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: MODEL_NAME, 
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        // 硅基流动部分模型对 json_object 支持不一，为了稳妥，我们通过 Prompt 强约束，这里暂时去掉强制参数
        // response_format: { type: "json_object" } 
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || "AI 请求失败");
    }

    const data = await response.json();
    let content = data.choices[0].message.content;

    // 清洗数据：防止 AI 有时候还是会带 ```json 前缀
    content = content.replace(/```json/g, "").replace(/```/g, "").trim();

    return JSON.parse(content);

  } catch (error) {
    console.error("AI Error:", error);
    throw new Error("生成失败: " + (error.message || "请检查 Key 是否正确"));
  }
};