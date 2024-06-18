import { CustomAdditions, Item } from "../types/Item";

export const margeItems = (mainItems: Array<Item>, itemsToMerge: Array<Item>) => {
  const oldItems = [...mainItems];
  const newItems = [...itemsToMerge];

  newItems.forEach((newItem) => {
    const existingItem = oldItems.find((item) => {
      return (
        item.mealId === newItem.mealId &&
        areIngredientsToRemoveEqual(item, newItem) &&
        areCustomAdditionsEqual(item.customAdditions, newItem.customAdditions) &&
        item.status === newItem.status
      );
    });

    if (existingItem) {
      existingItem.quantity += newItem.quantity;
      existingItem.totalPrice += newItem.totalPrice;
    } else {
      oldItems.push(newItem);
    }
  });

  return oldItems;
};

const areIngredientsToRemoveEqual = (item1: Item, item2: Item) => {
  if (item1.ingredientsToRemove.length === 0 && item2.ingredientsToRemove.length === 0) return true;

  return (
    item1.ingredientsToRemove.length === item2.ingredientsToRemove.length &&
    item1.ingredientsToRemove.every((ingredient) => item2.ingredientsToRemove.includes(ingredient))
  );
};

const areCustomAdditionsEqual = (customAdditions1: CustomAdditions[], customAdditions2: CustomAdditions[]) => {
  if (customAdditions1.length === 0 && customAdditions2.length === 0) return true;
  if (customAdditions1.length !== customAdditions2.length) return false;

  return customAdditions1.every((customAddition1) => {
    const customAddition2 = customAdditions2.find((ca) => ca.service === customAddition1.service);
    if (!customAddition2) return false;
    return (
      customAddition1.choices.length === customAddition2.choices.length &&
      customAddition1.choices.every((choice) => customAddition2.choices.includes(choice))
    );
  });
};
