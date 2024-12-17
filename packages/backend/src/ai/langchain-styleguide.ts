import { END, StateGraph, START, Annotation } from "@langchain/langgraph";
import { BedrockChat } from "@langchain/community/chat_models/bedrock";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { removeFileExtension } from "../utils/helpers";
import {
  getButtonPrompt,
  getColorPrompt,
  getDefaultComponentPrompt,
  getInputPrompt,
  getRadioButtonPrompt,
  getTogglePrompt,
  getTypographyPrompt,
  getCheckboxPrompt,
  getSegmentedButtonPrompt,
  getCardPrompt,
  getTabsPrompt,
} from "../utils/styleguide-prompt";

interface ComponentFile {
  fileName: string;
  content: string;
}

const claudeModel = new BedrockChat({
  model: "anthropic.claude-3-5-sonnet-20240620-v1:0",
  region: process.env.BEDROCK_AWS_REGION,
  credentials: {
    accessKeyId: process.env.BEDROCK_AWS_ACCESS_KEY!,
    secretAccessKey: process.env.BEDROCK_AWS_SECRET!,
  },
  temperature: 0,
});

function isValidBase64Image(base64Image: string): boolean {
  return /^data:image\/(png|jpeg|jpg);base64,/.test(base64Image);
}

function getComponentInstructions(componentName: string): string {
  const instructions: { [key: string]: string } = {
    typography: getTypographyPrompt(),
    button: getButtonPrompt(),
    radiobutton: getRadioButtonPrompt(),
    input: getInputPrompt(),
    color: getColorPrompt(),
    toggle: getTogglePrompt(),
    checkbox: getCheckboxPrompt(),
    segmentedbutton: getSegmentedButtonPrompt(),
    tabs: getTabsPrompt(),
    card: getCardPrompt(),
  };

  return (
    instructions[componentName.toLowerCase()] ||
    getDefaultComponentPrompt(componentName)
  );
}

const prompt = ChatPromptTemplate.fromMessages([
  new HumanMessage({
    content: `
      You are a highly skilled frontend developer responsible for applying a style guide to various components.

      For components, please return the JSX usage of the component with Tailwind CSS classes applied directly to the className attribute.

      Do not return any additional explanations or comments. For typography, return the details in a valid JSON format.
    `,
  }),
  new MessagesPlaceholder("messages"),
]);

const codeGenerationChain = prompt.pipe(claudeModel);

const State = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
  }),
});

function createHumanMessage(
  componentFileText: string | undefined,
  styleGuideBase64Image: string,
  Instruction: string
): HumanMessage {
  return new HumanMessage({
    content: [
      { type: "image_url", image_url: { url: styleGuideBase64Image } },
      {
        type: "text",
        text: `Component File Content: ${componentFileText}, Instructions:${Instruction}`,
      },
    ],
  });
}

const generatorNode = async (state: typeof State.State) => {
  const { messages } = state;
  const response = await codeGenerationChain.invoke({
    messages: [...messages],
  });
  return { messages: [response] };
};

const workflow = new StateGraph(State)
  .addNode("generate", generatorNode)
  .addEdge(START, "generate")
  .addEdge("generate", END);

const app = workflow.compile();

export async function styleGuideAi(
  componentFile: ComponentFile,
  styleGuideBase64Image: string
) {
  let results: { [key: string]: any } = {};

  const baseFileName = removeFileExtension(componentFile.fileName);
  const instruction = getComponentInstructions(baseFileName);

  if (!isValidBase64Image(styleGuideBase64Image)) {
    console.error("Invalid base64 image format.");
    return;
  }

  if (baseFileName === "typography") {
    console.log("Processing typography from style guide...");

    const typographyMessage = createHumanMessage(
      componentFile.content,
      styleGuideBase64Image,
      instruction
    );

    try {
      const finalState = await app.invoke(
        { messages: [typographyMessage] },
        { recursionLimit: 10 }
      );
      const responseContent = finalState.messages[1]?.content;

      let jsonContent;
      try {
        jsonContent = JSON.parse(responseContent);
        results["typography"] = jsonContent;
      } catch (parseError) {
        console.error("Response is not valid JSON:", responseContent);
        results["typography"] = responseContent;
      }
    } catch (error) {
      console.error("Error processing typography:", error);
    }

    return results;
  }

  if (baseFileName === "color") {
    console.log("Processing color from style guide...");

    const colorMessage = createHumanMessage(
      componentFile.content,
      styleGuideBase64Image,
      instruction
    );

    try {
      const finalState = await app.invoke(
        { messages: [colorMessage] },
        { recursionLimit: 10 }
      );
      const responseContent = finalState.messages[1]?.content;

      let jsonContent;
      try {
        jsonContent = JSON.parse(responseContent);
        results["color"] = jsonContent;
      } catch (parseError) {
        console.error("Response is not valid JSON:", responseContent);
        results["color"] = responseContent;
      }
    } catch (error) {
      console.error("Error processing color:", error);
    }

    return results;
  }

  console.log(`Processing ${componentFile.fileName} from style guide...`);

  const humanMessage = createHumanMessage(
    componentFile.content,
    styleGuideBase64Image,
    instruction
  );

  try {
    const finalState = await app.invoke(
      { messages: [humanMessage] },
      { recursionLimit: 10 }
    );
    const responseContent = finalState.messages[1]?.content;

    if (!responseContent) {
      console.error(`No response received for ${componentFile.fileName}`);
    } else {
      results[baseFileName] = responseContent;
      console.log(
        `Received response for ${componentFile.fileName}:`,
        responseContent
      );
    }
  } catch (error) {
    console.error(`Error processing ${componentFile.fileName}:`, error);
  }

  return results;
}
