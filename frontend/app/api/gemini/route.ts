import { NextRequest, NextResponse } from "next/server";

interface AIModel {
  name: string;
  displayName: string;
  apiKey: string | undefined;
  handler: (message: string, raceContext?: string) => Promise<string>;
}

const GEMINI_SYSTEM_PROMPT = `You are a professional race engineer. Provide concise, technical racing advice based on the data provided.`;

const GROQ_SYSTEM_PROMPT = `You are PitIQ Pro, an elite AI race engineer with deep expertise in motorsport strategy, vehicle dynamics, and real-time race analysis. Your role is to provide:

1. **Strategic Insights**: Analyze race data, track conditions, and competitor behavior to recommend optimal strategies
2. **Technical Precision**: Use accurate racing terminology and data-driven recommendations
3. **Real-time Adaptation**: Respond to changing race conditions with immediate tactical adjustments
4. **Clear Communication**: Deliver concise, actionable advice that drivers can execute instantly
5. **Professional Tone**: Maintain the authority and expertise expected from a top-tier race engineer
6. **Data-Driven Analysis**: Leverage telemetry, historical data, and real-time metrics to inform decisions
7. **Risk Assessment**: Evaluate trade-offs and present clear risk/reward scenarios
8. **Performance Optimization**: Focus on maximizing lap time, consistency, and race outcomes

When analyzing race data:
- Prioritize safety and tire management above all else
- Consider fuel strategy and pit window optimization in detail
- Factor in track position, traffic, and weather conditions comprehensively
- Provide specific, measurable recommendations (e.g., "Increase brake bias by 0.5% front", "Target 2.3 bar tire pressure")
- Always explain the reasoning behind strategic decisions with data-backed justification
- Consider competitor strategies and potential countermeasures
- Account for track evolution, rubber buildup, and changing grip levels
- Evaluate tire degradation curves and optimal pit windows
- Assess fuel saving opportunities without compromising position

Respond professionally, concisely, and with the precision expected in high-stakes motorsport environments. Use technical terminology appropriately and provide actionable insights that can be immediately implemented.`;

const callGemini = async (message: string, raceContext?: string): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API key not configured");

  const fullMessage = raceContext
    ? `${GEMINI_SYSTEM_PROMPT}\n\nRace Context:\n${raceContext}\n\nDriver Question: ${message}`
    : `${GEMINI_SYSTEM_PROMPT}\n\nDriver Question: ${message}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: fullMessage }] }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Gemini API error: ${errorData}`);
  }

  const data = await response.json();
  if (!data.candidates?.[0]?.content?.parts) {
    throw new Error("No valid response from Gemini");
  }

  return data.candidates[0].content.parts.map((part: { text?: string }) => part.text || "").join("");
};

const callGroq = async (message: string, raceContext?: string): Promise<string> => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Groq API key not configured");

  const fullMessage = raceContext 
    ? `${raceContext}\n\nDriver Question: ${message}`
    : message;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: GROQ_SYSTEM_PROMPT },
        { role: "user", content: fullMessage },
      ],
      temperature: 0.7,
      max_tokens: 3072,
      top_p: 0.95,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Groq API error: ${errorData}`);
  }

  const data = await response.json();
  if (!data.choices?.[0]?.message?.content) {
    throw new Error("No valid response from Groq");
  }

  return data.choices[0].message.content;
};

const callDeepSeek = async (message: string, raceContext?: string): Promise<string> => {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.error("DEEPSEEK_API_KEY environment variable is not set");
      throw new Error("DeepSeek API key not configured");
    }

    const fullMessage = raceContext 
      ? `${raceContext}\n\nDriver Question: ${message}`
      : message;

    console.log("Sending request to DeepSeek API...");
    
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: GEMINI_SYSTEM_PROMPT },
          { role: "user", content: fullMessage },
        ],
        temperature: 0.7,
        max_tokens: 2048,
        stream: false,
      })
    });

    console.log(`DeepSeek API response status: ${response.status}`);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }
      
      console.error("DeepSeek API error details:", {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      
      if (response.status === 401) {
        throw new Error("DeepSeek API key is invalid or expired");
      } else if (response.status === 429) {
        throw new Error("DeepSeek API rate limit exceeded");
      } else if (response.status >= 500) {
        throw new Error("DeepSeek API server error");
      } else {
        throw new Error(`DeepSeek API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }
    }

    const data = await response.json();
    console.log("DeepSeek API response received successfully");
    
    if (!data.choices?.[0]?.message?.content) {
      console.error("Invalid response structure from DeepSeek:", data);
      throw new Error("No valid response content from DeepSeek");
    }

    return data.choices[0].message.content;

  } catch (error) {
    console.error("DeepSeek API call failed:", error);
    
    // Provide more specific error messages
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error("Network error - unable to reach DeepSeek API");
    }
    
    throw error;
  }
};

