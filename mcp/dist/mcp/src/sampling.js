// src/sampling.ts — Helper para chamar o LLM via sampling do MCP
// O cliente (Claude Code) fornece o modelo — não precisamos de API key aqui.
/**
 * Chama o LLM via sampling do MCP client.
 * Use dentro de tool handlers — o handler tem acesso ao `server` via closure.
 */
export async function callLLM(server, params) {
    const result = await server.createMessage({
        messages: [
            { role: "user", content: { type: "text", text: params.user } },
        ],
        systemPrompt: params.system,
        maxTokens: params.maxTokens ?? 4000,
        temperature: params.temperature,
    });
    const content = result.content;
    if (content.type !== "text") {
        throw new Error(`Sampling retornou conteúdo tipo "${content.type}", esperado "text"`);
    }
    return content.text;
}
/**
 * Parseia resposta JSON da IA, tratando markdown fences e truncagem.
 */
export function parseJsonSafe(raw) {
    let str = raw.trim();
    // Strip markdown fences (```json ... ``` ou ``` ... ```)
    if (str.startsWith("```")) {
        str = str
            .replace(/^```(?:json)?\n?/i, "")
            .replace(/\n?```$/i, "")
            .trim();
    }
    try {
        return JSON.parse(str);
    }
    catch {
        // Tenta recuperar JSON truncado — busca o último objeto/array completo
        const lastBrace = str.lastIndexOf("}");
        const lastBracket = str.lastIndexOf("]");
        const cutAt = Math.max(lastBrace, lastBracket);
        if (cutAt > 50) {
            try {
                return JSON.parse(str.slice(0, cutAt + 1));
            }
            catch {
                // segue para erro final
            }
        }
        throw new Error("Resposta da IA com JSON inválido. Tente novamente ou reduza o escopo.");
    }
}
/**
 * Chama o LLM e já retorna JSON parseado.
 */
export async function callLLMJson(server, params) {
    const raw = await callLLM(server, params);
    return parseJsonSafe(raw);
}
//# sourceMappingURL=sampling.js.map