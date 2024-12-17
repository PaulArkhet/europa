// what have we learned:
// langgraph is a poor api on some good ideas
// graphs, transformation of "state" through graphs
// as an application evolves isn't horrible
//
// we can use such a method to define a larger llm powered system
// the problems arise with 3 major areas;
//
// 1. Done
// tool use is currently highly confusing and operates poorly with
// the graph "state". it's hard to allow tools to modify and access state
//
// 2. Done
// runtime errors when setting up calls to a model with superficial, non-problem
// related areas such as:
//  - tool call not followed by tool use type
//  - 2 AI messages in a row
//
// 3.
// Losing context when passing data to claude in message format,
// images exarcebate the problem, as they take up more tokens.
// Claude can forgot or poorly follow instructions setup earlier in a message
// block, and a lot of runtime testing of the model needs to be done
//
// Additionally, running the entire model just to test a single interaction is wasteful
// in terms of time and tokens
//
// Need someway for states to be preserved after a run so we can resume an interaction
// at any point and debug where needed. Mostly done
//
// Improvements
//
// Tools use should have more direct access to state in terms of modifying and accessing it
// at runtime, both for display to claude, but also to make logical transformations of
// graph state Done
//
// A tuple data structure can represent a call-response sequence, enforcing these constraints. Done
//
// Hard to say how, but we would ideally have a tokenizer built in? and some ability to "prioritize"
// messages based on token count and context, especially when these different messages don't temporaly
// flow between each other. It's hard to know what the token count is at runtime...
//
// Additionally, Done - Agents are fully described by their claude settings. Should make into a service!
// Have data structures for "Agents", "Messages" and so forth that are stateless functional constructs
// because we should have nice things. Also, OOP patterns in langgraph make me cry.

import { AnthropicBedrock } from '@anthropic-ai/bedrock-sdk';
import { type ZodTypeAny, z } from 'zod';
export type ZodObjectAny = z.ZodObject<any, any, any, any>;
import {
  createMessage,
  getFirst,
  getLast,
  unwrapMessages,
  type AssistantMessage,
  type Message,
  type UserMessage,
} from './messages';
import { pipe, Option, Match, Effect, Either } from 'effect';
import { type Tool } from './toolUse';
import type { APIPromise } from '@anthropic-ai/sdk/core.mjs';

export const defaultClaudeSettings = {
  model: 'anthropic.claude-3-5-sonnet-20240620-v1:0',
  maxTokens: 1000,
};

const client = new AnthropicBedrock({
  awsSecretKey: process.env.BEDROCK_AWS_SECRET!,
  awsAccessKey: process.env.BEDROCK_AWS_ACCESS_KEY!,
  awsRegion: process.env.BEDROCK_AWS_REGION,
});

type TextResponse = { type: 'text'; text: string };
type ToolUse = { type: 'tool_use'; input: any; name: string };

type AssistantResponse = {
  content: [TextResponse] | [TextResponse, ToolUse] | [ToolUse];
  id: string;
  model: string;
  role: 'assistant';
  stop_reason: string;
  stop_sequence: null;
  type: 'message';
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
};

type ClaudeSettings = {
  model: string;
  maxTokens: number;
};

type ClaudeFormatParams<F extends ZodObjectAny> = {
  format: F;
  retryLimit: number;
};

type BaseParams = {
  claudeSettings: ClaudeSettings;
  system: string;
  messages: Message;
  retryCount: number;
};

type CallClaude = {
  type: 'default';
} & BaseParams;

type ToolChoice =
  | { type: 'tool'; name: string }
  | { type: 'auto' }
  | { type: 'any' };

type CallClaudeTools = {
  type: 'tools';
  tools: Tool[];
  toolChoice: ToolChoice;
} & BaseParams;

type CallClaudeWithFormat<F extends ZodObjectAny> = {
  type: 'format';
  jsonFormat: ClaudeFormatParams<F>;
} & BaseParams;