const AI_MODELS: AIModel[] = [
  {
    name: "pitiq-lightning",
    displayName: "PitIQ Flash 1.0",    
    apiKey: process.env.GROQ_API_KEY,
    handler: callGroq,
  },
  {
    name: "pitiq-pro",
    displayName: "PitIQ Pro 2.0",     
    apiKey: process.env.GEMINI_API_KEY,
    handler: callGemini,
  },
  {
    name: "pitiq-deep",
    displayName: "PitIQ Ultra 3.0",     
    apiKey: process.env.DEEPSEEK_API_KEY,
    handler: callDeepSeek,
  },
];


export async function POST(request: NextRequest) {
  try {
    const { message, raceContext, preferredModel } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Debug logging for model selection issues
    console.log("[AI] Preferred model raw:", preferredModel);
    console.log("[AI] Gemini key:", process.env.GEMINI_API_KEY ? "OK" : "Missing");
    console.log("[AI] Groq key:", process.env.GROQ_API_KEY ? "OK" : "Missing");
    console.log("[AI] DeepSeek key:", process.env.DEEPSEEK_API_KEY ? "OK" : "Missing");

    const DEFAULT_ORDER = ["pitiq-lightning", "pitiq-pro", "pitiq-deep"];

    let selectedModel = preferredModel
      ? AI_MODELS.find(m => m.name === preferredModel && m.apiKey)
      : undefined;

    if (!selectedModel) {
      selectedModel = DEFAULT_ORDER
        .map(name => AI_MODELS.find(m => m.name === name && m.apiKey))
        .find(Boolean);
    }

    if (!selectedModel) {
      return NextResponse.json(
        { 
          error: "No AI models configured",
          warning: "Please configure at least one API key (GEMINI_API_KEY, GROQ_API_KEY, or DEEPSEEK_API_KEY)"
        },
        { status: 500 }
      );
    }

    try {
      console.log(`[AI] Attempting primary model: ${selectedModel.displayName}`);
      const aiResponse = await selectedModel.handler(message, raceContext);
      
      if (aiResponse && aiResponse.trim()) {
        return NextResponse.json({ 
          response: aiResponse,
          modelUsed: selectedModel.name,
          modelDisplayName: selectedModel.displayName,
          fallbackUsed: false
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`${selectedModel.displayName} failed:`, errorMessage);
      
      console.log(`[AI] Primary model failed -> initiating fallback chain`);
      
      const failedModels: string[] = [selectedModel.displayName];
      let lastError = errorMessage;
      
      const fallbackModels = AI_MODELS.filter(m => 
        m.name !== selectedModel!.name && m.apiKey
      );

      for (const model of fallbackModels) {
        try {
          console.log(`[AI] Fallback attempt: ${model.displayName}`);
          const aiResponse = await model.handler(message, raceContext);
          
          if (aiResponse && aiResponse.trim()) {
            return NextResponse.json({ 
              response: aiResponse,
              modelUsed: model.name,
              modelDisplayName: model.displayName,
              fallbackUsed: true,
              failedModels,
              warning: `${selectedModel.displayName} failed, used ${model.displayName} as fallback`
            });
          }
        } catch (fallbackError) {
          const fallbackErrorMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
          console.error(`${model.displayName} also failed:`, fallbackErrorMessage);
          failedModels.push(model.displayName);
          lastError = fallbackErrorMessage;
        }
      }

      return NextResponse.json(
        { 
          error: "All AI models failed to respond",
          warning: `Attempted models: ${failedModels.join(" → ")} → All failed`,
          details: lastError,
          failedModels
        },
        { status: 500 }
      );
    }
  } catch (error) {
    const debug = process.env.AI_DEBUG === 'true';
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error in AI API route:', message);
    return NextResponse.json(
      {
        error: 'Internal server error',
        warning: 'An unexpected error occurred while processing your request',
        details: debug ? message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const availableModels = AI_MODELS
    .filter(m => m.apiKey)
    .map(m => ({ name: m.name, displayName: m.displayName }));

  return NextResponse.json({
    availableModels,
    defaultModel: availableModels[0]?.name || null,
  });
}
