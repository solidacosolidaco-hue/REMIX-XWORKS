import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy initialization for server-side Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY não configurada no servidor.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}


// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "XCanvas AI Server", time: new Date().toISOString() });
});


// AI Assistant Endpoint for Canvas Intelligence
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { prompt, canvasContext, nodes, connections } = req.body;
    const contextData = canvasContext || { nodes, connections };

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY não configurada no servidor.",
      });
    }

    const systemInstruction = `Você é o XCanvas AI, o copiloto inteligente de engenharia e gestão visual da plataforma XCanvas.
Você ajuda o usuário a:
1. Criar, modificar, estruturar e conectar objetos no canvas infinito (Clientes, Pedidos, Projetos, Ordens de Produção, Checklists, Cronômetros, Indicadores, Kanban, etc.).
2. Analisar o grafo de informações, identificar gargalos, prazos atrasados, dependências e propor melhorias.
3. Responder dúvidas sobre os dados existentes no canvas em português claro, profissional e direto.

Quando o usuário pedir para criar ou modificar objetos, você deve responder com:
- Uma explicação concisa em texto.
- Um bloco JSON delimitado por \`\`\`json { "actions": [...] } \`\`\` com instruções para o canvas (criar nós, conectar nós, atualizar propriedades, etc.).

Formato das ações de criação/modificação:
\`\`\`json
{
  "actions": [
    {
      "type": "create_node",
      "node": {
        "id": "node-generated-id",
        "type": "customer" | "order" | "project" | "checklist" | "kanban" | "deadline" | "indicator" | "note" | "text" | "group",
        "title": "Nome do Objeto",
        "subtitle": "Descrição ou subtítulo",
        "status": "Em andamento" | "Atrasado" | "Concluído" | "Aprovado",
        "assignee": "Nome do Responsável",
        "tags": ["tag1", "tag2"],
        "data": { ... campos específicos do tipo ... },
        "color": "blue" | "emerald" | "amber" | "rose" | "purple" | "slate"
      }
    },
    {
      "type": "create_connection",
      "connection": {
        "fromId": "node-1",
        "toId": "node-2",
        "label": "gerou" | "originou" | "possui" | "depende de"
      }
    }
  ]
}
\`\`\`

Se o usuário fizer apenas uma pergunta sobre os dados (ex: "Qual projeto está mais atrasado?"), analise o 'canvasContext' fornecido e responda diretamente.`;

    const contents = `Contexto atual do Canvas:
${JSON.stringify(contextData || {}, null, 2)}

Mensagem do Usuário:
${prompt}`;

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const responseText = response.text || "Sem resposta do modelo.";
    res.json({
      text: responseText,
      explanation: responseText,
    });
  } catch (error: any) {
    console.error("Erro no endpoint Gemini AI:", error);
    res.status(500).json({
      error: error?.message || "Falha ao processar solicitação com Gemini AI.",
    });
  }
});

app.post("/api/gemini/action", async (req, res) => {
  // Alias to /api/ai/chat logic
  try {
    const { prompt, canvasContext, nodes, connections } = req.body;
    const contextData = canvasContext || { nodes, connections };

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY não configurada no servidor.",
      });
    }

    const systemInstruction = `Você é o XCanvas AI, o copiloto inteligente de engenharia e gestão visual da plataforma XCanvas.`;

    const contents = `Contexto atual do Canvas:
${JSON.stringify(contextData || {}, null, 2)}

Mensagem do Usuário:
${prompt}`;

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const responseText = response.text || "Sem resposta do modelo.";
    res.json({
      text: responseText,
      explanation: responseText,
    });
  } catch (error: any) {
    console.error("Erro no endpoint Gemini AI action:", error);
    res.status(500).json({
      error: error?.message || "Falha ao processar solicitação com Gemini AI.",
    });
  }
});

// Production and Development vite serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`XCanvas Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
