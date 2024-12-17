import type { Request, Response } from "express";
import { runApp } from "../ai/langgraph";
import { BedrockChat } from "@langchain/community/chat_models/bedrock";
import { z } from "zod";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import path from "path";
import { Server, Socket } from "socket.io";
import {
  readTsxFiles,
  removeFileExtension,
  resizeImage,
} from "../utils/helpers";
import fs from "fs";
import { styleGuideAi } from "../ai/langchain-styleguide";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export const genParamsSchema = z.object({
  pageStructure: z.array(z.string()),
  images: z.array(z.string()),
});

export type GenParams = z.infer<typeof genParamsSchema>;
export async function init(params: GenParams, socket: Socket) {
  console.log("running app...");
  await runApp(
    params.pageStructure
      .map((page, index) => ({
        name: page,
        base64ImageString: params.images[index],
      }))
      .filter((page) => page.name !== "New Page"),
    socket
  );

  console.log("app done!");
  return;
}

export async function initChat(req: Request, res: Response) {
  const { messages, system } = req.body as {
    system: string;
    messages: Message[];
  };

  console.log(messages, system);
  const prompt = ChatPromptTemplate.fromMessages([
    "system",
    `${system}
      try to keep your messages short if you can.`,
    new MessagesPlaceholder("messages"),
  ]);

  const foundationLLM = new BedrockChat({
    model: "anthropic.claude-3-5-sonnet-20240620-v1:0",
    region: process.env.BEDROCK_AWS_REGION,
    credentials: {
      accessKeyId: process.env.BEDROCK_AWS_ACCESS_KEY!,
      secretAccessKey: process.env.BEDROCK_AWS_SECRET!,
    },
    temperature: 1,
  });

  const model = prompt.pipe(foundationLLM);

  const response = await model.invoke({ messages });
  return res.send(response.content);
}

export const uploadStyleGuide = async (
  req: Request,
  res: Response,
  io: Server
): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  try {
    const uploadedFile = req.file as Express.Multer.File;
    const fileMimeType = uploadedFile.mimetype;

    let resizedFile = null;

    console.log("uploadedFile", uploadedFile);
    if (fileMimeType === "image/png" || fileMimeType === "image/jpeg") {
      const outputFilePath = path.join(
        __dirname,
        "../../uploads",
        `resized-${uploadedFile.filename}`
      );

      await resizeImage(uploadedFile.path, outputFilePath);

      const fileBuffer = fs
        .readFileSync(outputFilePath)
        .toString("base64");
      const base64Image = `data:${fileMimeType};base64,${fileBuffer}`;

      resizedFile = {
        fileName: uploadedFile.originalname,
        content: base64Image,
        fileType: fileMimeType,
      };
    }

    if (!resizedFile) {
      res.status(400).json({ error: "Invalid file type uploaded" });
      return;
    }

    res.json({ message: "File uploaded, processing started." });

    const typographyComponent = await styleGuideAi(
      {
        fileName: "typography",
        content: "There is no component to pass.",
      },
      resizedFile.content
    );

    if (typographyComponent) {
      io.emit("styledComponent", {
        fileName: "typography",
        styledComponent: typographyComponent,
      });
    }

    const colorComponent = await styleGuideAi(
      { fileName: "color", content: "There is no component to pass." },
      resizedFile.content
    );

    if (colorComponent) {
      io.emit("styledComponent", {
        fileName: "color",
        styledComponent: colorComponent,
      });
    }

    const componentDirPath = path.join(__dirname, "../../custom-ui-server");
    const txtFiles = await readTsxFiles(componentDirPath);

    for (const txtFile of txtFiles) {
      const styledComponent = await styleGuideAi(
        { fileName: txtFile.fileName, content: txtFile.content },
        resizedFile.content
      );

      if (styledComponent) {
        io.emit("styledComponent", {
          fileName: removeFileExtension(txtFile.fileName),
          styledComponent: styledComponent,
        });
      }
    }

    io.emit("done", { message: "All components processed." });
  } catch (error) {
    console.error("Error processing file:", error);
    io.emit("error", { message: "Error processing file" });
    res.status(500).json({ error: "Internal server error" });
  }
};
