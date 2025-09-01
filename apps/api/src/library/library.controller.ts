import { Body, Controller, Get, Param, Post, Inject, Put, Delete } from '@nestjs/common';
import { LibraryService } from './library.service';

@Controller('libraries')
export class LibraryController {
  constructor(@Inject(LibraryService) private readonly service: LibraryService) {}

  @Post()
  create(
    @Body()
    body: { path: string; platformId: string; autoOrganizeOnImport?: boolean },
  ) {
    return this.service.create(body);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: { path?: string; platformId?: string; autoOrganizeOnImport?: boolean },
  ) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/scan')
  scan(@Param('id') id: string) {
    return this.service.scan(id);
  }
}
