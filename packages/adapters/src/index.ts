import * as rawgModule from './providers/rawg';
import * as igdbModule from './providers/igdb';
export { QbitClient } from './downloads/qbittorrent';
import * as emulationstationModule from './exporters/emulationstation';
import * as nointroDatModule from './dat/nointro';
import demoIndexer from './indexers/demo.js';
import { createTorznabIndexer } from './indexers/torznab.js';
import { createRssMagnetIndexer } from './indexers/rssMagnet.js';

// Create and export the rawg object
export const rawg = {
  searchGame: rawgModule.searchGame,
  getGame: rawgModule.getGame,
};

export const igdb = {
  searchGame: igdbModule.searchGame,
  getGame: igdbModule.getGame,
};
export const emulationstation = {
  exportAll: emulationstationModule.exportEmulationStation,
};

export const dat = {
  nointro: {
    loadDat: nointroDatModule.loadNointroDat,
    parseDat: nointroDatModule.parseNointroDat,
  },
};

export const indexers = {
  demo: demoIndexer,
};

export { createTorznabIndexer, createRssMagnetIndexer };
