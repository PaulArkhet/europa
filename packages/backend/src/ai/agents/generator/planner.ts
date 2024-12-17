import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { BedrockChat } from "@langchain/community/chat_models/bedrock";
// import { getScreenshot } from "../../tools/observationTools";
import {
  humanMessageWithImage,
  clearErrors,
  lastErrors,
  type State,
  newErrors,
  codeModelToString,
} from "../../langgraph";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { mightFail } from "might-fail";
import { EOL } from "os";
import {
  arkhetGeneralInfo,
  arkhetTeamInfoPrompt,
  scanForInvalidTools,
} from "./actor";
import { navigateTool } from "../../tools/observationTools";

/*
  As you complete a page, mark it as completed using the completePage tool. Don't move on
  until you've marked the page as complete!

  Once a page is complete, mark it as complete. Once all pages are complete, a reviewer will review your work.

  Use TailwindCSS. Don't import any libraries.

  You are given a set of components in the components/ folder. It's imperative that you use
  these components as you build out the application. Naturally, using these components will create
  some variance from the wireframes, but that's okay. The wireframes exist only go give a general layout.

*/

const prompt = ChatPromptTemplate.fromMessages([
  "system",
  `
  <arkhet_info>

    ${arkhetTeamInfoPrompt}
    ${arkhetGeneralInfo}

   <arkhet_planner_info>
   - You are arkhet-planner, an extremely advanced AI planner with strong programming knowledge.
   - arkhet-planner creates a plan for other members of the team to use, specifically arkhet-actor
   - arkhet-planner understands the constraints that arkhet-actor has to work with, outlined in the general info section
   - arkhet-planner understands that the goal is to create a prototype
   - arkhet-planner NEVER repeats the same plan as the last iteration
   - arkhet-planner ALWAYS gives specific instructions that lead to significant improvements over the last iteration
   - arkhet-planner NEVER gives code examples; that should be left to arkhet-actor.
   - arkhet-planner ALWAYS describes the wireframe screenshot it sees before giving its plan.
   - arkhet-planner uses the navigate tool if it needs to see a different page as it formulates a new plan.


   This plan should only include one main action or task, for 

    <plan_examples>
      ## Example 1

        Previous Action: I edited the home page component and created a basic layout
        from the give wireframe.

        Observed effect: The screenshot of the live react application shows
        a page that mostly matches the wireframe. The hero image, however, is
        taking up the full width of the page, unlike the wireframe.

        Problem: The wireframe shows a hero image on the left, but the current image takes up the full width.

        Step by step reasoning: 

        1. Something is wrong with our inline styles.
        2. It seems we're using the wrong flex in the parent component
        3. We should add the flex-row property and styles in the div in the Home function

        Action: Use the edit tool to edit the flex-row property of the div containing the image.

      ## Example 2

        Previous Action: I corrected some styling issues on this login page.
        The password and username input fields now have placeholders as shown
        in the wireframe.

        Observed effect: The input fields indeed now show placeholders for the
        user, improving the user experience and clarity of which input are for
        what. The wireframe now looks like a high fidelity version of the
        wireframe.

        Problem: We've worked on this page and it looks like a high fidelity version of the given wireframe.

        Step by step reasoning: 

        1. We've succesfully implemented this page.
        2. Let's mark it as complete!

        Action: Use the mark as complete page tool to mark the Home page as complete, and we'll move on to another page!
    </plan_examples>
   </arkhet_planner_info>
  </arkhet_info>



  `,
  new MessagesPlaceholder("messages"),
]);

export const sleep = (ms: number): Promise<void> => {
  console.log(`sleeping ${ms}ms`);

  return new Promise((res) =>
    setTimeout(() => {
      res();
    }, ms)
  );
};

function getAllTools(state: typeof State.State) {
  return [navigateTool];
}

const reasonLLM = new BedrockChat({
  model: "anthropic.claude-3-5-sonnet-20240620-v1:0",
  region: process.env.BEDROCK_AWS_REGION,
  credentials: {
    accessKeyId: process.env.BEDROCK_AWS_ACCESS_KEY!,
    secretAccessKey: process.env.BEDROCK_AWS_SECRET!,
  },
  temperature: 1,
});

export const reasonNode = async (state: typeof State.State) => {
  const { messages, currentPagePath, pageStructure, wireframes } = state;
  console.log("Reason agent thinking...");

  const currentWireframe = wireframes.find(
    (wireframe) => wireframe.path === currentPagePath
  )?.base64ImageString;
  if (!currentWireframe)
    throw new Error(
      `currentPagePath: ${currentPagePath} does not exist in pageStructure: ${JSON.stringify(wireframes)}`
    );

  const generatorWithTools = reasonLLM.bindTools(getAllTools(state));
  const codeGenerationChain = prompt.pipe(generatorWithTools);

  let numFails = 0;
  while (true) {
    const numBack = 9999 + (scanForInvalidTools(state, 5) ? 1 : 0);
    const { error: genError, result: response } = await mightFail(
      codeGenerationChain.invoke({
        messages: [
          ...messages.slice(
            messages.length > numBack
              ? messages.length - numBack
              : undefined
          ),
          new HumanMessage({
            content: `Current code: ${codeModelToString(state.model)}`,
          }),
          new HumanMessage({
            content: `All Errors: ${lastErrors(10)}`,
          }),
          new HumanMessage({
            content: `Current Page Structure: \`\`\`json ${EOL} ${JSON.stringify(
              pageStructure.map((page) => ({
                ...page,
              }))
            )} ${EOL}\`\`\``,
          }),
          humanMessageWithImage(
            currentWireframe,
            `wireframe of the currently selected page path: ${currentPagePath}`
          ), // wireframe
          /*
humanMessageWithImage(
await getScreenshot(state.socket),
`Current react page at url: ${state.currentPagePath}`
),
*/
        ],
      })
    );

    //  console.log(messages);

    if (genError) {
      numFails++;
      if (numFails === 5) {
        throw new Error("Maximum retry limit hit.");
      }
      console.error(genError);
      await sleep(Math.pow(numFails, 2) * 1000 - 1000);
      continue;
    }

    const isToolCall = !((response as AIMessage).tool_calls?.length === 0);
    if (isToolCall)
      console.log((response as AIMessage).tool_calls![0].name);
    else console.log(response.content);

    clearErrors();

    if (isToolCall) {
      return {
        messages: [response],
      };
    }

    return {
      currentPlan: response.content,
      messages: response,
    };
  }
};

export async function reasonToolsNode(state: typeof State.State) {
  const toolNode = new ToolNode(getAllTools(state));

  const result = await toolNode.invoke({
    ...state,
  });

  const stateStep =
    result.messages[0].name === "navigate"
      ? {
        currentPagePath: result.messages[0].content,
        messages: result.messages,
      }
      : {
        messages: result.messages,
      };

  return stateStep;
}
