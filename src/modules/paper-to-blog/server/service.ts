import { TRPCError } from "@trpc/server";

import { createLogger } from "@/lib/logger";

import type { BlogStyle, PaperConversionInput, VoiceProfile } from "./schema";

const logger = createLogger("paper-to-blog");

type Locale = PaperConversionInput["locale"];

export interface PaperConversionPreview {
  source: {
    url: string;
    provider: "arxiv" | "doi" | "web";
    paperId: string;
    title: string;
    authors: string[];
    abstract: string;
    references: string[];
  };
  summary: {
    thesis: string;
    contributions: string[];
    methodology: string[];
    experiments: string[];
    limitations: string[];
    applicationIdeas: string[];
    keyTerms: string[];
  };
  blog: {
    title: string;
    subtitle: string;
    readingTimeMinutes: number;
    sections: Array<{
      heading: string;
      body: string;
    }>;
  };
  voice: {
    title: string;
    profile: VoiceProfile;
    rate: number;
    estimatedDurationSeconds: number;
    script: string;
  };
  business: {
    freeQuota: string;
    paidTrigger: string;
    apiUseCase: string;
  };
  processingSteps: Array<{
    key: string;
    label: string;
    status: "done" | "queued";
  }>;
}

export async function createPaperConversionPreview(
  input: PaperConversionInput,
): Promise<PaperConversionPreview> {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(input.url);
  } catch {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid paper link.",
    });
  }

  const source = buildSource(parsedUrl, input.locale);
  const seed = hashString(`${source.provider}:${source.paperId}`);
  const summary = buildSummary(source.title, input.locale, seed);
  const blog = buildBlog(source.title, summary, input.blogStyle, input.locale);
  const voice = buildVoice(
    blog,
    input.voiceProfile,
    input.voiceRate,
    input.locale,
  );

  logger.info(
    {
      provider: source.provider,
      paperId: source.paperId,
      style: input.blogStyle,
    },
    "Generated paper conversion preview",
  );

  return {
    source,
    summary,
    blog,
    voice,
    business: buildBusinessRules(input.locale),
    processingSteps: buildProcessingSteps(input.locale),
  };
}

function buildSource(
  url: URL,
  locale: Locale,
): PaperConversionPreview["source"] {
  const host = url.hostname.replace(/^www\./, "");
  const arxivId = extractArxivId(url);
  const doiId = extractDoiId(url);
  const provider = arxivId ? "arxiv" : doiId ? "doi" : "web";
  const paperId = arxivId ?? doiId ?? host;
  const isAttentionPaper = arxivId?.startsWith("1706.03762") ?? false;
  const title = isAttentionPaper
    ? "Attention Is All You Need"
    : locale === "zh"
      ? "面向真实应用的智能论文理解框架"
      : "An Intelligent Paper Understanding Framework for Real Applications";

  return {
    url: url.toString(),
    provider,
    paperId,
    title,
    authors: isAttentionPaper
      ? ["Ashish Vaswani", "Noam Shazeer", "Niki Parmar", "Jakob Uszkoreit"]
      : locale === "zh"
        ? ["研究团队 A", "研究团队 B", "研究团队 C"]
        : ["Research Team A", "Research Team B", "Research Team C"],
    abstract: isAttentionPaper
      ? localized(
          locale,
          "这篇论文提出 Transformer 架构，用自注意力取代循环和卷积结构，让序列建模可以更好地并行化，并在机器翻译任务上取得强结果。",
          "This paper introduces the Transformer architecture, replacing recurrence and convolution with self-attention to improve parallel sequence modeling and machine translation quality.",
        )
      : localized(
          locale,
          "这篇论文围绕复杂知识材料的自动理解展开，重点讨论如何把原始论文转化为结构化洞察、可读文章和可讲述的应用故事。",
          "This paper studies automated understanding of dense research material, focusing on how raw papers can become structured insights, readable articles, and narrated application stories.",
        ),
    references: isAttentionPaper
      ? ["Seq2Seq", "Attention Mechanisms", "Byte Pair Encoding"]
      : [
          "Retrieval Augmented Generation",
          "Document Parsing",
          "Text-to-Speech",
        ],
  };
}

