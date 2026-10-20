import { findAllUsersBasic } from '../repositories/user.repository';

/** Users for the uploader filter: id, name and department name only. */
export async function listUsers() {
  const users = await findAllUsersBasic();
  return users.map((u) => ({ id: u.id, name: u.name, departmentName: u.department?.name ?? null }));
}
