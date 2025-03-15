import { Context } from 'hono'
import zod from 'zod'
import { get } from './functions/get'

export async function getName(c: Context) {
  const name = c.req.param('name')
  const schema = zod.string().regex(/^[a-z0-9-.]+$/)
  const safeParse = schema.safeParse(name)

  if (!safeParse.success) {
    const response = { error: safeParse.error }
    return c.json(response, { status: 400 })
  }

  const nameData = await get(safeParse.data, c)

  if (nameData === null) {
    return c.json({ data: 'Name not found' }, { status: 404 })
  }

  return c.json(nameData, {
    status: 200,
  })
}
