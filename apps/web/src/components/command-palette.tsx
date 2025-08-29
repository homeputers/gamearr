import React from 'react';
import { Input } from './ui/input';
import { cn } from '../lib/utils';

export interface Command {
  id: string;
  label: string;
  action: () => void;
}

interface CommandContextValue {
  actions: Command[];
  setActions: React.Dispatch<React.SetStateAction<Command[]>>;
}

const CommandContext = React.createContext<CommandContextValue>({
  actions: [],
  setActions: () => {},
});

export function CommandProvider({ children }: { children: React.ReactNode }) {
  const [actions, setActions] = React.useState<Command[]>([]);
  return (
    <CommandContext.Provider value={{ actions, setActions }}>
      {children}
    </CommandContext.Provider>
  );
}

export function useCommand() {
  return React.useContext(CommandContext);
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  staticCommands?: Command[];
}

export function CommandPalette({ open, onClose, staticCommands = [] }: CommandPaletteProps) {
  const { actions } = useCommand();
  const commands = React.useMemo(() => [...staticCommands, ...actions], [staticCommands, actions]);
  const [query, setQuery] = React.useState('');
  const [index, setIndex] = React.useState(0);
  const filtered = React.useMemo(
    () => commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase())),
    [commands, query],
  );
  React.useEffect(() => {
    if (!open) {
      setQuery('');
      setIndex(0);
    }
  }, [open]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded bg-white text-gray-900 shadow dark:bg-gray-800 dark:text-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <Input
          autoFocus
          placeholder="Type a command"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIndex(0);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setIndex((i) => Math.min(i + 1, filtered.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              const cmd = filtered[index];
              if (cmd) {
                cmd.action();
                onClose();
              }
            } else if (e.key === 'Escape') {
              onClose();
            }
          }}
          className="border-0 border-b rounded-none"
        />
        <div className="max-h-60 overflow-y-auto">
          {filtered.map((c, i) => (
            <div
              key={c.id}
              className={cn(
                'cursor-pointer px-2 py-1 text-sm',
                i === index && 'bg-gray-200 dark:bg-gray-700',
              )}
              onMouseEnter={() => setIndex(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                c.action();
                onClose();
              }}
            >
              {c.label}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-2 py-1 text-sm text-gray-500">No results</div>
          )}
        </div>
      </div>
    </div>
  );
}
