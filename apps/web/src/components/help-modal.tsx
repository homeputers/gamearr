import React from 'react';

function Shortcut({ keys }: { keys: string[] }) {
  return (
    <span className="mr-2">
      {keys.map((k, i) => (
        <kbd
          key={i}
          className="rounded border px-1 py-0.5 text-xs bg-gray-100 dark:bg-gray-700"
        >
          {k}
        </kbd>
      ))}
    </span>
  );
}

export function HelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-w-md w-full rounded bg-white p-4 text-gray-900 shadow dark:bg-gray-800 dark:text-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg mb-2">Keyboard Shortcuts</h2>
        <ul className="space-y-1 text-sm">
          <li>
            <Shortcut keys={['?']} /> Help
          </li>
          <li>
            <Shortcut keys={['g', 'l']} /> Go to Libraries
          </li>
          <li>
            <Shortcut keys={['g', 'u']} /> Go to Unmatched
          </li>
          <li>
            <Shortcut keys={['g', 'g']} /> Go to Games
          </li>
          <li>
            <Shortcut keys={['⌘', 'K']} /> Command Palette
          </li>
        </ul>
      </div>
    </div>
  );
}
