import * as rawgModule from './providers/rawg';

// Create and export the rawg object
export const rawg = {
  searchGame: rawgModule.searchGame,
  getGame: rawgModule.getGame
};
