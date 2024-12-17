import { tool } from "@langchain/core/tools";
import type { Socket } from "socket.io";
import { z } from "zod";

// const DEFAULT_SIZE = { width: 1900, height: 1000 };

export async function getScreenshot(socket: Socket) {
  return new Promise<string>((res) => {
    socket.emit("get-screenshot", (response: string) => {
      // console.log(response);
      res(response);
    });
  });
}

function clickElement(input: { selector: string }, socket: Socket) {
  return new Promise<string>((res) => {
    socket.emit(
      "click-element",
      input.selector,
      (
        successOrError:
          | { type: "success" }
          | { type: "error"; msg: string }
      ) => {
        if (successOrError.type === "success")
          return res("Click success!");
        res(`Click failed: ${successOrError.msg}`);
      }
    );
  });
}

export function generateClickTool(socket: Socket) {
  return tool((input) => clickElement(input, socket), {
    name: "click",
    description: `
  Click an element on the page based on the selector passed in.
  Use this tool when you wish to test interactions in the app, such as 
  clicking a button, hyperlink, focusing an input field, so on.
  `,
    schema: z.object({
      selector: z.string().describe(`
     A query selector, which will specify which element to click.
        Usage:

        selector: #custom-id -> selects element with "custom-id"
        .customClass -> selects elements with "customClass"
        If multiple elements are found, the first one will be clicked,
        or an error may be thrown. Make sure your selectors are unique!
    `),
    }),
  });
}

export const navigateTool = tool(
  (input: { path: string }) => {
    return input.path;
  },
  {
    name: "navigate",
    description: `
    Use this tool when you want to see a different wirefame in the app.
    Refer to the page structure given to you to get the correct path.
    `,
    schema: z.object({
      path: z.string().describe(`
     A path to navigate to, relative to the root of the app.
       Usage:

       path: /blog/34/info -> result: localhost:4040/blog/43/info
       / -> localhost:4040/
       /example" -> localhost:4040/example
                             `),
    }),
  }
);
