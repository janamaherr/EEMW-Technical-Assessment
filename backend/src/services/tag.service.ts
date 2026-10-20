import { findAllTagNames } from '../repositories/tag.repository';

export function listTags() {
  return findAllTagNames();
}
