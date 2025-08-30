import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, UsePipes } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PlatformService } from './platform.service';
import { CreatePlatformDto, UpdatePlatformDto, createPlatformSchema, updatePlatformSchema } from './dto';
import { ZodValidationPipe } from '../zod-validation.pipe';

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
}

