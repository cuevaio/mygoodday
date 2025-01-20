import { NextResponse } from 'next/server';

import { openai } from '@ai-sdk/openai';
import { auth } from '@clerk/nextjs/server';
import {
  appendResponseMessages,
  convertToCoreMessages,
  createIdGenerator,
  Message,
  streamText,
  tool,
} from 'ai';
import { z } from 'zod';

import { getMessages, storeMessages } from '@/db/redis';

export const maxDuration = 30;

export async function GET(req: Request) {
  // Simulate a 5 second delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const { userId } = await auth();

  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const lastTimestamp = searchParams.get('lastTimestamp');
  const limit = searchParams.get('limit');

  const messages = await getMessages(
    userId,
    limit ? parseInt(limit) : undefined,
    lastTimestamp ? parseInt(lastTimestamp) : undefined,
  );

  return NextResponse.json(messages);
}

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { message: rawMessage } = await req.json();

  const dbMessages = await getMessages(userId, 10);

  const message = JSON.parse(rawMessage) as Message;
  message.createdAt = new Date(message.createdAt!);

  const messages = convertToCoreMessages([...dbMessages, message]);

  const result = streamText({
    maxSteps: 1, // Increased to 2 to allow for initial response and one tool call
    model: openai('gpt-4o-mini'),
    system: `You are a helpful assistant that provides nutritional information. 
             When asked about food nutrients, follow these steps:
             1. Identify all the foods mentioned in the user's query.
             2. Translate the food names to English if necessary.
             3. Use the nutrients tool ONCE with a list of all identified foods.
             4. For any follow-up questions, use the information already obtained without calling the tool again.
             
             Remember:
             - Only call the nutrients tool ONCE per user query, even if multiple foods are mentioned.
             - The nutrients tool accepts a list of foods, so gather all foods before making the call.
             - Always translate food names to English before using the tool.
             - If the user asks about a food not in the initial query, inform them that you need to make a new query for that food.`,

    messages,
    experimental_generateMessageId: createIdGenerator({
      prefix: 'msg',
      separator: '_',
      size: 16,
    }),
    tools: {
      nutrients: tool({
        description: 'Get the nutrients of a list of foods.',
        parameters: z.object({
          foods: z.array(
            z.object({
              food: z
                .string()
                .describe('The name of the food to get nutrients for'),
              unit: z.string().describe('The unit measured'),
              amount: z.number().describe('The amount of food'),
            }),
          ),
        }),
        execute: async ({ foods }) => {
          const url = 'https://trackapi.nutritionix.com/v2/natural/nutrients';
          const options = {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'x-app-id': process.env.NUTRITIONIX_APP_ID!,
              'x-app-key': process.env.NUTRITIONIX_APP_KEY!,
            },
            body: JSON.stringify({
              query: foods
                .map(({ food, unit, amount }) => `${amount} ${unit} of ${food}`)
                .join(', '),
            }),
          };

          try {
            const response = await fetch(url, options);
            const responseData = await response.json();

            const result = responseData.foods.map(
              (food: {
                food_name: string;
                serving_qty: number;
                serving_unit: string;
                nf_calories: number;
                nf_total_fat: number;
                nf_total_carbohydrate: number;
                nf_protein: number;
                nf_sugars: number;
                nf_dietary_fiber: number;
                nf_potassium: number;
                nf_cholesterol: number;
                nf_saturated_fat: number;
                nf_sodium: number;
                nf_p: number;
                photo: { thumb: string };
                serving_weight_grams: number;
              }) => ({
                food_name: food.food_name,
                serving_qty: food.serving_qty,
                serving_unit: food.serving_unit,

                calories: food.nf_calories,
                total_fat: food.nf_total_fat,
                carbohydrates: food.nf_total_carbohydrate,
                protein: food.nf_protein,
                sugars: food.nf_sugars,
                dietary_fiber: food.nf_dietary_fiber,
                potassium: food.nf_potassium,
                cholesterol: food.nf_cholesterol,
                saturated_fat: food.nf_saturated_fat,
                sodium: food.nf_sodium,
                phosphorus: food.nf_p,

                img: food.photo.thumb,
                serving_weight: food.serving_weight_grams,
              }),
            );

            return result;
          } catch (error) {
            console.error(error);
            return [];
          }
        },
      }),
    },
    onFinish: async ({ response }) => {
      const msgs = appendResponseMessages({
        messages: [],
        responseMessages: response.messages,
      });

      await storeMessages(userId, [message, ...msgs]);
    },
  });

  return result.toDataStreamResponse();
}
