import { tool } from "@langchain/core/tools";
import path from "path";
import fs from "fs/promises";
import { z } from "zod";
import { HumanMessage } from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { mightFail } from "might-fail";

const basePath = path.join(__dirname, "../child-server");

export const fileStructureImpl = async () => {
  const directoryStructure = (
    await fs.readdir(basePath, {
      recursive: true,
      encoding: "utf8",
    })
  ).filter((path) => !path.includes("node_modules"));

  return directoryStructure;
};

const getFileStructure = tool(fileStructureImpl, {
  name: "getFileStructure",
  description:
    "Call to see information in the src directory of the application",
  schema: z.object({}),
});

export const editToolImpl = async ({
  filePath,
  code,
  reasoning,
}: {
  filePath: string;
  code?: string;
  reasoning?: string;
}) => {
  const editPath = path.join(basePath, filePath);

  console.log(`Generative making an edit: ${filePath}`);
  reasoning && console.log(`Reasoning: ${reasoning}`);

  const { result: fileContents, error: readError } = await mightFail(
    fs.readFile(editPath, "utf8")
  );

  if (readError) {
    const dirPath = editPath.split(path.sep).slice(0, -1).join(path.sep);

    const { error: mkdirError } = await mightFail(
      fs.mkdir(dirPath, { recursive: true })
    );

    if (mkdirError) {
      return new HumanMessage({
        content: [
          {
            type: "text",
            text: `Error while writing to file: ${mkdirError.message}`,
          },
        ],
      });
    }
  }

  if (!code && fileContents) {
    return fileContents;
  }

  const { error: writeError } = await mightFail(
    fs.writeFile(
      editPath,
      code
        ? code
        : "File contents are empty! Call this tool with code to change its contents.",
      "utf8"
    )
  );

  if (writeError) {
    return new HumanMessage({
      content: [
        {
          type: "text",
          text: `Error while writing to file: ${writeError.message}`,
        },
      ],
    });
  }

  const directoryStructure = await fileStructureImpl();
  return new HumanMessage({
    content: [
      {
        type: "text",
        text: `New directory structure ${directoryStructure}`,
      },
    ],
  });
};

const editTool = tool(editToolImpl, {
  name: "edit",
  description: `Call to replace a contents of a file with code, returns new file structure.
    If path does not exist, will create a new file.
    If file exists, but no code is supplied, the file contents will be returned.

    Please supply your reasoning for each use of this tool.
    `,
  schema: z.object({
    filePath: z.string().describe("The filepath to be edited."),
    code: z.union([
      z
        .string()
        .describe(
          "The code to replace the contents of the file with. Leave empty to create a new file."
        ),
      z.undefined(),
    ]),
    reasoning: z.union([
      z
        .string()
        .describe(
          "reasons and justification for this edit or file creation."
        ),
      z.undefined(),
    ]),
  }),
});

export const inspectToolImpl = async (input: { filePath: string }) => {
  console.log("Inspecting file:", input.filePath);

  const filePath = path.join(basePath, input.filePath);

  const { result: fileContents, error: readError } = await mightFail(
    fs.readFile(filePath, "utf8")
  );

  if (readError) {
    return readError.message;
  }

  return fileContents;
};

const inspectTool = tool(inspectToolImpl, {
  name: "inspect",
  description: "Call with a filepath to see the contents of a file",
  schema: z.object({
    filePath: z.string().describe("The path of the file to inspect"),
  }),
});

export const reviewerTools = [inspectTool, getFileStructure];
export const reviewerToolsNode = new ToolNode(reviewerTools);

export const generatorTools = [editTool, getFileStructure];
export const generatorToolsNode = new ToolNode(generatorTools);
