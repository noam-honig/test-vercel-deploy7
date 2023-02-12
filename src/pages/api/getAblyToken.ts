import { NextApiRequest, NextApiResponse } from "next";
import ably from 'ably/promises'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const token =await  new ably.Rest(process.env['ABLY_API_KEY']!)
    .auth.createTokenRequest({
      capability: {
        "*": ["subscribe"]
      }
    })
  res.status(200).json(token)
}