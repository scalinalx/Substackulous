/**
 * Common dark mode classes for consistent styling across dashboard pages
 */

export const darkModeClasses = {
  // Page containers
  pageContainer: "min-h-screen bg-gray-50 dark:bg-gray-900",
  contentContainer: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",
  
  // Card elements
  card: "bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6",
  cardWithBorder: "bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-900/5 dark:ring-gray-700/50 sm:rounded-xl p-6",
  
  // Typography
  heading: "text-3xl font-bold text-gray-900 dark:text-white",
  subheading: "text-xl font-semibold text-gray-900 dark:text-white",
  paragraph: "text-gray-600 dark:text-gray-300",
  mutedText: "text-gray-500 dark:text-gray-400",
  
  // Links
  link: "text-amber-600 hover:text-amber-500 dark:text-amber-500 dark:hover:text-amber-400",
  
  // Form elements
  input: "dark:bg-gray-700 dark:text-white dark:border-gray-600",
  
  // Prose content
  prose: "prose max-w-none dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-600 dark:prose-p:text-gray-300",
  
  // Back link with icon
  backLink: "text-amber-600 hover:text-amber-500 dark:text-amber-500 dark:hover:text-amber-400 flex items-center gap-1",
};

/**
 * Helper function to combine multiple class strings
 */
export function combineClasses(...classes: string[]): string {
  return classes.filter(Boolean).join(' ');
} 