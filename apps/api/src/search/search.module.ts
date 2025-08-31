import { Module } from '@nestjs/common';
import { registerIndexer } from '@gamearr/domain';
import { indexers } from '@gamearr/adapters';
import { DownloadsModule } from '../downloads/downloads.module.js';
import { SearchController } from './search.controller.js';
import { SearchService } from './search.service.js';

@Module({
  imports: [DownloadsModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {
  constructor() {
    Object.values(indexers).forEach(registerIndexer);
  }
}

