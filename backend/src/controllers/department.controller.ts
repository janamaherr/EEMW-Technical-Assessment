import type { Request, Response } from 'express';
import * as departmentService from '../services/department.service';

export async function listDepartments(_req: Request, res: Response) {
  const departments = await departmentService.listDepartments();
  res.json({ departments });
}
