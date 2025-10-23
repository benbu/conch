<!-- ed770094-6e14-45fe-8976-abd66073bae6 007b52e2-892a-41dd-a686-56b5f1a3d867 -->
# Inline Translations (Server-driven, AI SDK v5)

### Scope

- Translate every new message for any recipients with `autoTranslate = true` into each recipient’s `defaultLanguage`.
- Do not pre-check if the message already matches the target language; the AI tool must detect this and return a no-op result.
- Use Vercel AI SDK v5 tool-calling; include cultural context hints and slang/idiom explanations.
- Persist translations to Firestore; UI shows a loader under the message until translation completes. Non-blocking for new messages. Parallel per-language handling.

### Data model (Firestore)

- `users/{userId}`: add fields
  - `defaultLanguage: string` (ISO 639-1, e.g., `en`, `es`)
  - `autoTranslate: boolean`
- `conversations/{conversationId}/messages/{messageId}/translations/{langCode}`
  - `status: 'pending' | 'completed' | 'error'`
  - `translation: string` (empty if no-translation-needed)
  - `noTranslationNeeded: boolean`
  - `detectedSourceLang?: string`
  - `confidence?: number` (0..1)
  - `culturalContextHints: string[]`
  - `slangExplanations: { phrase: string; explanation: string }[]`
  - `provider: 'openai'`
  - `model: string`
  - `createdAt: Timestamp`
  - `updatedAt: Timestamp`
  - `error?: string`

### Cloud Functions (Node 20 + AI SDK v5)

- Upgrade runtime to Node 20 and `ai` v5.
- New `functions/src/ai/translate.ts`:
  - Define `translateTool` via AI SDK v5 `tool` with Zod input/output.
  - Inside `execute`, call `generateObject` with strict system/prompt to produce:
    - `translation` (may be empty), `noTranslationNeeded`, `detectedSourceLang`, `confidence`, `culturalContextHints`, `slangExplanations`.
  - Model: `openai('gpt-4o-mini')` (configurable by env).
- Update `functions/src/triggers/onMessageCreated.ts`:
  - After computing recipients, fetch each recipient’s `defaultLanguage` and `autoTranslate`.
  - Build a unique set of target languages from recipients where `autoTranslate = true` (dedupe only to avoid redundant calls; do not compare to source language).
  - For each `targetLang`:
    - Create `translations/{targetLang}` doc with `status: 'pending'`.
    - Invoke AI tool call:
      - `generateText({ tools: { translate: translateTool }, toolChoice: { type: 'tool', toolName: 'translate' }, prompt: JSON.stringify({ text, targetLang, audienceRegion }) })`.
      - Extract the tool result; if `noTranslationNeeded`, write `status: 'completed'`, `noTranslationNeeded: true`, empty `translation` and metadata; else write full translation payload.
    - On error, set `status: 'error'` with `error`.
  - Use `Promise.allSettled` for parallel per-language execution without blocking notifications.

### Prompting (inside tool)

- System: “You are a professional translator for business chat. Be precise, culturally aware, concise, preserve meaning and tone.”
- Instructions must:
  - Detect the source language reliably and set `detectedSourceLang` and `confidence`.
  - If the text is already in `targetLang`, set `noTranslationNeeded = true` and return empty `translation` with a brief reason (optional), still including `detectedSourceLang` and `confidence`.
  - Otherwise, return a natural translation and also:
    - 1–3 “cultural context hints” tailored to the target locale.
    - Any “slang/idiom explanations” as `{ phrase, explanation }`.
  - Preserve code blocks, emojis, and links; avoid hallucinating facts or expanding beyond source content.

### Client changes (non-blocking UI)

- New `hooks/useTranslations.ts`: subscribe to `translations/{currentUserLang}` for visible messages.
- Update `stores/chatStore.ts`: add `setTranslation(conversationId, messageId, lang, data)` and selectors to get current-lang translation by message.
- Update `services/firestoreService.ts`: add `subscribeToTranslations(conversationId, messageId, lang, cb)` and a list variant.
- Update `components/MessageBubble.tsx`:
  - Render an inline area under the message:
    - `status='pending'`: AI spinner “Translating …”.
    - `status='completed' && !noTranslationNeeded`: render `translation` text; disclosure to show `culturalContextHints` and `slangExplanations`.
    - `status='completed' && noTranslationNeeded`: hide the area (or show an unobtrusive “No translation needed”).
    - `status='error'`: subtle error state.
- Ensure the chat remains responsive; translations update live as docs change.

### Security Rules (summary)

- Allow read of `translations/*` to conversation participants.
- Restrict write of `translations/*` to Cloud Functions service account.

### Testing

- Unit: tool input/output schemas; no-op detection path; happy-path translation.
- Emulator: create message → `pending` doc appears → after AI returns, `completed` doc (no-op or translation) appears.
- UI: loader replaced by translation or hidden on no-op; new messages unaffected.

