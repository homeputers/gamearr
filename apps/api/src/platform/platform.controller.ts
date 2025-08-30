import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { tmpdir } from 'node:os';
import { PlatformService } from './platform.service';
import { CreatePlatformDto, UpdatePlatformDto, createPlatformSchema, updatePlatformSchema } from './dto';
import { ZodValidationPipe } from '../zod-validation.pipe';
import { config } from '@gamearr/shared';

@ApiTags('Platforms')
@Controller('platforms')
export class PlatformController {
  constructor(@Inject(PlatformService) private readonly service: PlatformService) {}

  @Get()
  @ApiOperation({ summary: 'List platforms' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get platform details' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create platform' })
  @UsePipes(new ZodValidationPipe(createPlatformSchema))
  create(@Body() body: CreatePlatformDto) {
    return this.service.create(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update platform' })
  @UsePipes(new ZodValidationPipe(updatePlatformSchema))
  update(@Param('id') id: string, @Body() body: UpdatePlatformDto) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete platform' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/dat/upload')
  @ApiOperation({ summary: 'Upload DAT file' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      dest: tmpdir(),
      limits: { fileSize: config.maxDatUploadMB * 1024 * 1024 },
    }),
  )
  uploadDat(
    @Param('id') id: string,
    @UploadedFile() file: { path: string; mimetype: string; originalname: string; size: number },
  ) {
    return this.service.uploadDat(id, file);
  }

  @Post(':id/dat/:datFileId/activate')
  @ApiOperation({ summary: 'Activate DAT file' })
  activate(@Param('id') id: string, @Param('datFileId') datFileId: string) {
    return this.service.activateDat(id, datFileId);
  }

  @Post(':id/dat/recheck')
  @ApiOperation({ summary: 'Recheck unmatched artifacts against active DAT' })
  recheck(@Param('id') id: string) {
    return this.service.recheckDat(id);
  }

  @Post(':id/dat/:datFileId/deactivate')
  @ApiOperation({ summary: 'Deactivate DAT file' })
  deactivate(@Param('id') id: string, @Param('datFileId') datFileId: string) {
    return this.service.deactivateDat(id, datFileId);
  }
}

