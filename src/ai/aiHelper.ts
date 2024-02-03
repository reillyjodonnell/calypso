import {
  ButtonInteraction,
  CacheType,
  ChatInputCommandInteraction,
  StringSelectMenuInteraction,
} from 'discord.js';
import { openaiType } from '../..';

export function splitMessage(text: string, maxLength: number = 2000): string[] {
  // Split the text into parts, each with a maximum length of maxLength
  // This is a basic implementation; consider edge cases and improvements
  let chunks = [];
  for (let i = 0; i < text.length; i += maxLength) {
    chunks.push(text.substring(i, i + maxLength));
  }
  return chunks;
}
export const systemPrompt = `When responding to Dungeons & Dragons gameplay inputs, your responses should be concise, informative, and smoothly transition to the next player's action. Specifically:

1. **Include Roll Numbers**: Always include the roll number mentioned in the input within your response. This detail is crucial for accurate and engaging gameplay narration. Don't make up any additional rolls or outcomes. Stick to the numbers provided in the input.

2. **Conciseness**: Limit your response to 1-2 sentences. Your goal is to provide a vivid description of the action and its outcome in a brief yet effective manner.

3. **Transition to Next Player**: End your response by inviting the next player to take their turn, maintaining the flow and momentum of the game.

Example Input: "You rolled a 3 and missed! :( @Reilly it's your turn!"
Example Response: "A roll of 3 leads to a miss, the tension in the air is palpable. Reilly, with the opportunity now yours, what will you do?"`;

//

export async function requestAIResponse(
  openai: openaiType,
  interaction:
    | ChatInputCommandInteraction<CacheType>
    | StringSelectMenuInteraction<CacheType>
    | ButtonInteraction<CacheType>,
  res: string
) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo-16k',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: res,
        },
      ],
      max_tokens: 150,
    });

    // Splitting the response if it's too long for a single Discord message
    const messages = splitMessage(response.choices[0].message.content ?? '');

    for (const message of messages) {
      return message;
    }
  } catch (error) {
    console.error('Error:', error);
  }
}
