import { signIn, signOut, useSession } from "next-auth/react";

import { FormEvent, useEffect, useState } from "react";
import { remult, UserInfo } from "remult";
import { Task } from "../shared/Task";
import { TasksController } from "../shared/TasksController";
import ably from "ably/promises";
import { AblySubscriptionClient } from "remult/ably";

const taskRepo = remult.repo(Task);

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);

  const [newTaskTitle, setNewTaskTitle] = useState("");

  const addTask = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setTasks([...tasks, await taskRepo.insert({ title: newTaskTitle })]);
      setNewTaskTitle("");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const setAllCompleted = async (completed: boolean) => {
    await TasksController.setAllCompleted(completed);
  };

  const session = useSession();

  useEffect(() => {
    remult.apiClient.subscriptionClient = new AblySubscriptionClient(
      new ably.Realtime({ authUrl: "/api/getAblyToken" })
    );
  }, []);

  useEffect(() => {
    remult.user = session.data?.user as UserInfo;
    if (session.status === "unauthenticated") signIn();
    else if (session.status === "authenticated")
      return taskRepo
        .liveQuery({
          orderBy: {
            completed: "asc",
          },
          where: {
            completed: undefined,
          },
        })
        .subscribe((info) => setTasks(info.applyChanges));
  }, [session]);
  if (session.status !== "authenticated") return <></>;
  return (
    <div>
      <h1>Todos</h1>
      <main>
        <div>
          Hello {session.data?.user?.name}{" "}
          <button onClick={() => signOut()}>Sign out</button>
        </div>
        {taskRepo.metadata.apiInsertAllowed && (
          <form onSubmit={addTask}>
            <input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="What needs to be done?"
            />
            <button>Add</button>
          </form>
        )}
        {tasks.map((task) => {
          const setTask = (value: Task) =>
            setTasks((tasks) => tasks.map((t) => (t === task ? value : t)));

          const setCompleted = async (completed: boolean) => {
            const updatedTask = { ...task, completed };
            setTask(updatedTask);
            taskRepo.save(updatedTask)
          };

          const setTitle = (title: string) => setTask({ ...task, title });

          const saveTask = async () => {
            try {
              setTask(await taskRepo.save(task));
            } catch (err: any) {
              alert(err.message);
            }
          };

          const deleteTask = async () => {
            try {
              await taskRepo.delete(task);
              setTasks(tasks.filter((t) => t !== task));
            } catch (err: any) {
              alert(err.message);
            }
          };

          return (
            <div key={task.id}>
              <input
                checked={task.completed}
                type="checkbox"
                onChange={(e) => setCompleted(e.target.checked)}
              />
              <input
                value={task.title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <button onClick={saveTask}>Save</button>
              {taskRepo.metadata.apiDeleteAllowed && (
                <button onClick={deleteTask}>Delete</button>
              )}
            </div>
          );
        })}
        <div>
          <button onClick={() => setAllCompleted(true)}>
            Set all completed
          </button>
          {
            <button onClick={() => setAllCompleted(false)}>
              Set all uncompleted
            </button>
          }
        </div>
      </main>
    </div>
  );
}
