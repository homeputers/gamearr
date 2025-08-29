import * as rawgModule from './providers/rawg';
import * as igdbModule from './providers/igdb';
import * as qbittorrentModule from './downloads/qbittorrent';
import * as emulationstationModule from './exporters/emulationstation';
import * as nointroDatModule from './dat/nointro';

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
  pause: qbittorrentModule.pause,
  resume: qbittorrentModule.resume,
  remove: qbittorrentModule.remove,
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
