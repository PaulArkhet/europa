import { mightFailSync } from "might-fail";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { PageStructure } from "../langgraph";

function handleUpdatePage(
  input: {
    pageName: string;
    status: boolean;
  },
  pageStructure: PageStructure
) {
  const { error } = mightFailSync(() => {
    const pageToModify = pageStructure.find(
      (page) => page.name === input.pageName
    )!;
    pageToModify.complete = input.status;
    if (!pageToModify.complete) delete pageToModify.path;
  });

  if (error) return error;
  else return JSON.stringify(pageStructure);
}

export function generateUpdatePagesTools(pages: PageStructure) {
  return [
    tool(
      (input: { pageName: string }) =>
        handleUpdatePage({ ...input, status: true }, pages),
      {
        name: "markPageAsComplete",
        description: "Use to mark a page as complete by name.",
        schema: z.object({
          pageName: z
            .string()
            .describe("The page name to mark as complete."),
        }),
      }
    ),
    tool(
      (input: { pageName: string }) =>
        handleUpdatePage({ ...input, status: false }, pages),
      {
        name: "markPageAsNotComplete",
        description: `Use to undo marking a page as complete. Will remove it's previous path.`,
        schema: z.object({
          pageName: z
            .string()
            .describe("The page name to mark as not complete."),
        }),
      }
    ),
  ];
}
