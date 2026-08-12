export function uniqueSubcategoriesById(subcategories = []) {
  if (!Array.isArray(subcategories)) return [];

  return Array.from(
    subcategories.reduce((unique, subcategory) => {
      const id = subcategory?.subcategory_id;
      if (id === undefined || id === null || unique.has(String(id))) {
        return unique;
      }

      unique.set(String(id), subcategory);
      return unique;
    }, new Map()).values(),
  );
}
