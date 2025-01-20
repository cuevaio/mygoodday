import { useState } from 'react';
import Image from 'next/image';

import { Trash2 } from 'lucide-react';
import { z } from 'zod';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export const FoodSchema = z.array(
  z.object({
    food_name: z.string(),
    serving_qty: z.number(),
    serving_unit: z.string(),

    calories: z.number(),
    total_fat: z.number(),
    carbohydrates: z.number(),
    protein: z.number(),
    sugars: z.number(),
    dietary_fiber: z.number(),
    potassium: z.number(),
    cholesterol: z.number(),
    saturated_fat: z.number(),
    sodium: z.number(),
    phosphorus: z.number(),

    img: z.string().optional(),
  }),
);

type Food = z.infer<typeof FoodSchema>[number];
type Props = { foods: Food[]; messageId: string; messageCreatedAt: Date };

export function MacroSummary({
  foods: initialFoods,
  messageId,
  messageCreatedAt,
}: Props) {
  const [foods, setFoods] = useState<Food[]>(initialFoods);
  const isToday = messageCreatedAt.toDateString() === new Date().toDateString();

  console.log(messageId);
  const updateServingQuantity = (index: number, newValue: string) => {
    if (!isToday) return;

    const newQty = parseFloat(newValue);

    // If the input is empty or not a valid number, set quantity to 0
    if (isNaN(newQty)) {
      setFoods((currentFoods) => {
        const newFoods = [...currentFoods];
        newFoods[index] = {
          ...initialFoods[index],
          serving_qty: 0,
          calories: 0,
          total_fat: 0,
          carbohydrates: 0,
          protein: 0,
        };
        return newFoods;
      });
      return;
    }

    // Don't allow negative values
    if (newQty < 0) return;

    setFoods((currentFoods) => {
      const newFoods = [...currentFoods];
      const originalFood = initialFoods[index];
      const ratio = newQty / originalFood.serving_qty;

      newFoods[index] = {
        ...originalFood,
        serving_qty: newQty,
        calories: originalFood.calories * ratio,
        total_fat: originalFood.total_fat * ratio,
        carbohydrates: originalFood.carbohydrates * ratio,
        protein: originalFood.protein * ratio,
      };

      return newFoods;
    });
  };

  const deleteFood = (index: number) => {
    if (!isToday) return;
    setFoods((currentFoods) => currentFoods.filter((_, i) => i !== index));
  };

  const totalCalories = foods.reduce(
    (sum, food) => sum + (isNaN(food.calories) ? 0 : food.calories),
    0,
  );
  const totalFat = foods.reduce(
    (sum, food) => sum + (isNaN(food.total_fat) ? 0 : food.total_fat),
    0,
  );
  const totalCarbs = foods.reduce(
    (sum, food) => sum + (isNaN(food.carbohydrates) ? 0 : food.carbohydrates),
    0,
  );
  const totalProtein = foods.reduce(
    (sum, food) => sum + (isNaN(food.protein) ? 0 : food.protein),
    0,
  );

  const handleSave = () => {
    // Here you would typically send the updated foods data to your backend
    console.log('Saving updated foods:', foods);
  };

  return (
    <Card className="mx-auto w-full max-w-md overflow-hidden rounded-lg bg-white shadow-md">
      <CardContent className="p-4">
        <div className="mb-2 text-lg font-semibold">Intake summary</div>

        <Accordion type="single" collapsible className="w-full">
          {foods.map((food, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex w-full items-center space-x-2">
                  {food.img && (
                    <div className="relative size-12 overflow-hidden rounded-lg border">
                      <Image
                        src={food.img}
                        alt={food.food_name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <span className="flex-grow text-left">{food.food_name}</span>
                  <span className="text-sm text-gray-500">
                    {food.serving_qty.toFixed(1)} {food.serving_unit}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 p-2">
                  <div className="flex items-center justify-between space-x-2">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm">Serving quantity:</label>
                      <Input
                        type="number"
                        value={food.serving_qty || ''}
                        onChange={(e) =>
                          updateServingQuantity(index, e.target.value)
                        }
                        className="w-24"
                        min="0"
                        step="0.1"
                        disabled={!isToday}
                      />
                      <span className="text-sm text-gray-500">
                        {food.serving_unit}
                      </span>
                    </div>
                    {isToday && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteFood(index)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Calories:</div>
                    <div className="text-right">
                      {(isNaN(food.calories) ? 0 : food.calories).toFixed(1)}{' '}
                      kcal
                    </div>
                    <div>Fat:</div>
                    <div className="text-right">
                      {(isNaN(food.total_fat) ? 0 : food.total_fat).toFixed(1)}{' '}
                      g
                    </div>
                    <div>Carbs:</div>
                    <div className="text-right">
                      {(isNaN(food.carbohydrates)
                        ? 0
                        : food.carbohydrates
                      ).toFixed(1)}{' '}
                      g
                    </div>
                    <div>Protein:</div>
                    <div className="text-right">
                      {(isNaN(food.protein) ? 0 : food.protein).toFixed(1)} g
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-4 border-t border-gray-200 pt-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Total Calories:</div>
            <div className="text-right font-semibold">
              {totalCalories.toFixed(1)} kcal
            </div>
            <div>Total Fat:</div>
            <div className="text-right font-semibold">
              {totalFat.toFixed(1)} g
            </div>
            <div>Total Carbs:</div>
            <div className="text-right font-semibold">
              {totalCarbs.toFixed(1)} g
            </div>
            <div>Total Protein:</div>
            <div className="text-right font-semibold">
              {totalProtein.toFixed(1)} g
            </div>
          </div>
        </div>

        {isToday && (
          <div className="mt-4">
            <Button onClick={handleSave} className="w-full">
              Log Food
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
