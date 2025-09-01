import { Body, Controller, Post, Param, Inject } from '@nestjs/common';
import { OrganizeService } from './organize.service.js';

@Controller('organize')
export class OrganizeController {
  constructor(@Inject(OrganizeService) private readonly service: OrganizeService) {}

  @Post('preview')
  preview(
    @Body() body: { artifactId: string; template: string; romsRoot?: string },
  ) {
    return this.service.preview(body.artifactId, body.template, body.romsRoot);
  }

  @Post('library/:id')
  organizeLibrary(
    @Param('id') id: string,
    @Body()
    body: { template: string; dryRun?: boolean; romsRoot?: string },
  ) {
    return this.service.organizeLibrary(
      id,
      body.template,
      body.dryRun ?? false,
      body.romsRoot,
    );
  }
}
