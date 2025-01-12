import { openai } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai("gpt-4o-mini"),

    messages,

    tools: {
      weather: tool({
        description: "Get the weather in a location (fahrenheit)",
        parameters: z.object({
          location: z.string().describe("The location to get the weather for"),
        }),
        execute: async ({ location }) => {
          const temperature = Math.round(Math.random() * (90 - 32) + 32);
          return {
            location,
            temperature,
          };
        },
      }),
      nutrients: tool({
        description:
          "Get the nutrients of a food. First translate the user input to english.",
        parameters: z.object({
          foods: z.array(
            z.object({
              food: z
                .string()
                .describe("The english name of the food to get nutrients for"),
              unit: z.string().describe("The unit measured in english"),
              amount: z.number().describe("The amount of food"),
            })
          ),
        }),
        execute: async (data) => {
          console.log(data);
          const url = "https://trackapi.nutritionix.com/v2/natural/nutrients";
          const options = {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "x-app-key": "6e2fd5526cd6f4f0a491fbbc932ab567",
              "x-app-id": "97abb9a4",
            },
            body: `{"query":"${data.foods.map(({ food, unit, amount }) => `${amount} ${unit} of ${food}`).join(", ")}"}`,
          };

          console.log(options.body);

          try {
            const response = await fetch(url, options);
            const data = await response.json();
            return data.foods.map((food) => ({
              food_name: food.food_name,
              serving_qty: food.serving_qty,
              serving_unit: food.serving_unit,
              calories: food.nf_calories,
              total_fat: food.nf_total_fat,
              total_carbohydrate: food.nf_total_carbohydrate,
              protein: food.nf_protein,
              img: food.photo.thumb,
            }));
          } catch (error) {
            console.error(error);
          }
        },
      }),
    },
  });

  return result.toDataStreamResponse();
}
