import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { differenceInSeconds } from "date-fns";
import { z } from "zod";
import { system_prompt } from "./scraper/lib/ai";

const now = new Date();
const prompt = "{data:`Moradia em Fátima`}";
const { object } = await generateObject({
  model: google("gemini-2.0-flash-lite-preview-02-05"),
  prompt,
  schema: z.object({
    success: z
      .boolean()
      .describe(
        "True if it finds the municipality name, false, if the result is ambiguous, or there is no clear municipality mentioned",
      ),
    municipality: z
      .string()
      .optional()
      .describe(
        "Only defined if there is a municipality name. Refer to system prompt for more indications",
      ),
  }),
  system: system_prompt,
});

const after = new Date();

console.log(object);

console.log(differenceInSeconds(after, now));
