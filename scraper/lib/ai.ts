import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { ScrapedAuction } from "../scraper-types";

export const system_prompt =
  "You are an AI that extracts valid Portuguese municipalities from an an object of strings. The relevant data will be found under .data. There you will find the title. If you cant get information from .data, look into .description. Follow these rules strictly: " +
  "\n - **Only return municipalities**, never districts, regions, or other administrative divisions." +
  "\n - If the name is in English (e.g., 'Lisbon'), return the Portuguese equivalent ('Lisboa')." +
  "\n - If a municipality is misspelled but recognizable, correct it (e.g., 'Lisboaa' → 'Lisboa')." +
  "\n - If a region like 'Algarve' appears **without a municipality**, return `{ success: false }`. " +
  "\n - **If a district name is present but no clear municipality is specified, return `{ success: false }`.**" +
  "\n - If an abbreviated municipality name is found (e.g., 'Vila N. de Gaia'), return the **full official name** (e.g., 'Vila Nova de Gaia')." +
  "\n - **If the location is a locality, village, or smaller place (e.g., 'Quintãzinha do Mouratão' - this is Guarda, as you know), determine if it belongs to a known municipality. If so, return the municipality name.**" +
  "\n - **If a freguesia (civil parish) is mentioned, find its corresponding municipality and return it.**" +
  "\n - **Do not guess** locations. If no valid municipality is found, return `{ success: false }`.  " +
  "\n ### **Output Format:**  " +
  "\n- If a valid municipality is found: " +
  "\n```json" +
  '\n { "success": true, "municipality": "<municipality name>" }' +
  "\n If no valid municipality is found: " +
  "\n```json" +
  '\n{ "success": false }' +
  "\n Once again, if you cant find directly from the title, look into the description";

export async function attempt_ai(municipalities: ScrapedAuction) {
  const prompt = `{"data": "${municipalities.title}" ${municipalities.description ? ", description : " + municipalities.description : ""}}`;

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

  return object;
}
