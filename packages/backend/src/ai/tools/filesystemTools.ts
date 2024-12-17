import { tool } from "@langchain/core/tools";
import type { Socket } from "socket.io";
import { z } from "zod";
import { codeModelToString, State, type CodeModel } from "../langgraph";

const ReactFunctionSchema = z.object({
  name: z
    .string()
    .describe("Name of the function. Use PascalCase for react components."),
  parameters: z
    .string()
    .optional()
    .describe(
      `Parameters. Leave empty for no parameters. Example with params: "name: string, foo: string" Example without: "" `
    ),
  returnType: z
    .string()
    .optional()
    .describe(`: will be included automatically. Example: "string"`),
  definition: z
    .string()
    .optional()
    .describe(
      `Full function definition inside brackets. {} will be included automatically.`
    ),
});

export function generateCodeTools(state: typeof State.State) {
  return [
    tool(
      (params: UpdateToolParams) => updateFunctionToolImpl(params, state),
      {
        name: "updateFunctionCode",
        description: `
            <instructions>
              Call to replace the code of a function by passing the new function definition.

              This tool must be called with new code to replace the old code. If no new code is passed,
              you will receive an invalid arguments error and be asked to try again.
            </instructions>
    `,
        schema: updateToolSchema,
      }
    ),
    tool(
      (params: UpdateToolParams) =>
        createNewFunctionToolImpl(params, state),
      {
        name: "createNewFunction",
        description: `
            <instructions>

              - arkhet calls this to add a new function name and the code it consists of.
              - arkhet NEVER calls this function with a name of a function that already exists.
              - arkhet ALWAYS makes sure new functions have a purpose
              - arkhet ALWAYS makes new functions to break up repeated logic, as a professional programmer would.

            </instructions>
    `,
        schema: updateToolSchema,
      }
    ),
  ];
}

const updateToolSchema = ReactFunctionSchema.describe(
  "Schema to update function with. All values will be replaced if a matching name is found."
);

const createNewFunctionToolSchema = ReactFunctionSchema.describe(
  "Schema for new function."
);

const deleteFunctionToolSchema = z.object({
  functionName: z.string()
    .describe(`The name of for the function to delete. Use this to permanently remove a function
    declaration and it's implementation. 
`),
});

type CreateNewFunctionToolParams = z.infer<typeof createNewFunctionToolSchema>;

export const updateFunctionToolImpl = async (
  input: UpdateToolParams,
  state: { model: CodeModel; socket: Socket }
): Promise<string> => {
  console.log("Agent modifying function name: " + input.name);

  const functionDefIndex = state.model.functions.findIndex(
    (func) => func.name === input.name
  );

  if (functionDefIndex === -1)
    return `No function with ${input.name} exists to update.`;

  const functionReference = state.model.functions[functionDefIndex];

  if (input.definition) functionReference.definition = input.definition;
  if (input.parameters) functionReference.parameters = input.parameters;
  if (input.returnType) functionReference.returnType = input.returnType;

  const updatedCode = codeModelToString(state.model);
  const result = await new Promise<
    { type: "success" } | { type: "error"; msg: string }
  >((res) => {
    state.socket.emit(
      "new-code",
      updatedCode,
      (result: { type: "success" } | { type: "error"; msg: string }) => {
        res(result);
      }
    );
  });
  console.log("new code:", updatedCode);
  if (result.type === "success") return "Code has been succesfully updated.";
  console.error(`Error when compiling: ${result.msg}`);
  return `Error when compiling: ${result.msg}`;
};

type UpdateToolParams = z.infer<typeof updateToolSchema>;

const createNewFunctionToolImpl = async (
  input: CreateNewFunctionToolParams,
  state: { model: CodeModel; socket: Socket }
): Promise<string> => {
  const exists =
    state.model.functions.findIndex((func) => func.name === input.name) !==
    -1;
  if (exists) {
    return `Function name already exists: ${input.name}`;
  }
  state.model.functions.push(input);

  const updatedCode = codeModelToString(state.model);
  const result = await new Promise<
    { type: "success" } | { type: "error"; msg: string }
  >((res) => {
    state.socket.emit(
      "new-code",
      updatedCode,
      (result: { type: "success" } | { type: "error"; msg: string }) => {
        res(result);
      }
    );
  });
  console.log("new code:", updatedCode);
  if (result.type === "success") return "New function created";
  console.error(`Error when compiling: ${result.msg}`);
  return `Error when compiling: ${result.msg}`;
};

type DeleteToolParams = z.infer<typeof deleteFunctionToolSchema>;

export const deleteFunctionToolImpl = (
  input: DeleteToolParams,
  state: { model: CodeModel; socket: Socket }
) => {
  const exists =
    state.model.functions.findIndex(
      (func) => func.name === input.functionName
    ) !== -1;
  if (!exists) {
    return `No such function to delete: ${input.functionName}`;
  }

  const index = state.model.functions.findIndex(
    (func) => func.name === input.functionName
  );

  state.model.functions.splice(index, 1);
  return `Function ${input.functionName} deleted.`;
};
