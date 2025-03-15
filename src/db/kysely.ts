import { CamelCasePlugin, Kysely } from 'kysely'
import { D1Dialect } from 'kysely-d1'

import { NameInKysely } from '../models'
import { Context } from 'hono'

export interface Database {
  names: NameInKysely
}

export function createKysely(c: Context): Kysely<Database> {
  return new Kysely<Database>({
    dialect: new D1Dialect({ database: c.env.DB }),
    plugins: [new CamelCasePlugin()],
  })
}
