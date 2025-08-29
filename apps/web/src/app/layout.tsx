import * as React from 'react';
import { NavLink, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Folder, FileQuestion, Gamepad2, Activity as ActivityIcon, Download, Settings as SettingsIcon, Menu, Sun, Moon, User } from 'lucide-react';
import { Libraries } from '../pages/Libraries';
import { Unmatched } from '../pages/Unmatched';
import { Games } from '../pages/Games';
import { GamesDuplicates } from '../pages/GamesDuplicates';
import { Activity } from '../pages/Activity';
import { Downloads } from '../pages/Downloads';
import { Settings } from '../pages/Settings';
import { SettingsOrganize } from '../pages/SettingsOrganize';
import { SettingsExporters } from '../pages/SettingsExporters';
import { SettingsProviders } from '../pages/SettingsProviders';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '../components/ui/dropdown-menu';
import { useTheme } from 'next-themes';
import { cn } from '../lib/utils';
import { CommandPalette, CommandProvider } from '../components/command-palette';
import { HelpModal } from '../components/help-modal';

export function Layout() {
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    let gPressed = false;
    let timeout: number | undefined;
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setHelpOpen(true);
        return;
      }
      if (e.key === 'g' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (gPressed) {
          navigate('/games');
          gPressed = false;
        } else {
          gPressed = true;
          timeout = window.setTimeout(() => (gPressed = false), 1000);
        }
        return;
      }
      if (gPressed) {
        if (e.key === 'l') navigate('/libraries');
        else if (e.key === 'u') navigate('/unmatched');
        gPressed = false;
        if (timeout) window.clearTimeout(timeout);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [navigate]);

  const staticCommands = React.useMemo(
    () => [
      { id: 'nav-libraries', label: 'Go to Libraries', action: () => navigate('/libraries') },
      { id: 'nav-unmatched', label: 'Go to Unmatched', action: () => navigate('/unmatched') },
      { id: 'nav-games', label: 'Go to Games', action: () => navigate('/games') },
    ],
    [navigate],
  );

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const navItems = [
    { to: '/libraries', label: 'Libraries', icon: Folder },
    { to: '/unmatched', label: 'Unmatched', icon: FileQuestion },
    { to: '/games', label: 'Games', icon: Gamepad2 },
    { to: '/activity', label: 'Activity', icon: ActivityIcon },
    { to: '/downloads', label: 'Downloads', icon: Download },
    { to: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <CommandProvider>
      <div className="flex h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-64 transform bg-gray-100 p-4 transition-transform dark:bg-gray-800 md:relative md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        <nav className="space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-gray-200 dark:hover:bg-gray-700',
                  isActive && 'bg-gray-200 font-medium dark:bg-gray-700',
                )
              }
              onClick={() => setSidebarOpen(false)}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b px-4 bg-gray-100 dark:bg-gray-900">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Input type="search" placeholder="Search" className="w-40 md:w-64" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4">
          <Routes>
            <Route path="/libraries" element={<Libraries />} />
            <Route path="/unmatched" element={<Unmatched />} />
            <Route path="/games" element={<Games />} />
            <Route path="/games/duplicates" element={<GamesDuplicates />} />
            <Route path="/activity" element={<Activity />} />
            <Route path="/downloads" element={<Downloads />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/organize" element={<SettingsOrganize />} />
            <Route path="/settings/exporters" element={<SettingsExporters />} />
            <Route path="/settings/providers" element={<SettingsProviders />} />
            <Route path="*" element={<Navigate to="/libraries" replace />} />
          </Routes>
        </main>
      </div>
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        staticCommands={staticCommands}
      />
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
    </CommandProvider>
  );
}
