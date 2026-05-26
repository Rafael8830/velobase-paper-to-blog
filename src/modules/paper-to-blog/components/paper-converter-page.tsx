"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpenText,
  Brain,
  CheckCircle2,
  Clipboard,
  FileText,
  Link2,
  Mic2,
  Pause,
  Play,
  Radio,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PaperConversionPreview } from "@/modules/paper-to-blog/server/service";

type BlogStyle = "technicalDeepDive" | "applicationBrief" | "tutorial";
type VoiceProfile = "calmNarrator" | "energeticTeacher" | "executiveBrief";
type ConversionResult = PaperConversionPreview;

const SAMPLE_PAPER_URL = "https://arxiv.org/abs/1706.03762";

export function PaperConverterPage() {
  const t = useTranslations("product.paperToBlog");
  const locale = useLocale();
  const [paperUrl, setPaperUrl] = useState(SAMPLE_PAPER_URL);
  const [blogStyle, setBlogStyle] = useState<BlogStyle>("technicalDeepDive");
  const [voiceProfile, setVoiceProfile] =
    useState<VoiceProfile>("calmNarrator");
  const [voiceRate, setVoiceRate] = useState(1);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<ConversionResult | undefined>();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const styleOptions = useMemo(
    () => [
      { value: "technicalDeepDive" as const, label: t("styles.technical") },
      { value: "applicationBrief" as const, label: t("styles.application") },
      { value: "tutorial" as const, label: t("styles.tutorial") },
    ],
    [t],
  );

  const voiceOptions = useMemo(
    () => [
      { value: "calmNarrator" as const, label: t("voices.calm") },
      { value: "energeticTeacher" as const, label: t("voices.teacher") },
      { value: "executiveBrief" as const, label: t("voices.brief") },
    ],
    [t],
  );

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") {
        window.speechSynthesis?.cancel();
      }
    };
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setError(undefined);
    setCopied(false);

    void fetch("/api/paper-to-blog/preview", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        url: paperUrl,
        blogStyle,
        voiceProfile,
        voiceRate,
        locale: locale === "zh" ? "zh" : "en",
      }),
    })
      .then(async (response) => {
        const payload = (await response.json()) as
          | ConversionResult
          | { error?: string };

        if (!response.ok) {
          throw new Error(
            "error" in payload && payload.error
              ? payload.error
              : t("errors.preview"),
          );
        }

        setResult(payload as ConversionResult);
      })
      .catch((fetchError: unknown) => {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : t("errors.preview"),
        );
      })
      .finally(() => setIsPending(false));
  }

  function handleSpeak() {
    if (!result?.voice.script || typeof window === "undefined") return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(result.voice.script);
    utterance.lang = locale === "zh" ? "zh-CN" : "en-US";
    utterance.rate = voiceRate;
    utterance.pitch = voiceProfile === "energeticTeacher" ? 1.08 : 1;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  }

  function handleStop() {
    if (typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }

  async function handleCopyBlog() {
    if (!result?.blog) return;
    const blogText = formatBlog(result);
    await navigator.clipboard.writeText(blogText);
    setCopied(true);
  }

  return (
    <main className="relative z-10 w-full px-4 pt-24 pb-16 md:px-8">
      <section className="mx-auto grid w-full max-w-[1440px] gap-6 lg:grid-cols-[minmax(360px,0.9fr)_minmax(0,1.4fr)]">
        <div className="border-border bg-card/80 flex min-h-[calc(100vh-8rem)] flex-col justify-between gap-8 rounded-lg border p-5 shadow-sm backdrop-blur md:p-6">
          <div className="space-y-7">
            <div className="space-y-4">
              <Badge className="w-fit rounded-md border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                {t("eyebrow")}
              </Badge>
              <div className="space-y-3">
                <h1 className="text-foreground max-w-xl text-4xl font-semibold tracking-normal md:text-5xl">
                  {t("title")}
                </h1>
                <p className="text-muted-foreground max-w-xl text-base leading-7 md:text-lg">
                  {t("subtitle")}
                </p>
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label
                  className="text-foreground text-sm font-medium"
                  htmlFor="paper-url"
                >
                  {t("form.url")}
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Link2 className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input
                      id="paper-url"
                      type="url"
                      value={paperUrl}
                      onChange={(event) => setPaperUrl(event.target.value)}
                      placeholder={t("form.placeholder")}
                      className="h-11 pl-9"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 shrink-0"
                    onClick={() => setPaperUrl(SAMPLE_PAPER_URL)}
                  >
                    {t("actions.sample")}
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-foreground space-y-2 text-sm font-medium">
                  <span>{t("form.style")}</span>
                  <select
                    value={blogStyle}
                    onChange={(event) =>
                      setBlogStyle(event.target.value as BlogStyle)
                    }
                    className="border-input bg-background text-foreground focus-visible:ring-ring h-11 w-full rounded-md border px-3 text-sm transition outline-none focus-visible:ring-2"
                  >
                    {styleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-foreground space-y-2 text-sm font-medium">
                  <span>{t("form.voice")}</span>
                  <select
                    value={voiceProfile}
                    onChange={(event) =>
                      setVoiceProfile(event.target.value as VoiceProfile)
                    }
                    className="border-input bg-background text-foreground focus-visible:ring-ring h-11 w-full rounded-md border px-3 text-sm transition outline-none focus-visible:ring-2"
                  >
                    {voiceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="text-foreground block space-y-3 text-sm font-medium">
                <span className="flex items-center justify-between">
                  <span>{t("form.rate")}</span>
                  <span className="text-muted-foreground font-mono text-xs">
                    {voiceRate.toFixed(2)}x
                  </span>
                </span>
                <input
                  type="range"
                  min="0.75"
                  max="1.5"
                  step="0.05"
                  value={voiceRate}
                  onChange={(event) => setVoiceRate(Number(event.target.value))}
                  className="accent-foreground w-full"
                />
              </label>

              <Button
                type="submit"
                className="h-12 w-full gap-2"
                disabled={!paperUrl || isPending}
              >
                {isPending ? (
                  <>
                    <Wand2 className="h-4 w-4 animate-spin" />
                    {t("actions.generating")}
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    {t("actions.generate")}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            {error ? (
              <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border p-3 text-sm">
                {error}
              </div>
            ) : null}
          </div>

          <WorkflowRail
            result={result}
            pending={isPending}
            labels={{
              title: t("workflow.title"),
              empty: t("workflow.empty"),
            }}
          />
        </div>

        <div className="border-border bg-background/85 min-h-[calc(100vh-8rem)] rounded-lg border shadow-sm backdrop-blur">
          {result ? (
            <ResultWorkspace
              result={result}
              copied={copied}
              isSpeaking={isSpeaking}
              onCopyBlog={handleCopyBlog}
              onSpeak={handleSpeak}
              onStop={handleStop}
              t={t}
            />
          ) : (
            <EmptyWorkspace pending={isPending} t={t} />
          )}
        </div>
      </section>
    </main>
  );
}

function WorkflowRail({
  result,
  pending,
  labels,
}: {
  result?: ConversionResult;
  pending: boolean;
  labels: {
    title: string;
    empty: string;
  };
}) {
  const steps = result?.processingSteps ?? [
    { key: "parse", label: labels.empty, status: "queued" as const },
    { key: "summarize", label: labels.empty, status: "queued" as const },
    { key: "blog", label: labels.empty, status: "queued" as const },
    { key: "voice", label: labels.empty, status: "queued" as const },
  ];

  return (
    <div className="border-border bg-muted/40 rounded-md border p-4">
      <div className="text-foreground mb-3 flex items-center gap-2 text-sm font-medium">
        <Radio
          className={cn("h-4 w-4", pending && "animate-pulse text-cyan-500")}
        />
        {labels.title}
      </div>
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div
            key={`${step.key}-${index}`}
            className="bg-background flex min-h-9 items-center gap-3 rounded-md px-3 text-sm"
          >
            <CheckCircle2
              className={cn(
                "h-4 w-4 shrink-0",
                step.status === "done"
                  ? "text-emerald-500"
                  : pending
                    ? "text-cyan-500"
                    : "text-muted-foreground",
              )}
            />
            <span className="text-muted-foreground">{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyWorkspace({
  pending,
  t,
}: {
  pending: boolean;
  t: ReturnType<typeof useTranslations<"product.paperToBlog">>;
}) {
  const previewItems = [
    { icon: FileText, label: t("empty.paper") },
    { icon: Brain, label: t("empty.summary") },
    { icon: BookOpenText, label: t("empty.blog") },
    { icon: Mic2, label: t("empty.voice") },
  ];

  return (
    <div className="flex h-full min-h-[calc(100vh-8rem)] flex-col p-5 md:p-7">
      <div className="grid flex-1 place-items-center">
        <div className="w-full max-w-2xl space-y-6">
          <div className="border-border bg-card rounded-lg border p-5 shadow-sm">
            <div className="border-border mb-5 flex items-center justify-between border-b pb-4">
              <div className="space-y-2">
                <div className="bg-muted h-3 w-40 rounded-sm" />
                <div className="bg-muted/70 h-3 w-24 rounded-sm" />
              </div>
              <div className="h-10 w-10 rounded-md bg-cyan-500/10" />
            </div>
            <div className="space-y-3">
              <div className="bg-muted h-4 w-11/12 rounded-sm" />
              <div className="bg-muted h-4 w-9/12 rounded-sm" />
              <div className="bg-muted h-4 w-10/12 rounded-sm" />
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {previewItems.map((item) => (
                  <div
                    key={item.label}
                    className="border-border bg-background flex min-h-14 items-center gap-3 rounded-md border px-3"
                  >
                    <item.icon className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
                    <span className="text-muted-foreground text-sm">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="text-muted-foreground text-center text-sm">
            {pending ? t("empty.pending") : t("empty.ready")}
          </p>
        </div>
      </div>
    </div>
  );
}

function ResultWorkspace({
  result,
  copied,
  isSpeaking,
  onCopyBlog,
  onSpeak,
  onStop,
  t,
}: {
  result: ConversionResult;
  copied: boolean;
  isSpeaking: boolean;
  onCopyBlog: () => void;
  onSpeak: () => void;
  onStop: () => void;
  t: ReturnType<typeof useTranslations<"product.paperToBlog">>;
}) {
  return (
    <div className="grid h-full min-h-[calc(100vh-8rem)] grid-rows-[auto_1fr]">
      <div className="border-border border-b p-5 md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-md">
                {result.source.provider.toUpperCase()}
              </Badge>
              <span className="text-muted-foreground font-mono text-xs">
                {result.source.paperId}
              </span>
            </div>
            <h2 className="text-foreground max-w-3xl text-2xl font-semibold tracking-normal md:text-3xl">
              {result.blog.title}
            </h2>
            <p className="text-muted-foreground max-w-3xl text-sm leading-6">
              {result.blog.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={onCopyBlog}
            >
              <Clipboard className="h-4 w-4" />
              {copied ? t("actions.copied") : t("actions.copy")}
            </Button>
            {isSpeaking ? (
              <Button
                variant="secondary"
                size="sm"
                className="gap-2"
                onClick={onStop}
              >
                <Pause className="h-4 w-4" />
                {t("actions.stop")}
              </Button>
            ) : (
              <Button size="sm" className="gap-2" onClick={onSpeak}>
                <Play className="h-4 w-4" />
                {t("actions.play")}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-0 overflow-hidden xl:grid-cols-[minmax(0,1fr)_360px]">
        <article className="overflow-y-auto p-5 md:p-7">
          <section className="border-border bg-card mb-7 rounded-md border p-5">
            <div className="text-foreground mb-3 flex items-center gap-2 text-sm font-semibold">
              <Brain className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
              {t("summary.title")}
            </div>
            <p className="text-muted-foreground text-sm leading-7">
              {result.summary.thesis}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {result.summary.keyTerms.map((term) => (
                <Badge key={term} variant="secondary" className="rounded-md">
                  {term}
                </Badge>
              ))}
            </div>
          </section>

          <div className="space-y-6">
            {result.blog.sections.map((section) => (
              <section key={section.heading} className="space-y-3">
                <h3 className="text-foreground text-xl font-semibold tracking-normal">
                  {section.heading}
                </h3>
                <p className="text-muted-foreground text-base leading-8">
                  {section.body}
                </p>
              </section>
            ))}
          </div>
        </article>

        <aside className="border-border bg-muted/30 overflow-y-auto border-t p-5 xl:border-t-0 xl:border-l">
          <div className="space-y-5">
            <InfoList
              title={t("summary.contributions")}
              items={result.summary.contributions}
            />
            <InfoList
              title={t("summary.methods")}
              items={result.summary.methodology}
            />
            <InfoList
              title={t("summary.applications")}
              items={result.summary.applicationIdeas}
            />

            <section className="border-border bg-background rounded-md border p-4">
              <div className="text-foreground mb-3 flex items-center gap-2 text-sm font-semibold">
                <Mic2 className="h-4 w-4 text-emerald-500" />
                {result.voice.title}
              </div>
              <p className="text-muted-foreground mb-3 text-xs">
                {t("voice.duration", {
                  seconds: result.voice.estimatedDurationSeconds,
                })}
              </p>
              <p className="text-muted-foreground max-h-44 overflow-y-auto text-sm leading-7 whitespace-pre-line">
                {result.voice.script}
              </p>
            </section>

            <section className="border-border bg-background rounded-md border p-4">
              <div className="text-foreground mb-3 text-sm font-semibold">
                {t("business.title")}
              </div>
              <ul className="text-muted-foreground space-y-2 text-sm leading-6">
                <li>{result.business.freeQuota}</li>
                <li>{result.business.paidTrigger}</li>
                <li>{result.business.apiUseCase}</li>
              </ul>
            </section>
          </div>
        </aside>
      </div>
    </div>
  );
}

function InfoList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="border-border bg-background rounded-md border p-4">
      <div className="text-foreground mb-3 text-sm font-semibold">{title}</div>
      <ul className="text-muted-foreground space-y-2 text-sm leading-6">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function formatBlog(result: ConversionResult): string {
  const sections = result.blog.sections
    .map((section) => `## ${section.heading}\n\n${section.body}`)
    .join("\n\n");

  return `# ${result.blog.title}\n\n${result.blog.subtitle}\n\n${result.summary.thesis}\n\n${sections}`;
}
