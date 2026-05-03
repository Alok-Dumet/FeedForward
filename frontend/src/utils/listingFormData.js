export const EMPTY_FOOD = {
  name: '',
  description: '',
  category: 'produce',
  is_perishable: false,
  quantity: '',
  quantity_unit: '',
  expiration_date: '',
};

export const EMPTY_AVAILABILITY_WINDOW = {
  day: 'monday',
  start_time: '09:00',
  end_time: '17:00',
};

export const DAY_OPTIONS = [
  ['monday', 'Monday'],
  ['tuesday', 'Tuesday'],
  ['wednesday', 'Wednesday'],
  ['thursday', 'Thursday'],
  ['friday', 'Friday'],
  ['saturday', 'Saturday'],
  ['sunday', 'Sunday'],
];

export function getTrimmedFood(food) {
  return {
    name: food.name.trim(),
    description: food.description.trim(),
    category: food.category,
    is_perishable: food.is_perishable,
    quantity: food.quantity,
    quantity_unit: food.quantity_unit.trim(),
    expiration_date: food.expiration_date,
  };
}
