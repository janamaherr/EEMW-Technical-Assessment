import { Router } from 'express';
import * as departmentController from '../controllers/department.controller';

export const departmentRouter = Router();

// Public: the signup form needs the list before the user has an account.
departmentRouter.get('/', departmentController.listDepartments);
