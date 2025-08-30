import { z } from 'zod';

export const createPlatformSchema = z.object({
  name: z.string(),
  aliases: z.array(z.string()).optional(),
});
export type CreatePlatformDto = z.infer<typeof createPlatformSchema>;

export const updatePlatformSchema = createPlatformSchema.partial();
export type UpdatePlatformDto = z.infer<typeof updatePlatformSchema>;
