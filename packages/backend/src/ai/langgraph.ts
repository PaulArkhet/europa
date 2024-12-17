import { END, StateGraph, START, Annotation } from "@langchain/langgraph";
import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import type { BasePage } from "../../app";
import { EOL } from "os";
import { actNode, actToolsNode } from "./agents/generator/actor";
import { reasonNode, reasonToolsNode } from "./agents/generator/planner";
import { z } from "zod";
import { observeNode, observerToolsNode } from "./agents/generator/observe";
// import { generateRouterStructure } from "./scripts/setupRoutes";
import type { Socket } from "socket.io";

export const SEQUENTIAL_TOOL_CALL_LIMIT = 9999;
export const REACT_CYCLE_LIMIT = 9999;

export type Pages = {
  name: string;
  complete: boolean;
  path?: string;
}[];

export const ReactFunctionSchema = z.object({
  name: z.string(),
  parameters: z.string(),
  returnType: z.string().optional(),
  definition: z.string(),
});

export const sleep = (ms: number): Promise<void> => {
  console.log(`sleeping ${ms}ms`);

  return new Promise((res) =>
    setTimeout(() => {
      res();
    }, ms)
  );
};

export function humanMessageWithImage(
  base64ImageString: string,
  description: string
): HumanMessage {
  return new HumanMessage({
    content: [
      { type: "image_url", image_url: { url: base64ImageString } },
      {
        type: "text",
        text: description,
      },
    ],
  });
}

export const State = Annotation.Root({
  // the router needs to complete all of these
  pageStructure: Annotation<PageStructure>({
    reducer: (_, y) => y,
  }),
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
  }),
  currentPagePath: Annotation<string>({
    reducer: (_, y) => y,
  }),
  wireframes: Annotation<{ path: string; base64ImageString: string }[]>({
    reducer: (_, y) => y,
  }),
  numToolCalls: Annotation<number>({
    reducer: (_, y) => y,
  }),
  numReactCycles: Annotation<number>({
    reducer: (_, y) => y,
  }),
  currentPlan: Annotation<string>({
    reducer: (_, y) => y,
  }),
  model: Annotation<CodeModel>({
    reducer: (_, y) => y,
  }),
  socket: Annotation<Socket>({
    reducer: (prev, _) => prev,
  }),
});

export let newErrors: string[] = [];

export function clearErrors() {
  newErrors = [];
}

export const lastErrors = (n: number) => {
  const allErrors = newErrors.concat(newErrors);
  return allErrors.slice(allErrors.length - n).join(EOL);
};

/*
page.on("console", (error) => {
    error.type() === "error" && console.log(error.text());
    error.type() === "error" &&
        newErrors.push(`${error.location()}: ${error.text()}`);
});

page.on("pageerror", (error) => {
    console.log(error);
    newErrors.push(`${error.stack}: ${error.message}`);
});
*/

function shouldReasonContinue(state: typeof State.State) {
  const { messages, numReactCycles } = state;
  const lastMessage = messages.at(-1) as AIMessage;

  if (!lastMessage) return "reason"; // wait until first msg?

  if (numReactCycles > REACT_CYCLE_LIMIT) return "markAsComplete";

  if (lastMessage.tool_calls?.length) {
    console.log("Going to reasonTools...");
    return "reasonTools";
  }
  console.log("Going to act...");

  return "act";
}

function shouldActContinue(state: typeof State.State) {
  const { messages, pageStructure, numToolCalls } = state;
  const lastMessage = messages.at(-1) as AIMessage;

  if (numToolCalls > SEQUENTIAL_TOOL_CALL_LIMIT) {
    console.log("Tool call limit reached...");
    return "resetTools";
  }

  if (lastMessage.tool_calls?.length) {
    return "actTools";
  }

  if (pageStructure.every((page) => page.complete === true)) return END;
  return "observer";
}

function shouldObserverContinue(state: typeof State.State) {
  const { messages } = state;
  const lastMessage = messages.at(-1) as AIMessage;

  if (lastMessage.tool_calls?.length) {
    return "observerTools";
  }

  return "reason";
}

const markAsCompleteNode = (state: typeof State.State) => {
  const { currentPagePath, pageStructure } = state;

  console.log("force marking as complete");

  const currentPage = pageStructure.find(
    (page) => page.path === currentPagePath
  )!;
  currentPage.complete = true;

  const nextPage = pageStructure.find((page) => !page.complete)!;
  return {
    currentPagePath: nextPage.path,
    pageStructure,
    numReactCycles: 0,
  };
};

const resetToolCountNode = () => {
  return {
    numToolCalls: 0,
  };
};

const workflow = new StateGraph(State)
  .addNode("reason", reasonNode)
  .addNode("act", actNode)
  .addNode("observer", observeNode)
  .addNode("reasonTools", reasonToolsNode)
  .addNode("actTools", actToolsNode)
  .addNode("observerTools", observerToolsNode)
  .addNode("markAsComplete", markAsCompleteNode)
  .addNode("resetTools", resetToolCountNode)
  .addEdge("resetTools", "observer")
  .addEdge("reasonTools", "reason")
  .addEdge("actTools", "act")
  .addEdge("observerTools", "observer")
  .addConditionalEdges("reason", shouldReasonContinue)
  .addConditionalEdges("act", shouldActContinue)
  .addConditionalEdges("observer", shouldObserverContinue)
  .addEdge(START, "reason");

const app = workflow.compile();

type PageDetails = { complete: boolean; path?: string };

export type PageStructure = (PageDetails & BasePage)[];

type ReactFunction = z.infer<typeof ReactFunctionSchema>;

export type CodeModel = { functions: ReactFunction[]; mainCode: string };

export function codeModelToString(model: CodeModel) {
  const functionStrings = model.functions.map((functionDef) => {
    let functionString = `function ${functionDef.name}(${functionDef.parameters})${functionDef.returnType ? `: ${functionDef.returnType}` : ""} {
  ${functionDef.definition}
}`;
    return functionString;
  });

  let allFuncs = functionStrings.join("\n\n");
  allFuncs += `\n\n ${model.mainCode}`;
  return allFuncs;
}

export async function runApp(pageStructure: BasePage[], socket: Socket) {
  const fullPagestructure = pageStructure.map((page, index) => ({
    base64ImageString: page.base64ImageString,
    name: page.name.replace(" ", "-"),
    complete: false,
    path: index === 0 ? "/" : `/${page.name.replace(" ", "-")}`,
  })) as PageStructure;

  await app.invoke(
    {
      messages: [],
      model: {
        functions: [
          {
            name: "App",
            parameters: "",
            definition: `
  return (
    <div>
      <h1>Hello, React!</h1>
      <p>Edit the code to see changes.</p>
    </div>
  );
`,
          },
        ],
        mainCode: `
ReactDOM.render(<App />, document.getElementById('root'));

`,
      },
      pageStructure: fullPagestructure.map((page) => {
        const newPage = { ...page };
        delete (newPage as any).base64ImageString;
        return newPage;
      }),
      currentPagePath: "/",
      wireframes: fullPagestructure.map((page) => ({
        base64ImageString: page.base64ImageString,
        path: page.path,
      })),
      errors: [],
      numToolCalls: 0,
      numReactCycles: 0,
      socket,
    },
    { recursionLimit: 100 }
  );
}