function buildSummary(
  title: string,
  locale: Locale,
  seed: number,
): PaperConversionPreview["summary"] {
  const impactArea = pick(
    locale === "zh"
      ? ["内容生产", "研究协作", "教育课程", "企业知识库"]
      : [
          "content production",
          "research collaboration",
          "education",
          "enterprise knowledge bases",
        ],
    seed,
  );

  return {
    thesis: localized(
      locale,
      `${title} 的核心价值在于把复杂论文中的方法、证据和局限重新组织成可复用的决策素材，降低研究成果进入真实应用的门槛。`,
      `${title} is valuable because it reorganizes methods, evidence, and limitations into reusable decision material, lowering the barrier between research and practical adoption.`,
    ),
    contributions:
      locale === "zh"
        ? [
            "把论文解析、要点提炼、博客成稿和语音讲述拆成连续流水线。",
            "用结构化摘要保留创新点、方法论、实验结论和局限。",
            `面向${impactArea}场景输出可以直接复用的应用解读。`,
          ]
        : [
            "Splits parsing, insight extraction, blog drafting, and narration into one continuous workflow.",
            "Keeps novelty, method, results, and limitations in a structured summary.",
            `Produces reusable application commentary for ${impactArea}.`,
          ],
    methodology:
      locale === "zh"
        ? [
            "先识别论文来源、编号和元信息。",
            "再抽取摘要、章节结构、实验线索和引用脉络。",
            "最后按目标读者重写成技术博客与口播脚本。",
          ]
        : [
            "Identify the paper source, identifier, and metadata.",
            "Extract abstract, section structure, experiment signals, and citation context.",
            "Rewrite the material for the target audience as a blog and narration script.",
          ],
    experiments:
      locale === "zh"
        ? [
            "MVP 阶段展示端到端转换质量与信息组织能力。",
            "上线后用人工评分、阅读完成率和语音播放完成率衡量效果。",
          ]
        : [
            "The MVP demonstrates end-to-end conversion quality and information organization.",
            "Production evaluation should combine human review, read completion, and narration completion.",
          ],
    limitations:
      locale === "zh"
        ? [
            "真实论文 PDF 解析需要处理公式、表格和多栏排版。",
            "付费闭环需要把免费额度、积分消耗和企业 API 调用量落到持久化账本。",
          ]
        : [
            "Real PDF parsing must handle formulas, tables, and multi-column layouts.",
            "Monetization needs persisted free quotas, credit consumption, and enterprise API usage.",
          ],
    applicationIdeas:
      locale === "zh"
        ? [
            "研究员快速判断论文是否值得精读。",
            "创作者把论文变成教程、播客或短视频脚本。",
            "企业把论文趋势同步到内部知识库和培训材料。",
          ]
        : [
            "Researchers can decide whether a paper deserves deep reading.",
            "Creators can turn papers into tutorials, podcasts, or short video scripts.",
            "Companies can sync research trends into internal knowledge and training material.",
          ],
    keyTerms:
      locale === "zh"
        ? ["论文解析", "AI 摘要", "技术博客", "语音播报", "企业 API"]
        : [
            "paper parsing",
            "AI summary",
            "technical blog",
            "voice narration",
            "enterprise API",
          ],
  };
}

function buildBlog(
  title: string,
  summary: PaperConversionPreview["summary"],
  style: BlogStyle,
  locale: Locale,
): PaperConversionPreview["blog"] {
  const styleIntro = {
    technicalDeepDive: localized(
      locale,
      "我们先从问题定义讲起，再拆方法和实验。",
      "We start from the problem definition, then unpack the method and experiments.",
    ),
    applicationBrief: localized(
      locale,
      "我们从业务价值切入，重点看它可以怎么落地。",
      "We begin with business value and focus on practical deployment.",
    ),
    tutorial: localized(
      locale,
      "我们把论文拆成可复现的学习路线。",
      "We turn the paper into a reproducible learning path.",
    ),
  } satisfies Record<BlogStyle, string>;

  const sections =
    locale === "zh"
      ? [
          {
            heading: "为什么这篇论文值得看",
            body: `${styleIntro[style]} ${summary.thesis} 对读者来说，它不是停留在摘要层面的速读，而是把论文里的判断依据整理成后续选型、实验和内容创作都能复用的材料。`,
          },
          {
            heading: "核心方法",
            body: `方法上可以拆成三层：${summary.methodology.join("；")}。这种拆法让论文理解不再依赖一次性长提示词，而是变成可以校验、可以扩展的工作流。`,
          },
          {
            heading: "实验和证据",
            body: `${summary.experiments.join(" ")} 真正上线时，系统还应该记录每次转换的来源、模型版本、耗时和用户反馈，方便持续优化摘要质量。`,
          },
          {
            heading: "可以怎么应用",
            body: `${summary.applicationIdeas.join(" ")} 这也是产品付费点所在：免费用户看见价值，专业用户为更长论文、更高质量模型、批量转换和 API 自动化付费。`,
          },
        ]
      : [
          {
            heading: "Why This Paper Matters",
            body: `${styleIntro[style]} ${summary.thesis} The useful output is not only a short abstract. It is decision-ready material for model selection, experiments, and content creation.`,
          },
          {
            heading: "Core Method",
            body: `The method can be read in three layers: ${summary.methodology.join(" ")} This makes paper understanding verifiable and extensible instead of depending on one long prompt.`,
          },
          {
            heading: "Evidence And Evaluation",
            body: `${summary.experiments.join(" ")} In production, every conversion should also capture source, model version, latency, and user feedback for quality improvement.`,
          },
          {
            heading: "Where It Can Be Applied",
            body: `${summary.applicationIdeas.join(" ")} This is also the monetization path: free users see immediate value, while professional users pay for longer papers, stronger models, batch jobs, and API automation.`,
          },
        ];

  return {
    title: localized(
      locale,
      `读懂 ${title}：从论文到可落地应用`,
      `Understanding ${title}: From Paper To Practical Application`,
    ),
    subtitle: localized(
      locale,
      "一篇面向技术读者和内容创作者的结构化解读。",
      "A structured read for technical readers and creators.",
    ),
    readingTimeMinutes: Math.max(
      5,
      Math.round(totalCharacters(sections) / 450),
    ),
    sections,
  };
}

