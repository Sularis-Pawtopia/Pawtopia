'use client';

interface SearchBarProps {
  placeholder?: string;
}

export function SearchBar({ placeholder = "Search for pets..." }: SearchBarProps) {
  return (
    <div className="w-full">
      <input
        type="search"
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      />
    </div>
  );
}
