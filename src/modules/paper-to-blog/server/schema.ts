import { z } from "zod";

export const blogStyleSchema = z.enum([
  "technicalDeepDive",
  "applicationBrief",
  "tutorial",
]);

export const voiceProfileSchema = z.enum([
  "calmNarrator",
  "energeticTeacher",
  "executiveBrief",
]);

export const paperConversionInputSchema = z.object({
  url: z
    .string()
    .trim()
    .url()
    .max(500)
    .refine(
      (value) => value.startsWith("http://") || value.startsWith("https://"),
      {
        message: "Paper links must use http or https.",
      },
    ),
  blogStyle: blogStyleSchema.default("technicalDeepDive"),
  voiceProfile: voiceProfileSchema.default("calmNarrator"),
  voiceRate: z.number().min(0.75).max(1.5).default(1),
  locale: z.enum(["en", "zh"]).default("zh"),
});

export type PaperConversionInput = z.infer<typeof paperConversionInputSchema>;
export type BlogStyle = z.infer<typeof blogStyleSchema>;
export type VoiceProfile = z.infer<typeof voiceProfileSchema>;
