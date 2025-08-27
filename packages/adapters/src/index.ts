import * as rawgModule from './providers/rawg';
import * as igdbModule from './providers/igdb';
import * as qbittorrentModule from './downloads/qbittorrent';
import * as emulationstationModule from './exporters/emulationstation';

// Create and export the rawg object
export const rawg = {
  searchGame: rawgModule.searchGame,
  getGame: rawgModule.getGame,
};

export const igdb = {
  searchGame: igdbModule.searchGame,
  getGame: igdbModule.getGame,
};

export const qbittorrent = {
  addMagnet: qbittorrentModule.addMagnet,
  getStatus: qbittorrentModule.getStatus,
};

export const emulationstation = {
  exportAll: emulationstationModule.exportEmulationStation,
};
