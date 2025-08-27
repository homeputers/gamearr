import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { LibraryService } from './library.service';

@Controller('libraries')
export class LibraryController {
  constructor(private readonly service: LibraryService) {}

  @Post()
  create(@Body() body: { path: string; platformId: string }) {
    return this.service.create(body);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post(':id/scan')
  scan(@Param('id') id: string) {
    return this.service.scan(id);
  }
}
