import { FormEvent, useEffect, useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import Markdown from 'react-markdown';
import './markdown.css';

export type Message = {
  role: 'user' | 'assistant';
  content: string;
};

// docs:
// pass in a system message and a placeholder for the input box
//



export default function FoundationModel(props: {
  system: string;
  placeholder: string;
  firstMessage?: string;
  style: {
    userBubble: { background: string; textColor: string };
    assistant: { textColor: string };
    submitButton: { textColor: string; backgroundColor: string };
  };
  sampleMessages?: number;
}) {
  // need:
  // an input field
  // text bubbles
  // some basic styling; color inputs, we can do this later tho

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const divRef = useRef<HTMLDivElement | null>(null);

  async function handleClaude(messages: Message[]) {
    const response = await fetch('http://localhost:3000/claude-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // Specify content type as JSON
      },
      body: JSON.stringify({
        messages,
        system: props.firstMessage
          ? `${props.system}, This was the first message the user sees: ${props.firstMessage}`
          : props.system,
      }),
    });
    const assistantResponse = (await response.text()) as string;
    console.log(assistantResponse);
    // just make a fetch here i guess hs
    setMessages((messages) => {
      const newMessages = [
        ...messages,
        { role: 'assistant', content: assistantResponse } as const,
      ];

      return newMessages;
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const newMessages = [...messages];
    setMessages((messages) => {
      const newMessages = [...messages];
      newMessages.push({ role: 'user', content: input });

      setInput('');
      return newMessages;
    });

    newMessages.push({ role: 'user', content: input });
    handleClaude(newMessages);

    // add user message
    // send to claude
    // get response
    // update messages
  }

  useEffect(() => {
    if (!divRef.current) return;
    divRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [divRef.current]);

  return (
    <div className="mx-4 h-full flex flex-col justify-between">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col justify-between h-full"
      >
        <div
          className="flex flex-col justify-start overflow-scroll h-full"
          ref={divRef}
        >
          {(props.firstMessage
            ? [{ role: 'assistant', content: props.firstMessage }, ...messages]
            : messages
          ).map((message, index) => (
            <div
              key={index}
              className={twMerge(
                'flex items-start justify-center max-w-full',
                message.role === 'user'
                  ? 'self-end flex-row-reverse ml-8'
                  : 'self-start flex-row mr-8'
              )}
            >
              <img
                className={'aspect-square h-14 my-1.5 p-2 rounded-full'}
                src={
                  message.role === 'user'
                    ? 'https://static.vecteezy.com/system/resources/thumbnails/002/318/271/small/user-profile-icon-free-vector.jpg'
                    : 'data:image/png;base64,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'
                }
              />
              <div
                className={twMerge(
                  'rounded-md p-2 my-3 mx-1 w-fit text-gray-800 overflow-hidden max-w-full',
                  message.role === 'user' ? 'border' : ''
                )}
                ref={index === messages.length - 1 ? divRef : undefined}
                style={
                  message.role === 'user'
                    ? {
                        background: props.style.userBubble.background,
                        color: props.style.userBubble.textColor,
                      }
                    : { color: props.style.assistant.textColor }
                }
              >
                {message.role === 'user' ? (
                  <p>{message.content}</p>
                ) : (
                  <Markdown className="markdown max-w-full overflow-hidden">
                    {message.content}
                  </Markdown>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-row px-4 gap-4">
          <input
            className="w-full rounded-full border px-4 py-2"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={props.placeholder}
          />
          <button
            type="submit"
            className="rounded-full px-12 py-2 border"
            style={{
              background: props.style.submitButton.backgroundColor,
              color: props.style.submitButton.textColor,
            }}
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
}
