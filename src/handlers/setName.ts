import { Context } from 'hono'
import { verifyMessage } from 'viem'
import { ZodNameWithSignature } from '../models'
import { get } from './functions/get'
import { set } from './functions/set'
import { createAppClient, viemConnector } from '@farcaster/auth-client';

const appClient = createAppClient({
  relay: 'https://relay.farcaster.xyz',
  ethereum: viemConnector(),
});

export async function setName(c: Context): Promise<Response> {
  const body = await c.req.json()

  const safeParse = ZodNameWithSignature.safeParse(body)

  if (!safeParse.success) {
    const response = { success: false, error: safeParse.error }
    return c.json(response, { status: 400 })
  }

  const { signature, expiration, siwfNonce, siwfMessage, siwfSignature } = safeParse.data
  const { name, owner } = signature.message

  const { data, success, fid } = await appClient.verifySignInMessage({
    nonce: siwfNonce,
    domain: 'wurplet.xyz',
    message: siwfMessage,
    signature: siwfSignature as `0x`,
  });

  if (!success) {
    return c.json({ error: "Unauthorized SIWF" }, { status: 401 })
  }

  let verificationRequest = await fetch(`https://hub.pinata.cloud/v1/verificationsByFid?fid=${fid}&address=${owner}`)

  // If the first request fails, try the fallback hub
  if (!verificationRequest.ok) {
    console.log('Primary hub request failed, trying fallback hub...')
    verificationRequest = await fetch(`https://hub.farcaster.standardcrypto.vc:2281/v1/verificationsByFid?fid=${fid}&address=${owner}`)

    // If both requests fail, throw an error
    if (!verificationRequest.ok) {
      return c.json({ error: "Invalid Address" }, { status: 401 })
    }
  }

  // Only allow 3LDs, no nested subdomains
  if (name.split('.').length !== 3) {
    const response = { success: false, error: 'Invalid name' }
    return c.json(response, { status: 400 })
  }

  // Validate signature
  try {
    const isVerified = await verifyMessage({
      address: owner,
      message: JSON.stringify(signature.message),
      signature: signature.hash,
    })

    if (!isVerified) {
      throw new Error('Invalid signer')
    }
  } catch (err) {
    console.error(err)
    const response = { success: false, error: err }
    return c.json(response, { status: 401 })
  }

  // Check the signature expiration
  const now = Math.floor(Date.now())

  if (expiration < now) {
    const response = { success: false, error: 'Signature expired' }
    return c.json(response, { status: 401 })
  }

  // Check if the name is already taken
  const existingName = await get(name, c)

  // If the name is owned by someone else, return an error
  if (existingName && existingName.owner !== owner) {
    const response = { success: false, error: 'Name already taken' }
    return c.json(response, { status: 409 })
  }

  // Save the name
  try {
    await set(signature.message, c)
    const response = { success: true }
    return c.json(response, { status: 201 })
  } catch (err) {
    console.error(err)
    const response = { success: false, error: 'Error setting name' }
    return c.json(response, { status: 500 })
  }
}
