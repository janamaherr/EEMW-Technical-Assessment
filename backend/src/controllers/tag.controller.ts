import type { Request, Response } from 'express';
import * as tagService from '../services/tag.service';

export async function listTags(_req: Request, res: Response) {
  const tags = await tagService.listTags();
  res.json({ tags });
}
