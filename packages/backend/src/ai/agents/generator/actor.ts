import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { BedrockChat } from "@langchain/community/chat_models/bedrock";
import { generateClickTool, navigateTool } from "../../tools/observationTools";
import {
  clearErrors,
  codeModelToString,
  lastErrors,
  SEQUENTIAL_TOOL_CALL_LIMIT,
  sleep,
  type State,
} from "../../langgraph";
import { AIMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { mightFail, mightFailSync } from "might-fail";
import { generateUpdatePagesTools } from "../../tools/stateTools";
import { humanMessageWithImage } from "../../langgraph";
import { generateCodeTools } from "../../tools/filesystemTools";

export const arkhetTeamInfoPrompt = `
   <arkhet_team_info>

   - arkhet is an advanced AI organization created by the Arkhet corporation.
   - arkhet consists of arkhet-planner, arkhet-actor and arkhet-observer.
   - arkhet-planner observes and analyzes situations and problems and comes up with step-by-step planning and thinking.
   - arkhet-actor uses the given plan and its best judgement to edit code to fulfill the plan.
   - arkhet-observer records what has changed, improved or worsened in the last edit.

   </arkhet_team_info>
`;

// - arkhet ALWAYS uses as many existing components as possible, such as the <Button /> component.

export const arkhetGeneralInfo = `
   <arkhet_general_info>
     - arkhet is tasked with creating a prototype react application from a set of low fidelity wireframes.
     - arkhet ALWAYS uses inline styles.
     - arkhet NEVER imports any libraries.
     - arkhet ALWAYS uses typescript.

     - arkhet ALWAYS builds its REACT projects using a singular tsx file broken up into components within the same file.
     - arkhet ALWAYS "mocks" page navigation using useState and conditional rendering in a topmost Layout component.
     - arkhet NEVER concerns itself with navigation using URLs, as the output code is rendered in a URL-less iframe.
     - arkhet's knowledge spans multiple frameworks and libraries but has a focus on React and modern web development.
     - arkhet ALWAYS attempts to improve the fidelity of React page beyond the low-fidelity wireframe given to it.
     - arkhet NEVER leaves placeholder text and ALWAYS comes up with text that "looks" as real as possible.
   </arkhet_general_info>
`;
const prompt = ChatPromptTemplate.fromMessages([
  "system",
  `
  <arkhet_info>

    ${arkhetTeamInfoPrompt}

    ${arkhetGeneralInfo}

   <arkhet_actor_info>
   - You are arkhet-actor, an extremely advanced AI programmer.
  
   - arkhet-actor operates on a single tsx react file as the entire project it works on
   - All functions in this file are considered their own "section" of code.
   - arkhet-actor has access to tools to edit, create or delete functions.
   - arkhet-actor passes in the exact name of the function to modify, edit, delete its contents.
   - arkhet-actor will use functions to create all react components.
   - arkhet-actor will use functions to create reusable sections of code that are shared across the project.
   - arkhet-actor will ALWAYS use the (props: {{ foo: bar }}) syntax for react component functions.
   - arkhet-actor will NEVER use the ({{ foo }}: {{ foo: bar }}) syntax for react component functions.
   - arkhet-actor will NEVER use const \`functionName = () => {{}}\` syntax for its top level functions.
   - arkhet-actor will ALWAYS use \`function functionName() {{}} \` syntax for its top level functions.
   - arkhet-actor will ALWAYS use PascalCase for functions that do return JSX, known as Component.
   - arkhet-actor will ALWAYS use camelCase for any other functions.
   - arkhet-actor can use \`functionName = () => {{}}\` syntax for any functions not in global scope.
   - arkhet-actor will NEVER include lines of code outside of the function definition when creating or updating functions.
   - arkhet-actor will NEVER include a new call to ReactDOM.render.
   - arkhet-actor NEVER edits or uses tools more than 8 times in a row, as the arkhet-observer needs to review your work.
   - arkhet-actor will ALWAYS stop using tools and give an explanation of what it did if the plan seems to have been completed.
   - arkhet-actor will NEVER use placeholder image text and will ALWAYS fill images with actual links to images, even if they're sample images.
   - arkhet-actor will NEVER implement pages that aren't included in the plan. Follow the plan and the plan only.
   
   Example component:
   \`\`\`jsx

    function Example(props: {{ foo: bar }}) {{
      return (
        <div>
          <Foo />
          <Bar />
        </div>
      )
    }}

   \`\`\`

   </arkhet_actor_info>

  </arkhet_info>

  <foundation_model_component_documentation>

  When you see the robot icon in the wireframe, refer to these docs:

  You are given in the components / folder, a react component called "FoundationModel". The foundation model
  is an AI chat component. You can supply some configuration to determine how it should behave and look.
  
  This component takes the 
  following props:

    system: string; // system message for the AI chatbot
    placeholder: string; // placeholder text in input component.
    firstMessage?: string; // optional first message that the AI can send the user to start conversation.
    style: 
      userBubble: (background: string; textColor: string) // user text bubble styling
      assistant: (textColor: string ); // assistant chat has no background, but can have a text color.
      submitButton: ( textColor: string; backgroundColor: string); // submit button styling

    The component will fill it's parent height and width. Please make sure to restrict it's height so that
    chat messages don't cause it to overflow.

  </foundation_model_documentation>
  `,
  new MessagesPlaceholder("messages"),
]);

function getAllTools(state: typeof State.State) {
  return [
    ...generateUpdatePagesTools(state.pageStructure),
    ...generateCodeTools(state),
    generateClickTool(state.socket),
    navigateTool,
  ];
}

const generatorLLM = new BedrockChat({
  model: "anthropic.claude-3-5-sonnet-20240620-v1:0",
  region: process.env.BEDROCK_AWS_REGION,
  credentials: {
    accessKeyId: process.env.BEDROCK_AWS_ACCESS_KEY!,
    secretAccessKey: process.env.BEDROCK_AWS_SECRET!,
  },
  temperature: 1,
});

export function getNLast(array: Array<any>, numBack: number) {
  return array.slice(array.length > numBack ? array.length - numBack : 0);
}

export const actNode = async (state: typeof State.State) => {
  const {
    messages,
    currentPagePath,
    wireframes,
    numToolCalls,
    numReactCycles,
    currentPlan,
    pageStructure,
  } = state;
  console.log("Actor agent thinking...");

  const currentWireframe = wireframes.find(
    (wireframe) => wireframe.path === currentPagePath
  )?.base64ImageString;
  if (!currentWireframe)
    throw new Error(
      `currentPagePath: ${currentPagePath} does not exist in pageStructure: ${JSON.stringify(wireframes)}`
    );

  const generatorWithTools = generatorLLM.bindTools(getAllTools(state));
  const codeGenerationChain = prompt.pipe(generatorWithTools);

  let numFails = 0;
  while (true) {
    const numBack =
      999 + (scanForInvalidTools(state, 999) ? 1 : 0) + numFails;
    const { error: genError, result: response } = await mightFail(
      codeGenerationChain.invoke({
        messages: [
          humanMessageWithImage(
            currentWireframe,
            `wireframe of the currently selected page path: ${currentPagePath}`
          ), // wireframe
          new HumanMessage({
            content: `Current code: ${codeModelToString(state.model)}`,
          }),
          new HumanMessage({
            content: `Current page structure: ${JSON.stringify(pageStructure)}`,
          }),
          ...messages.slice(
            messages.length > numBack
              ? messages.length - numBack
              : 0
          ),
          new HumanMessage({ content: currentPlan }),
          new HumanMessage({
            content: `You've made ${numToolCalls} sequential tool calls.
                                     ${numToolCalls > 8 ? "You've made more than 6 tool calls in a row. Stop using tools and allow other agents of the team to review your work!" : ""} 
                                     `,
          }),
          /*
humanMessageWithImage(
await getScreenshot(state.socket),
"Current react page"
),
*/
        ],
      })
    );

    if (genError) {
      numFails++;
      if (numFails === 5) {
        throw new Error("Maximum retry limit hit.");
      }
      console.log(
        getNLast(messages, 5 + (scanForInvalidTools(state, 5) ? 1 : 0))
      );
      console.log(scanForInvalidTools(state, 5));
      console.error(genError);
      await sleep(Math.pow(numFails, 2) * 1000 - 1000);
      continue;
    }

    const isToolCall = !((response as AIMessage).tool_calls?.length === 0);
    if (isToolCall)
      console.log((response as AIMessage).tool_calls![0].name);
    else console.log(response.content);

    console.log("Number of tool calls ", numToolCalls);

    clearErrors();
    return {
      messages: [
        !isToolCall
          ? new HumanMessage({ content: response.content })
          : response,
      ],
      numToolCalls: isToolCall ? numToolCalls + 1 : 0,
      numReactCycles: !isToolCall ? numReactCycles + 1 : numReactCycles,
    };
  }
};

export function scanForInvalidTools(
  state: typeof State.State,
  numSlices: number
) {
  // refactor this abomination!
  return (
    state.messages.at(-numSlices) instanceof ToolMessage ||
    state.messages.slice(0, state.messages.length - numSlices).some(
      (message, index) =>
        message._getType() === "ai" && // message is an ai msg
        (message as AIMessage).tool_calls!.length > 0 && // message has tool call
        !(state.messages[index + 1] instanceof ToolMessage) // next msg is not a tool message
    )
  );
}

export async function actToolsNode(state: typeof State.State) {
  const toolNode = new ToolNode(getAllTools(state));

  const result = await toolNode.invoke({
    ...state,
  });

  const { numReactCycles } = state;

  const { result: pageStructure, error } = mightFailSync(() =>
    JSON.parse(result.messages.content)
  );
  const isPageTool =
    !error &&
    pageStructure instanceof Array &&
    pageStructure[0] !== undefined &&
    pageStructure[0].name !== undefined;

  const stateStep =
    result.messages[0].name === "navigate"
      ? {
        currentPagePath: result.messages[0].content,
        messages: result.messages,
      }
      : {
        pageStructure: isPageTool
          ? pageStructure
          : state.pageStructure,
        messages: result.messages,
        numReactCycles: isPageTool ? 0 : numReactCycles,
      };

  return stateStep;
}
