export const GAME_CONFIG = {
    MAX_TOKENS: 150,
    MAX_WORDS: 100,
    SYSTEM_PROMPT: (maxWords: number) =>
        `You are a participant in a game where brevity is key. You MUST provide a persuasive argument in LESS THAN ${maxWords} WORDS. Do not use introduction or conclusion. Just the core argument.`,
    USER_PROMPT_SUFFIX: (maxWords: number) =>
        `\n\nSTRICT LIMIT: ${maxWords} WORDS MAX. Be punchy and direct.`
};
