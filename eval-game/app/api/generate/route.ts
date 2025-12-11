import { generateText } from 'ai';
// Providers are auto-loaded by 'ai' when using string identifiers if installed:
// @ai-sdk/openai, @ai-sdk/anthropic, @ai-sdk/google, @ai-sdk/mistral

export const maxDuration = 60;

export async function POST(req: Request) {
  const { prompt } = await req.json();

  if (!prompt) {
    return new Response('Prompt is required', { status: 400 });
  }

  // Model identifiers in 'provider/model-id' format.
  // The Vercel AI Gateway can proxy these if the environment variables are set correctly:
  // e.g. OPENAI_BASE_URL=https://gateway.ai.cloudflare.com/...
  // OR if using Vercel's native integration.
  const models = [
    'openai/gpt-4o',
    'anthropic/claude-3-5-sonnet',
    'google/gemini-1.5-pro-latest',
    // 'mistral/mistral-large-latest', // specific version names vary
    'openai/gpt-3.5-turbo' // Fallback / diversity
  ];

  // Note: For 'google', ensure GOOGLE_GENERATIVE_AI_API_KEY is set.
  // For 'anthropic', ANTHROPIC_API_KEY.
  // For 'openai', OPENAI_API_KEY.
  // To use Vercel AI Gateway for ALL of these, you must configure the Gateway 
  // to expose these models and point the respective keys/BaseURLs to the gateway.

  try {
    const results = await Promise.all(
      models.map(async (modelId) => {
        try {
          const { text } = await generateText({
            model: modelId, // String identifier uses registry
            system: "You are a helpful AI assistant in a blind eval game. usage: concise_argument",
            prompt: `Topic: "${prompt}"\n\nProvide a persuasive argument. < 150 words. No self-ID.`,
          });
          return { modelId, text, status: 'success' };
        } catch (error) {
          console.error(`Error generating for ${modelId}:`, error);
          return { modelId, text: `Failed: ${(error as Error).message}`, status: 'error' };
        }
      })
    );

    return Response.json({ results });
  } catch (error) {
    console.error('Global generation error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
