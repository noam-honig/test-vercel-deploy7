import { getToken } from "next-auth/jwt";
import { remultNext } from "remult/remult-next";
import { Task } from "../../shared/Task";
import { TasksController } from "../../shared/TasksController";
import { getUserById } from "./auth/[...nextauth]";
import { createPostgresConnection } from "remult/postgres";
import ably from 'ably/promises'
import { AblySubscriptionServer } from "remult/live-query/ably";
import { DataProviderLiveQueryStorage } from "remult/live-query/data-provider-live-query-storage";

const dataProvider = createPostgresConnection()

export default remultNext({
  subscriptionServer: new AblySubscriptionServer(new ably.Rest(process.env['ABLY_API_KEY']!)),
  dataProvider,
  liveQueryStorage: new DataProviderLiveQueryStorage(dataProvider),
  entities: [Task],
  controllers: [TasksController],
  getUser: async req => getUserById((await getToken({ req }))?.sub)
})