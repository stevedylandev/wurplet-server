import { Context } from 'hono'
import { HttpRequestError } from 'viem'
import { isAddress, isHex } from 'viem/utils'
import { z } from 'zod'

import { getRecord } from '../ccip-read/query'
import {
  decodeEnsOffchainRequest,
  encodeEnsOffchainResponse,
} from '../ccip-read/utils'

const schema = z.object({
  sender: z.string().refine((data) => isAddress(data)),
  data: z.string().refine((data) => isHex(data)),
})

// Implements EIP-3668
// https://eips.ethereum.org/EIPS/eip-3668
export const getCcipRead = async (c: Context) => {
  const { sender, data } = c.req.param()
  const safeParse = schema.safeParse({ sender, data })

  if (!safeParse.success) {
    return c.json({ error: safeParse.error }, { status: 400 })
  }

  let result: string

  try {
    const { name, query } = decodeEnsOffchainRequest(safeParse.data)
    result = await getRecord(name, query, c)
  } catch (error) {
    const isHttpRequestError = error instanceof HttpRequestError
    const errMessage = isHttpRequestError ? error.message : 'Unable to resolve'
    return c.json({ message: errMessage }, { status: 400 })
  }

  const encodedResponse = await encodeEnsOffchainResponse(
    safeParse.data,
    result,
    c.env.PRIVATE_KEY
  )

  return c.json({ data: encodedResponse }, { status: 200 })
}
