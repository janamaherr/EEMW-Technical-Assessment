import { findAllDepartments } from '../repositories/department.repository';

export function listDepartments() {
  return findAllDepartments();
}