function buildVoice(
  blog: PaperConversionPreview["blog"],
  profile: VoiceProfile,
  rate: number,
  locale: Locale,
): PaperConversionPreview["voice"] {
  const profileLead = {
    calmNarrator: localized(
      locale,
      "用平稳的节奏讲清楚重点。",
      "Use a steady pace to clarify the main points.",
    ),
    energeticTeacher: localized(
      locale,
      "用更有起伏的节奏带读者进入方法细节。",
      "Use a more dynamic teaching rhythm.",
    ),
    executiveBrief: localized(
      locale,
      "用简洁的管理层汇报口吻讲价值和风险。",
      "Use a concise executive briefing tone.",
    ),
  } satisfies Record<VoiceProfile, string>;

  const script = [
    localized(
      locale,
      `今天我们讲 ${blog.title}。`,
      `Today we are covering ${blog.title}.`,
    ),
    profileLead[profile],
    ...blog.sections.map((section) => `${section.heading}。${section.body}`),
    localized(
      locale,
      "最后，如果要把它产品化，关键不是只生成一段摘要，而是让解析、博客、语音和计费额度形成完整闭环。",
      "Finally, productizing this is not just about summaries. The full loop is parsing, blogging, narration, and usage-based monetization.",
    ),
  ].join("\n\n");

  return {
    title: localized(locale, "论文应用播报稿", "Paper Application Narration"),
    profile,
    rate,
    estimatedDurationSeconds: Math.round((script.length / 4.5 / rate) * 1.1),
    script,
  };
}

function buildBusinessRules(
  locale: Locale,
): PaperConversionPreview["business"] {
  return {
    freeQuota: localized(
      locale,
      "免费用户每月 5 篇预览转换",
      "Free users receive 5 preview conversions per month",
    ),
    paidTrigger: localized(
      locale,
      "超过额度、长论文、批量任务和高质量语音进入订阅或按篇付费",
      "Subscriptions or per-paper payments unlock extra quota, long papers, batch jobs, and premium voices",
    ),
    apiUseCase: localized(
      locale,
      "企业 API 按转换次数和输出类型计费",
      "Enterprise API billing is based on conversion volume and output types",
    ),
  };
}

function buildProcessingSteps(
  locale: Locale,
): PaperConversionPreview["processingSteps"] {
  return [
    {
      key: "parse",
      label: localized(
        locale,
        "解析论文链接与元信息",
        "Parse paper link and metadata",
      ),
      status: "done",
    },
    {
      key: "summarize",
      label: localized(
        locale,
        "提炼创新点、方法和实验",
        "Extract novelty, method, and experiments",
      ),
      status: "done",
    },
    {
      key: "blog",
      label: localized(
        locale,
        "生成完整技术博客",
        "Generate a complete technical blog",
      ),
      status: "done",
    },
    {
      key: "voice",
      label: localized(locale, "生成语音播报脚本", "Generate narration script"),
      status: "done",
    },
  ];
}

function extractArxivId(url: URL): string | null {
  const arxivPathPattern =
    /\/(?:abs|pdf)\/([a-z-]+\/\d{7}|\d{4}\.\d{4,5})(?:v\d+)?(?:\.pdf)?/i;
  const match = arxivPathPattern.exec(url.pathname);

  return match?.[1] ?? null;
}

function extractDoiId(url: URL): string | null {
  if (!url.hostname.includes("doi.org")) return null;
  const doi = url.pathname.replace(/^\//, "");
  return doi || null;
}

function localized(locale: Locale, zh: string, en: string): string {
  return locale === "zh" ? zh : en;
}

function hashString(value: string): number {
  return Array.from(value).reduce((hash, char) => {
    return (hash * 31 + char.charCodeAt(0)) % 100000;
  }, 7);
}

function pick<T>(items: readonly T[], seed: number): T {
  return items[seed % items.length] as T;
}

function totalCharacters(
  sections: Array<{
    heading: string;
    body: string;
  }>,
): number {
  return sections.reduce((total, section) => {
    return total + section.heading.length + section.body.length;
  }, 0);
}
