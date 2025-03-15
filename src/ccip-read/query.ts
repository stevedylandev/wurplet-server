import { zeroAddress } from 'viem'
import { ResolverQuery } from './utils'
import { Context } from 'hono'
import { get } from '../handlers/functions/get'

export async function getRecord(name: string, query: ResolverQuery, c: Context) {
  const { functionName, args } = query

  let res: string
  const nameData = await get(name, c)

  switch (functionName) {
    case 'addr': {
      const coinType = args[1] ?? BigInt(60)
      res = nameData?.addresses?.[coinType.toString()] ?? zeroAddress
      break
    }
    case 'text': {
      const key = args[1]
      res = nameData?.texts?.[key] ?? ''
      break
    }
    case 'contenthash': {
      res = nameData?.contenthash ?? '0x'
      break
    }
    default: {
      throw new Error(`Unsupported query function ${functionName}`)
    }
  }

  return res
}
