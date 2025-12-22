// src/utils/ai.js

/**
 * 调用 AI 生成习惯计划
 * @param {string} apiKey - 用户的 API Key
 * @param {string} userGoal - 用户输入的目标
 * @param {object} context - (可选) 上下文信息，包含 mode, currentStage, rating, reviews 等
 */
export const generateHabitPlan = async (apiKey, userGoal, context = {}) => {
    const url = "https://api.siliconflow.cn/v1/chat/completions";
    
    // 🟢 1. 系统提示词：定义严格的数据结构（双轨制：蓝/绿）
    const systemPrompt = `
      你是 LifeOS 的高级习惯规划师。
      请输出严格的 JSON 对象，不要包含 markdown 格式（如 \`\`\`json）。
      不要包含任何解释性文字。
      
      JSON 结构必须如下：
      {
        "title": "简短的目标名称 (如: 腹肌撕裂者)",
        "green": "默认的高能行动 (如: 跑步5km)",
        "blue": "默认的低能行动 (如: 散步2km)",
        "milestones": ["阶段1名称", "阶段2名称", "阶段3名称"],
        "daily_routine": [
           { "day": 1, "green": "第1天高能任务", "blue": "第1天恢复任务" },
           { "day": 2, "green": "第2天高能任务", "blue": "第2天恢复任务" },
           ... 必须严格生成 7 天的数据 ...
           { "day": 7, "green": "第7天高能任务", "blue": "第7天恢复任务" }
        ]
      }
    `;

    // 🟢 2. 用户提示词组装：根据模式和上下文调整指令
    let userMessage = "";

    // 情况 A：这是下一阶段的生成（有复盘记录）
    if (context.reviews && context.reviews.length > 0) {
        userMessage = `
        用户正在进行目标：【${userGoal}】。
        当前进度：刚完成【${context.currentStage}】。
        
        【用户反馈】
        - 难度评价：${context.rating} (Too Easy/Just Right/Too Hard)
        - 历史复盘记录（这是用户在执行过程中的真实感受）：
        ${JSON.stringify(context.reviews)}

        请根据用户的“难度评价”和“复盘记录”，为用户生成【下一阶段】的 7 天循序渐进计划。
        - 如果用户说太累/痛，请降低强度或增加休息。
        - 如果用户说太简单，请适当增加强度。
        - 保持双轨制（Green/Blue）。
        `;
    } 
    // 情况 B：这是初始生成
    else {
        const modeDesc = context.mode === 'advance' 
            ? "这是一个【进阶挑战】计划。请设计难度递增的 7 天特训，Day 1 适应，Day 7 挑战。"
            : "这是一个【日常循环】计划。请设计可持续的、强度平稳的 7 天周期表。";
            
        userMessage = `用户的目标是：${userGoal}。\n${modeDesc}\n请生成第一阶段计划。`;
    }
  
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "deepseek-ai/DeepSeek-V3", 
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage }
          ],
          temperature: 0.7
        })
      });
  
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
  
      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // 清洗数据
      const cleanJson = content.replace(/```json/g, "").replace(/```/g, "").trim();
      
      return JSON.parse(cleanJson);
    } catch (error) {
      console.error("AI Generation failed:", error);
      throw error;
    }
  };