import { useState } from 'react';

// Our custom hook that will return four helpful functions to modify an array of dictionaries!
// Includes updating, adding, and removing functions
export default function useEditableList(initialItems, emptyItem) {
  const [items, setItems] = useState(initialItems);

  // Update one field on one item while preserving the rest of the list
  function updateItem(index, field, value) {
    setItems((currentItems) =>
      currentItems.map((item, itemIndex) => {
        if (itemIndex === index) {
          return { ...item, [field]: value };
        }

        return item;
      })
    );
  }

  // Adds a fresh copy of the empty item template to the list
  function addItem() {
    setItems((currentItems) => [...currentItems, { ...emptyItem }]);
  }

  // Remove one item by index
  function removeItem(index) {
    setItems((currentItems) => currentItems.filter((_, itemIndex) => itemIndex !== index));
  }

  return [items, { setItems, updateItem, addItem, removeItem }];
}
