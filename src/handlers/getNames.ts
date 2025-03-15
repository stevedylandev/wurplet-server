import { Context } from 'hono'
import { createKysely } from '../db/kysely'
import { parseNameFromDb } from './functions/utils'

export async function getNames(c: Context) {
  const db = createKysely(c)
  const names = await db.selectFrom('names').selectAll().execute()
  const parsedNames = parseNameFromDb(names)

  // Simplify the response format
  const formattedNames = parsedNames.reduce((acc, name) => {
    return {
      ...acc,
      [name.name]: {
        addresses: name.addresses,
        texts: name.texts,
        contenthash: name.contenthash,
      },
    }
  }, {})

  return c.json(formattedNames, {
    status: 200,
  })
}
