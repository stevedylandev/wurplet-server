import { Context } from 'hono'
import { createKysely } from '../../db/kysely'
import { Name } from '../../models'
import { parseNameFromDb } from './utils'

export async function get(name: string, c: Context): Promise<Name | null> {
  const db = createKysely(c)
  const record = await db
    .selectFrom('names')
    .selectAll()
    .where('name', '=', name)
    .executeTakeFirst()

  if (!record) {
    return null
  }

  return parseNameFromDb(record)
}
