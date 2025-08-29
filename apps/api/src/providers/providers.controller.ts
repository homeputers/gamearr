import { Controller, Post, Body, BadRequestException } from '@nestjs/common';

@Controller('providers')
export class ProvidersController {
  @Post('test')
  test(@Body() body: { provider: string; credentials: Record<string, string> }) {
    const { provider, credentials } = body;
    switch (provider) {
      case 'rawg':
      case 'tgdb':
        if (!credentials?.apiKey) {
          throw new BadRequestException('Missing API key');
        }
        break;
      case 'igdb':
        if (!credentials?.clientId || !credentials?.clientSecret) {
          throw new BadRequestException('Missing credentials');
        }
        break;
      default:
        throw new BadRequestException('Unknown provider');
    }
    return { ok: true };
  }
}
