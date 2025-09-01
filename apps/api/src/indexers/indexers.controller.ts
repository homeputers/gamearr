import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../zod-validation.pipe.js';
import { IndexersService } from './indexers.service.js';

const createSchema = z.object({
  key: z.string(),
  kind: z.enum(['torznab', 'rss']),
  name: z.string(),
  config: z.any(),
});

const updateSchema = z.object({
  name: z.string().optional(),
  config: z.any().optional(),
  isEnabled: z.boolean().optional(),
});

@ApiTags('indexers')
@Controller('indexers')
export class IndexersController {
  constructor(
    @Inject(IndexersService) private readonly service: IndexersService,
  ) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Post()
  @ApiBody({
    schema: {
      properties: {
        key: { type: 'string' },
        kind: { type: 'string' },
        name: { type: 'string' },
        config: { type: 'object' },
      },
    },
  })
  create(
    @Body(new ZodValidationPipe(createSchema))
    body: { key: string; kind: string; name: string; config: any },
  ) {
    return this.service.create(body);
  }

  @Patch(':key')
  update(
    @Param('key') key: string,
    @Body(new ZodValidationPipe(updateSchema))
    body: { name?: string; config?: any; isEnabled?: boolean },
  ) {
    return this.service.update(key, body);
  }

  @Delete(':key')
  remove(@Param('key') key: string) {
    return this.service.remove(key);
  }

  @Post(':key/test')
  test(@Param('key') key: string) {
    return this.service.test(key);
  }
}

