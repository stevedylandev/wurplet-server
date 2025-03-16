import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { getCcipRead, getName, getNames, setName } from './handlers'
import { Hex } from 'viem'

type Bindings = {
  PRIVATE_KEY: Hex
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>

app.use("*", cors())

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/lookup/:sender/:data', (c) => getCcipRead(c))
app.get('/get/:name', (c) => getName(c))
app.get('/names', (c) => getNames(c))
app.post('/set', (c) => setName(c))

export default app
