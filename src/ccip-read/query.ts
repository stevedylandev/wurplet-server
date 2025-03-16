import { createPublicClient, http, zeroAddress } from 'viem'
import { ResolverQuery } from './utils'
import { Context } from 'hono'
import { get } from '../handlers/functions/get'
import { base } from 'viem/chains'
import { abi } from "./ipcm-abi";
import { encode } from '@ensdomains/content-hash'


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
      const publicClient = createPublicClient({
        transport: http(),
        chain: base
      })

      const cid: any = await publicClient.readContract({
        address: "0xF99E99FD8512417A30B6313D7743cD5e68A7C622",
        abi: abi,
        functionName: "getMapping",
      });

      const encodedContenthash = '0x' + encode('ipfs', cid)
      console.log("Encoded hash to return: ", encodedContenthash)
      res = encodedContenthash
      break
    }
    default: {
      throw new Error(`Unsupported query function ${functionName}`)
    }
  }

  return res
}
