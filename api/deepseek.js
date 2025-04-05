const axios = require('axios');

// تخزين المحادثات لكل معرّف
const conversations = {};

const meta = {
  name: "deepseek",
  version: "0.0.1",
  description: "An API endpoint that fetches chat completions from siliconflow based on required id and query parameters",
  author: "Jr Busaco and AjiroDesu",
  method: "get",
  category: "ai",
  path: "/deepseek?id=&query="
};

async function onStart({ res, req }) {
  // استخراج المعلمات المطلوبة
  const { id, query } = req.query;
  
  // التحقق من وجود المعلمات الإلزامية
  if (!id || !query) {
    return res.status(400).json({ 
      status: false, 
      error: 'Both id and query parameters are required' 
    });
  }

  // تهيئة السجل إذا كان جديداً
  if (!conversations[id]) {
    conversations[id] = [];
  }

  // إضافة رسالة المستخدم إلى السجل
  conversations[id].push({ 
    role: 'user', 
    content: query 
  });

  // إعداد المعلمات الاختيارية
  const stream = req.query.stream === 'true';
  const model = req.query.model || 'Pro/deepseek-ai/DeepSeek-R1';
  const temperature = parseFloat(req.query.temperature) || 0.8;
  const presence_penalty = parseFloat(req.query.presence_penalty) || 0.6;
  const frequency_penalty = parseFloat(req.query.frequency_penalty) || 0.4;
  const top_p = parseFloat(req.query.top_p) || 0.9;

  // إعداد payload للطلب
  const payload = JSON.stringify({
    messages: conversations[id],
    stream,
    model,
    temperature,
    presence_penalty,
    frequency_penalty,
    top_p,
  });

  const config = {
    method: 'post',
    url: 'https://gpt.tiptopuni.com/api/siliconflow/v1/chat/completions',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Origin': 'https://gpt.tiptopuni.com',
      'Referer': 'https://gpt.tiptopuni.com/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    },
    data: payload
  };

  try {
    const response = await axios(config);
    const message = response.data.choices?.[0]?.message;
    
    // التحقق من وجود رد صالح
    if (!message?.content) {
      return res.status(500).json({ 
        status: false, 
        error: 'Invalid AI response format' 
      });
    }

    // إضافة رد المساعد إلى السجل
    conversations[id].push(message);
    
    // إرجاع الرد للمستخدم
    res.json({ 
      status: true, 
      response: message.content 
    });

  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
    res.status(500).json({ 
      status: false, 
      error: 'Failed to process request' 
    });
  }
}

module.exports = { meta, onStart };
