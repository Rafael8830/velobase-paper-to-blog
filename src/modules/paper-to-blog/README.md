# Paper To Blog Module

## Product Brief

```yaml
product:
  name: PaperCast
  one_liner: Convert research paper links into structured summaries, technical blogs, and voice narration.
  target_users: [creator, developer, enterprise, educator, researcher]
  core_user_stories:
    - As a researcher, I can paste an arXiv link and quickly understand whether a paper deserves deeper reading.
    - As a creator, I can turn a paper into a publishable technical blog and narration script.
    - As an education or enterprise user, I can expose paper-to-content conversion through an API.
  business_model: hybrid
  ai_capabilities: [document parsing, analysis, generation, text-to-speech]
  target_regions: [global, zh-CN-first MVP]
  third_party_services:
    [
      OpenAI or Anthropic,
      arXiv/PDF parser,
      browser speech synthesis for demo,
      production TTS later,
    ]
```

## Domain Design

- Main business object: `PaperConversion`, owned by a user when authenticated and anonymous for the public preview.
- User actions: submit paper link, choose blog style, generate paper summary, generate blog, play narration, upgrade for quota/API usage.
- Value: faster paper comprehension, reusable content output, lower effort for education and enterprise knowledge workflows.
- Commercial rules: monthly free quota, paid unlocks for long papers and batch/API workflows, enterprise usage metering by conversion volume and output type.

## MVP Scope

- Public first demo path: `/`.
- Must have: paper link validation, deterministic parser preview, structured paper summary, technical blog output, browser voice narration, business model messaging.
- Nice to have later: persisted conversion history, real PDF/arXiv extraction, LLM generation, premium TTS audio files, batch conversion, enterprise API keys.
- Out of scope for this quick implementation: payment checkout wiring, worker-backed PDF parsing, stored audio assets, enterprise metering ledger.

## Test Plan

- Service unit: required when a test runner is added.
- Router integration: optional for public preview, required once persistence and ownership are added.
- Worker: none for this synchronous MVP.
- E2E: optional smoke path for landing conversion.
