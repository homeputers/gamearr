import * as rawgModule from './providers/rawg';
import * as qbittorrentModule from './downloads/qbittorrent';

// Create and export the rawg object
export const rawg = {
  searchGame: rawgModule.searchGame,
  getGame: rawgModule.getGame,
};

export const qbittorrent = {
  addMagnet: qbittorrentModule.addMagnet,
  getStatus: qbittorrentModule.getStatus,
};
