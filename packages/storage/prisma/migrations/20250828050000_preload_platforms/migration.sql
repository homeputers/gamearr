-- Preload known platforms
INSERT INTO "Platform" ("id", "name", "extensions") VALUES
  ('NES', 'Nintendo Entertainment System', ARRAY['.nes']),
  ('SNES', 'Super Nintendo Entertainment System', ARRAY['.sfc', '.smc']),
  ('N64', 'Nintendo 64', ARRAY['.z64', '.n64', '.v64']),
  ('GEN', 'Sega Genesis', ARRAY['.gen', '.md', '.smd'])
ON CONFLICT ("id") DO NOTHING;
