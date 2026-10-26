# ORBIT space AI

This adds inference using an existing model, not a newly trained or fine-tuned model. The server supplies ORBIT's curated reference notes plus up to three previous conversation exchanges. It answers new space questions, gives follow-up explanations, and requests English, Burmese or Simplified Chinese. Burmese output quality needs live evaluation; support is not a guarantee of translation accuracy. No browsing or live launch feeds are included.

## Activate on Cloudflare Pages

1. Open Workers & Pages → orbit-space (the Pages project) → Settings → Bindings.
2. Add a Workers AI binding named `AI` for Production. Review your Workers AI plan and usage allowance before enabling it; this integration does not set a spending cap or guarantee free inference.
3. Redeploy the latest commit, then refresh ORBIT. `GET /api/chat` should return `{"available":true}` and the chat footer should say AI space guide.
4. Ask “Why do astronauts float in orbit?” and a follow-up “Explain simply.” Test Burmese and Chinese too.

If Cloudflare asks you to accept terms or enable billing, the account owner must complete that decision. No API key belongs in browser JavaScript. The default model is `@cf/meta/llama-3.3-70b-instruct-fp8-fast`; set the server-side `SPACE_AI_MODEL` environment variable to switch compatible chat models.

The repository's existing wrangler.jsonc is for its older Workers static-assets deployment. This integration targets the current Pages Git deployment: repository root `/`, build output `dist`, Functions folder `/functions`. Keep the build root at the repository root so Cloudflare finds Functions. Configure the AI binding in the Pages dashboard.

## Behavior and checks

The frontend checks readiness before using AI. Missing binding, timeouts, and provider errors fall back to the existing curated guide with a clear label. Requests have 500-character questions, a six-message history limit, a 12 KB body limit, and a 700-token output budget. Clearing chat or changing language cancels pending responses. Conversation text is sent to Cloudflare for AI inference; ORBIT does not persist conversations or train on them. Provider processing is subject to Cloudflare's policies.

Same-origin checks are not authentication or abuse protection. For a public launch, configure Cloudflare request-rate controls appropriate to your plan and monitor AI usage. The optional `CHAT_RATE_LIMITER` binding is honored if available in your hosting configuration; it is not provisioned by this change. Without account rate controls this endpoint is publicly callable.

Run `node --test tests/space-ai.test.mjs` from the repository root. Tests use mocked inference; validate answer quality and multilingual behavior against the live model after activation. Try unsupported questions and ensure answers admit uncertainty, and check that follow-ups add detail rather than repeating.

Documentation: https://developers.cloudflare.com/pages/functions/bindings/#workers-ai