### Minimal code references (indicative)

- Tool definition:
```ts
// functions/src/ai/translate.ts
import { tool, generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export const translateTool = tool({
  description: 'Translate with cultural context and slang explanations; detect no-op',
  inputSchema: z.object({
    targetLang: z.string(),
    text: z.string(),
    audienceRegion: z.string().optional(),
  }),
  outputSchema: z.object({
    translation: z.string().default(''),
    noTranslationNeeded: z.boolean().default(false),
    detectedSourceLang: z.string().optional(),
    confidence: z.number().min(0).max(1).optional(),
    culturalContextHints: z.array(z.string()).default([]),
    slangExplanations: z
      .array(z.object({ phrase: z.string(), explanation: z.string() }))
      .default([]),
  }),
  execute: async ({ targetLang, text, audienceRegion }) => {
    const schema = z.object({
      translation: z.string().default(''),
      noTranslationNeeded: z.boolean().default(false),
      detectedSourceLang: z.string().optional(),
      confidence: z.number().min(0).max(1).optional(),
      culturalContextHints: z.array(z.string()).default([]),
      slangExplanations: z.array(
        z.object({ phrase: z.string(), explanation: z.string() })
      ).default([]),
    });

    const { object } = await generateObject({
      model: openai(process.env.TRANSLATION_MODEL || 'gpt-4o-mini'),
      schema,
      system:
        'You are a professional translator for business chat. Be precise, culturally aware, concise. Preserve meaning, tone, code blocks, emojis, links.',
      prompt:
        `Detect the source language of the following text. If it already matches the target ` +
        `language (${targetLang}), set noTranslationNeeded=true and return an empty translation. ` +
        `Otherwise, translate to ${targetLang}. Include 1-3 cultural context hints and explain any slang/idioms.\n\n` +
        `Text:\n${text}`,
    });

    return object;
  },
});
```

- Trigger usage:
```ts
// functions/src/triggers/onMessageCreated.ts (inside handler)
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { translateTool } from '../ai/translate';

await Promise.allSettled(Array.from(targetLangs).map(async (targetLang) => {
  const ref = admin
    .firestore()
    .doc(`conversations/${conversationId}/messages/${messageId}/translations/${targetLang}`);

  await ref.set(
    {
      status: 'pending',
      createdAt: new Date(),
      model: process.env.TRANSLATION_MODEL || 'gpt-4o-mini',
      provider: 'openai',
    },
    { merge: true }
  );

  try {
    const { toolResults } = await generateText({
      model: openai(process.env.ORCHESTRATOR_MODEL || 'gpt-4o-mini'),
      tools: { translate: translateTool },
      toolChoice: { type: 'tool', toolName: 'translate' },
      prompt: JSON.stringify({ targetLang, text: message.text, audienceRegion: undefined }),
    });

    const out = toolResults[0]?.output as {
      translation: string;
      noTranslationNeeded: boolean;
      detectedSourceLang?: string;
      confidence?: number;
      culturalContextHints: string[];
      slangExplanations: { phrase: string; explanation: string }[];
    };

    await ref.set(
      {
        status: 'completed',
        translation: out?.translation || '',
        noTranslationNeeded: !!out?.noTranslationNeeded,
        detectedSourceLang: out?.detectedSourceLang,
        confidence: out?.confidence,
        culturalContextHints: out?.culturalContextHints || [],
        slangExplanations: out?.slangExplanations || [],
        updatedAt: new Date(),
      },
      { merge: true }
    );
  } catch (e: any) {
    await ref.set(
      { status: 'error', error: String(e), updatedAt: new Date() },
      { merge: true }
    );
  }
}));
```


### Dependencies and config

- `functions/package.json`:
  - `"engines.node": "20"`
  - Upgrade `ai` to `^5.x`, ensure `@ai-sdk/openai` compatible.
- Env vars: `OPENAI_API_KEY`, `TRANSLATION_MODEL`, `ORCHESTRATOR_MODEL`.

### Rollout

1) Server upgrade: Node 20 + AI SDK v5, deploy functions.

2) Add Firestore rules for translations.

3) Client: add subscription/rendering; ship UI.

4) Verify on Emulator/E2E (EN → ES test showing loader, translation, or no-op).

### To-dos

- [ ] Upgrade functions to Node 20 and ai SDK v5 (deps, imports)
- [ ] Create translate tool with schema, generator, and prompts
- [ ] Extend onMessageCreated to orchestrate per-language translations
- [ ] Add translations subcollection and service methods
- [ ] Add security rules for translations read/write
- [ ] Add useTranslations hook and store selectors
- [ ] Render translation loader and text in MessageBubble
- [ ] Emulator + UI tests for translation flow and concurrency