type ClaudeBody = {
  model: BaseParams['claudeSettings']['model'];
  max_tokens: BaseParams['claudeSettings']['maxTokens'];
  messages: BaseParams['messages'];
  system: string;
};

type ClaudeBodyWithTools = {
  tools: Tool[];
  tool_choice: ToolChoice;
} & ClaudeBody;

function getRequestBody<F extends ZodObjectAny>(
  params: CallClaudeWithFormat<F> | CallClaude | CallClaudeTools
) {
  return pipe(
    params,
    Match.type<CallClaudeWithFormat<F> | CallClaude | CallClaudeTools>().pipe(
      Match.when({ type: 'format' }, (params) =>
        Either.left(getResponsePrompt(params.jsonFormat.format))
      ),
      Match.when({ type: 'default' }, (params) => Either.left(params.system)),
      Match.when({ type: 'tools' }, (params) =>
        Either.right({
          tools: params.tools,
          tool_choice: params.toolChoice,
        })
      ),
      Match.exhaustive
    ),
    Either.mapBoth({
      onLeft: (system) => ({
        model: params.claudeSettings.model,
        max_tokens: params.claudeSettings.maxTokens,
        messages: params.messages,
        system,
      }),
      onRight: (tools) =>
        ({
          model: params.claudeSettings.model,
          max_tokens: params.claudeSettings.maxTokens,
          messages: params.messages,
          system: params.system,
          ...tools,
        }) as ClaudeBodyWithTools,
    })
  );
}

type StringifyError = {
  readonly _tag: 'stringify';
};

const StringifyError = (): StringifyError => ({ _tag: 'stringify' });

type FetchError = {
  readonly _tag: 'fetch';
  error: Error;
};

const FetchError = (error: Error): FetchError => ({ _tag: 'fetch', error });

type JsonFetchError = {
  readonly _tag: 'jsonFetch';
  error: Error;
};

const JsonFetchError = (error: Error): JsonFetchError => ({
  _tag: 'jsonFetch',
  error,
});

function makeClaudeAPICall(body: ReturnType<typeof getRequestBody>) {
  return pipe(body, Either.merge, (body) =>
    Effect.tryPromise({
      try: () =>
        client.messages.create({
          ...body,
          messages: unwrapMessages(body.messages),
        }) as APIPromise<AssistantResponse>,
      catch: (error) => FetchError(error as Error),
    })
  );
}

function handleRetryParse<F extends ZodObjectAny>(
  error: string,
  params: CallClaudeWithFormat<F>,
  assistantResponse: any
) {
  return parseWithFormat(
    {
      ...params,
      retryCount: params.retryCount - 1,
      messages: pipe(params.messages, getLast, (last) => {
        const newMessage = createMessage<UserMessage>({
          role: 'user',
          content: error,
        });
        newMessage.prev = Option.some(last as AssistantMessage);
        last.next = Option.some(last as AssistantMessage);
        return getFirst(params.messages);
      }),
    },
    assistantResponse
  );
}

function handleJsonOrError<F extends ZodObjectAny>(
  jsonOrError: Either.Either<any, RetryLimitError | JsonParseError>,
  params: CallClaudeWithFormat<F>,
  assitantResponse: any
) {
  return Either.match(jsonOrError, {
    onRight: (json: any) =>
      Effect.tryPromise({
        try: () => params.jsonFormat.format.parseAsync(json) as z.output<F>,
        catch: (e) => JsonParseError(e as Error),
      }),
    onLeft: (error) =>
      handleRetryParse(
        `Your response gave the following error:
              \`\`\`
              ${error}
              \`\`\`

              Please correct your mistakes and try again.`,
        params,
        assitantResponse
      ),
  });
}

type JsonParseError = {
  readonly _tag: 'jsonParse';
  error: Error;
};

const JsonParseError = (error: Error): JsonParseError => ({
  _tag: 'jsonParse',
  error,
});

