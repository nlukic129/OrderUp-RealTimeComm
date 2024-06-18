export interface Item {
  id: string; // Id itema u porudzbini
  mealId: string;
  name: string;
  quantity: number;
  ingredientsToRemove: Array<string>;
  customAdditions: Array<CustomAdditions>;
  totalPrice: number; // price for selected quantity with selected additions
  status: EItemStatus; // Uvek kad se posalje ce biti 0 (PENDING)
}

export interface CustomAdditions {
  service: string;
  choices: Array<string>;
}

export enum EItemStatus {
  PENDING = 0,
  ACCEPTED = 1,
  REJECTED = 2,
}
