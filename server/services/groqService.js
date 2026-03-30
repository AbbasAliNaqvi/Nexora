const { groq, GROQ_MODEL } = require("../config/groq");

exports.generateDocs = async (endpoints, projectName) => {
  const summary = endpoints.map((ep) => ({
    method: ep.method,
    path: ep.path,
    description: ep.description,
    mockResponse: ep.mockResponse,
    requestSchema: ep.requestSchema,
  }));

  const res = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a senior technical documentation writer. Generate clear, well-structured Markdown API documentation. Be precise and include curl examples.",
      },
      {
        role: "user",
        content: `Generate complete API documentation in Markdown for the project "${projectName}".

Endpoints:
${JSON.stringify(summary, null, 2)}

Include for each endpoint:
- Description
- HTTP method and path  
- Request body/params schema
- Response example
- cURL command
- Possible error codes

Add an overview section and a quick-start guide at the top.`,
      },
    ],
    max_tokens: 4000,
    temperature: 0.3,
  });

  return res.choices[0].message.content;
};

exports.analyzeHealth = async (usageData, projectName) => {
  const res = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are an API reliability engineer. Analyze usage data and return ONLY valid JSON with no markdown, no backticks, no preamble.",
      },
      {
        role: "user",
        content: `Analyze this API usage data for project "${projectName}":

${JSON.stringify(usageData, null, 2)}

Return ONLY this exact JSON structure:
{
  "healthScore": <number 0-100>,
  "status": "healthy" | "warning" | "critical",
  "summary": "<2 sentence summary>",
  "issues": [{ "severity": "high"|"medium"|"low", "title": "...", "detail": "..." }],
  "recommendations": [{ "priority": "high"|"medium"|"low", "title": "...", "action": "..." }],
  "highlights": [{ "label": "...", "value": "..." }]
}`,
      },
    ],
    max_tokens: 1500,
    temperature: 0.2,
  });

  const raw = res.choices[0].message.content.trim();
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("AI returned malformed JSON for health report.");
  }
};

exports.chatAssistant = async (messages, projectContext) => {
  const systemPrompt = `You are Nexora AI, an expert assistant for developers managing APIs on the Nexora platform.
You help with API design, debugging, usage analysis, rate limiting, and best practices.
Be concise, practical, and developer-friendly. Use markdown formatting in your responses.
${projectContext ? `\nCurrent project context:\n${JSON.stringify(projectContext, null, 2)}` : ""}`;

  const res = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    max_tokens: 1000,
    temperature: 0.7,
  });

  return res.choices[0].message.content;
};

exports.generateCrudPlan = async (prompt) => {
  const res = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You design CRUD APIs. Return ONLY valid JSON with a resource name, collection name, and fields. No markdown.",
      },
      {
        role: "user",
        content: `Generate a CRUD API plan from this request:\n\n${prompt}\n\nReturn only this JSON shape:\n{\n  "resourceName": "users",\n  "collectionName": "users",\n  "fields": [\n    { "key": "name", "type": "text", "required": true },\n    { "key": "email", "type": "email", "required": true }\n  ],\n  "summary": "short description"\n}`,
      },
    ],
    max_tokens: 700,
    temperature: 0.2,
  });

  const raw = res.choices[0].message.content.trim();
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("AI returned malformed CRUD plan JSON.");
  }
};
