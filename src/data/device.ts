import { newId } from './ids'

const KEY = 'vocsnap.device_id'

// Geräte-ID, wird nicht synchronisiert.
export function getDeviceId(storage: Storage = localStorage): string {
  let id = storage.getItem(KEY)
  if (!id) {
    id = newId()
    storage.setItem(KEY, id)
  }
  return id
}
