import {
  createDvmfRegistryFromAdoptable,
  createDvmfRegistryRecord,
  deleteDvmfRegistryRecord,
  getDvmfRegistryRecords,
  updateDvmfRegistryRecord,
} from '@/lib/actions/dvmf.actions';
import { createActionRoute } from '@/lib/server/api/action-route';

export const POST = createActionRoute({
  getDvmfRegistryRecords,
  createDvmfRegistryRecord,
  createDvmfRegistryFromAdoptable,
  updateDvmfRegistryRecord,
  deleteDvmfRegistryRecord,
});