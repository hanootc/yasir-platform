import { Button } from "@/components/ui/button";
import { PlatformThemeSelector } from "@/components/platform-theme-selector";

interface HeaderProps {
  title: string;
  subtitle: string;
  onCreateProduct?: () => void;
  onCreateLandingPage?: () => void;
}

export default function Header({ title, subtitle, onCreateProduct, onCreateLandingPage }: HeaderProps) {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 space-x-reverse">
            {/* Platform Theme Controls */}
            <div className="flex items-center gap-2">
              <PlatformThemeSelector />
            </div>

            {/* Notification Bell */}
            <button className="relative p-2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100">
              <i className="fas fa-bell text-xl"></i>
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </button>


          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
