import { useState } from 'react';

export default function useEditableList(initialItems, emptyItem) {
  const [items, setItems] = useState(initialItems);

  function updateItem(index, field, value) {
    setItems((currentItems) =>
      currentItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  }

  function addItem() {
    setItems((currentItems) => [...currentItems, { ...emptyItem }]);
  }

  function removeItem(index) {
    setItems((currentItems) =>
      currentItems.filter((_, itemIndex) => itemIndex !== index)
    );
  }

  return [items, { setItems, updateItem, addItem, removeItem }];
}
