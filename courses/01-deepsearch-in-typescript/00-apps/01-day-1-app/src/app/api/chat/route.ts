import type { Message } from "ai";
import { streamText, createDataStreamResponse } from "ai";
import { z } from "zod";
import { model } from "~/model";
import { auth } from "~/server/auth";
import { searchSerper } from "~/serper";

export const maxDuration = 60;

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = (await request.json()) as {
    messages: Array<Message>;
  };

  return createDataStreamResponse({
    execute: async (dataStream) => {
      const { messages } = body;

      const result = streamText({
        model,
        messages,
        system: `You are a helpful AI assistant with access to web search capabilities.

When answering questions:
1. ALWAYS use the searchWeb tool to find current and accurate information
2. Search for relevant information even if you think you know the answer
3. ALWAYS cite your sources by including inline links in your responses
4. Format ALL citations as markdown links: [source title](URL)
   - Example: According to [BBC Sport](https://www.bbc.com/sport/article123), the match ended 2-1.
   - Example: The research shows [Nature Study](https://nature.com/study456) that climate change affects...
5. Include the source link immediately after mentioning information from that source
6. If multiple sources support a claim, cite all relevant sources with separate markdown links
7. Be thorough in your searches to provide comprehensive answers
8. Never provide URLs as plain text - always use the [text](URL) markdown format

Your goal is to provide accurate, well-researched answers with all sources properly cited as clickable markdown links.`,
        maxSteps: 10,
        tools: {
          searchWeb: {
            parameters: z.object({
              query: z.string().describe("The query to search the web for"),
            }),
            execute: async ({ query }, { abortSignal }) => {
              const results = await searchSerper(
                { q: query, num: 10 },
                abortSignal,
              );

              return results.organic.map((result) => ({
                title: result.title,
                link: result.link,
                snippet: result.snippet,
              }));
            },
          },
        },
      });

      result.mergeIntoDataStream(dataStream);
    },
    onError: (e) => {
      console.error(e);
      return "Oops, an error occured!";
    },
  });
}
