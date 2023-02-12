import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { UserInfo } from "remult";

const validUsers: UserInfo[] = [
  { id: "1", name: "Jane", roles: ["admin"] },
  { id: "2", name: "Steve" },
];

export default NextAuth({
  callbacks: {
    session: ({ session, token }) => ({
      ...session, user: getUserById(token?.sub)
    })
  },
  providers: [
    Credentials({
      credentials: {
        name: {
          placeholder: "Try Steve or Jane"
        }
      },
      authorize: info => validUsers.find(user => user.name === info?.name) || null
    })
  ]
})

export function getUserById(id: string | undefined) {
  return validUsers.find(user => user.id === id)
}