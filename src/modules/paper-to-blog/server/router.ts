import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

import { paperConversionInputSchema } from "./schema";
import { createPaperConversionPreview } from "./service";

export const paperToBlogRouter = createTRPCRouter({
  convert: publicProcedure
    .input(paperConversionInputSchema)
    .mutation(({ input }) => createPaperConversionPreview(input)),
});
