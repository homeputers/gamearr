import { Module } from '@nestjs/common';
import { config } from '@gamearr/shared';

export const CONFIG = 'CONFIG';

@Module({
  providers: [{ provide: CONFIG, useValue: config }],
  exports: [CONFIG],
})
export class ConfigModule {}
