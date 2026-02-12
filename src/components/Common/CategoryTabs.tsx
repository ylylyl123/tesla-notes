interface Category {
  id: string;
  name: string;
  color: string;
  bg: string;
}

interface CategoryTabsProps {
  categories: Category[];
  selectedCategory: string;
  setSelectedCategory: (id: string) => void;
}

export default function CategoryTabs({
  categories,
  selectedCategory,
  setSelectedCategory,
}: CategoryTabsProps) {
  return (
    <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-2">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => setSelectedCategory(cat.id)}
          className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all ${selectedCategory === cat.id ? "text-white shadow-md" : "hover:bg-gray-100"
            }`}
          style={{
            backgroundColor: selectedCategory === cat.id ? cat.color : cat.bg,
            color: selectedCategory === cat.id ? "white" : cat.color,
          }}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