function parseWithFormat<F extends ZodObjectAny>(
  params: CallClaudeWithFormat<F>,
  assistantResponse: any
): Effect.Effect<z.output<F>, JsonParseError> {
  return pipe(
    params,
    (params): Effect.Effect<string, RetryLimitError> =>
      params.retryCount === 0
        ? Effect.fail(RetryLimitError())
        : Effect.succeed(assistantResponse.content[0].text),
    Effect.flatMap((responseText) =>
      pipe(
        responseText,
        (responseText) => Effect.try(() => JSON.parse(responseText)),
        Effect.mapError(JsonParseError)
      )
    ),
    Effect.either,
    Effect.flatMap((jsonOrError) =>
      handleJsonOrError(jsonOrError, params, assistantResponse)
    )
  );
}

function getResponsePrompt(format: ZodObjectAny): string {
  const prompt = `
    ## Response Format
    To answer, you've been given the following response format:

    Please respond with only the object format as a JSON parsable string.
    Don't give any reasoning or explanations.


    ${format.description ? `Description of object: ${format.description}` : ''}
    Descriptions of fields:

    ## Format
    ${schemaToString(format)}
    `;

  return prompt;
}

function schemaToString(schema: ZodTypeAny): string {
  const typeName = schema._def.typeName;

  // Get the description if available
  const description = schema.description ? ` // ${schema.description}` : '';

  switch (typeName) {
    case z.ZodFirstPartyTypeKind.ZodString:
      return `string${description}`;
    case z.ZodFirstPartyTypeKind.ZodNumber:
      return `number${description}`;
    case z.ZodFirstPartyTypeKind.ZodBoolean:
      return `boolean${description}`;
    case z.ZodFirstPartyTypeKind.ZodLiteral:
      return `${JSON.stringify(schema._def.value)}${description}`;
    case z.ZodFirstPartyTypeKind.ZodEnum:
      return `${schema._def.values.map((v: any) => JSON.stringify(v)).join(' | ')}${description}`;
    case z.ZodFirstPartyTypeKind.ZodUnion:
      return `(${schema._def.options.map(schemaToString).join(' | ')})${description}`;
    case z.ZodFirstPartyTypeKind.ZodArray:
      return `Array<${schemaToString(schema._def.type)}>${description}`;
    case z.ZodFirstPartyTypeKind.ZodObject:
      const shape = schema._def.shape();
      const fields = Object.keys(shape)
        .map((key) => `${key}: ${schemaToString(shape[key])}`)
        .join(',\n');
      return `{\n${fields}\n}${description}`;
    case z.ZodFirstPartyTypeKind.ZodOptional:
      return `${schemaToString(schema._def.innerType)} | undefined${description}`;
    case z.ZodFirstPartyTypeKind.ZodNullable:
      return `${schemaToString(schema._def.innerType)} | null${description}`;
    case z.ZodFirstPartyTypeKind.ZodDefault:
      return `${schemaToString(schema._def.innerType)} // default: ${JSON.stringify(schema._def.defaultValue())}${description}`;
    case z.ZodFirstPartyTypeKind.ZodAny:
      return `any${description}`;
    case z.ZodFirstPartyTypeKind.ZodUnknown:
      return `unknown${description}`;
    case z.ZodFirstPartyTypeKind.ZodVoid:
      return `void${description}`;
    case z.ZodFirstPartyTypeKind.ZodNever:
      return `never${description}`;
    case z.ZodFirstPartyTypeKind.ZodTuple:
      const items = schema._def.items.map(schemaToString).join(', ');
      return `[${items}]${description}`;
    case z.ZodFirstPartyTypeKind.ZodRecord:
      return `{ [key: string]: ${schemaToString(schema._def.valueType)} }${description}`;
    case z.ZodFirstPartyTypeKind.ZodMap:
      return `Map<${schemaToString(schema._def.keyType)}, ${schemaToString(schema._def.valueType)}>${description}`;
    case z.ZodFirstPartyTypeKind.ZodSet:
      return `Set<${schemaToString(schema._def.valueType)}>${description}`;
    case z.ZodFirstPartyTypeKind.ZodDate:
      return `Date${description}`;
    case z.ZodFirstPartyTypeKind.ZodFunction:
      const args = schema._def.args.items.map(schemaToString).join(', ');
      const returns = schemaToString(schema._def.returns);
      return `(${args}) => ${returns}${description}`;
    case z.ZodFirstPartyTypeKind.ZodLazy:
      return `Lazy<${schemaToString(schema._def.getter())}>${description}`;
    case z.ZodFirstPartyTypeKind.ZodPromise:
      return `Promise<${schemaToString(schema._def.type)}>${description}`;
    case z.ZodFirstPartyTypeKind.ZodEffects:
      return schemaToString(schema._def.schema); // Simplify by showing the base schema
    case z.ZodFirstPartyTypeKind.ZodBranded:
      return schemaToString(schema._def.type); // Simplify by showing the base schema
    case z.ZodFirstPartyTypeKind.ZodNativeEnum:
      return `Enum${description}`; // Could be expanded if needed
    default:
      return `UnknownType${description}`;
  }
}

