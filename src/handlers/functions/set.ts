import { Context } from 'hono'
import { createKysely } from '../../db/kysely'
import { Name } from '../../models'
import { stringifyNameForDb } from './utils'


export async function set(nameData: Name, c: Context) {
  const db = createKysely(c)
  const body = stringifyNameForDb(nameData)

  await db
    .insertInto('names')
    .values(body)
    .onConflict((oc) => oc.column('name').doUpdateSet(body))
    .execute()
}