export function callClaudeWithoutFormat(params: CallClaude) {
  return pipe(
    params,
    callClaude,
    (result) => Effect.retry(result, { times: params.retryCount }) // handle this, json or request error!
  );
}

export function callClaudeWithFormat<F extends ZodObjectAny>(
  params: CallClaudeWithFormat<F>
) {
  return pipe(
    params,
    callClaude,
    Effect.flatMap((assistantResponse) =>
      parseWithFormat(params, assistantResponse)
    )
  );
}

type InvalidToolNameError = {
  readonly _tag: 'invalidToolName';
  error: Error;
};

const InvalidToolNameError = (error: Error): InvalidToolNameError => ({
  _tag: 'invalidToolName',
  error,
});

type RetryLimitError = {
  readonly _tag: 'retryLimit';
};

const RetryLimitError = (): RetryLimitError => ({
  _tag: 'retryLimit',
});

type InvalidToolCallError = {
  readonly _tag: 'invalidToolCall';
};

const InvalidToolCallError = (): InvalidToolCallError => ({
  _tag: 'invalidToolCall',
});

type ToolCall<T extends Tool[]> = {
  name: T[number]['name'];
  params: any;
  reasoning: Option.Option<string>;
};

function getToolCallFromResponse<T extends Tool[]>({
  content,
}: AssistantResponse): Effect.Effect<ToolCall<T>, InvalidToolCallError> {
  return content.length === 2
    ? Effect.succeed({
      reasoning: Option.some(content[0].text),
      params: (content[1] as ToolUse).input,
      name: (content[1] as ToolUse).name,
    } as ToolCall<T>)
    : content[0].type === 'tool_use'
      ? Effect.succeed({
        reasoning: Option.none(),
        params: (content[0] as ToolUse).input,
        name: (content[0] as ToolUse).name,
      } as ToolCall<T>)
      : Effect.fail(InvalidToolCallError());
}

export type UnwrpEffectError<T> =
  T extends Effect.Effect<infer _, infer E, infer _> ? E : never;

export function callClaudeWithTools<T extends Tool[]>(params: CallClaudeTools) {
  return pipe(
    params,
    callClaude,
    Effect.flatMap((assistantResponse) =>
      pipe(
        (assistantResponse.content.find(
          (message) => message.type === 'tool_use'
        )
          ? pipe(
            getToolCallFromResponse<T>(assistantResponse),
            Effect.map((toolCall) => Either.right(toolCall))
          )
          : Either.left(assistantResponse)) as Effect.Effect<
            Either.Either<ToolCall<T>, AssistantResponse>,
            InvalidToolCallError
          >
      )
    )
    /*
    Effect.flatMap((assistantResponse) =>
      getToolCallFromResponse<T>(assistantResponse)
    )
    */
  );
}

function callClaude<F extends ZodObjectAny>(
  params: CallClaudeWithFormat<F> | CallClaude | CallClaudeTools
) {
  return pipe(params, getRequestBody, makeClaudeAPICall);
}
