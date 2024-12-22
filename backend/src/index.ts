import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import {
  buildDockerCommand,
  checkFileExists,
  createSession,
  downloadFileFromStorage,
  getSession,
  updateSession,
} from "./lib/actions.js";
import { getClient } from "./lib/db.js";
import { v4 as uuidv4 } from "uuid";
import { exec } from "child_process";
import { ID } from "node-appwrite";

const port = Number(process.env.PORT) || 3000;
console.log(`Server is running on http://localhost:${port}`);

const app = new Hono();
const server = serve({ fetch: app.fetch, port });
const io = new Server(server as HttpServer);

app.get("/", (c) => {
  return c.text("This is the backend of the code-runner!");
});

app.get("/session-id", async (c) => {
  return c.json({
    session_id: ID.unique(6),
  });
});

app.post("/save-session", async (c) => {
  const data = (await c.req.json()) as {
    code: string;
    input: string;
    lang: string;
    sessionId: string;
  };

  const { exist } = await checkFileExists(
    `code-${data.sessionId}.${data.lang}`
  );

  let error;
  if (exist) {
    const { error: er } = await updateSession(data, data.sessionId);
    error = er;
  } else {
    const { error: er } = await createSession(data, data.sessionId);
    error = er;
  }

  if (error) {
    return c.json({ success: false, error });
  }

  return c.json({ success: true });
});

app.post("/run-code", async (c) => {
  const data = (await c.req.json()) as {
    code: string;
    input: string;
    lang: string;
    sessionId: string;
  };

  const tempDir = `./tmp/executions/${uuidv4()}`;

  const { doc, error } = await getSession(data.sessionId);
  if (!doc) {
    console.warn(error);
    return c.json({ success: false, error: "Session not found" });
  }

  const code_file_id = doc.code_file_id;
  const input_file_id = doc.input_file_id;
  const lang = doc.lang;

  const { filePath: code_file_path, error: er1 } =
    await downloadFileFromStorage(code_file_id, tempDir);
  if (!code_file_path) {
    return c.json({ success: false, error: er1 });
  }

  const { filePath: input_file_path, error: er2 } =
    await downloadFileFromStorage(input_file_id, tempDir);
  if (!input_file_path) {
    return c.json({ success: false, error: er2 });
  }

  const cmd = buildDockerCommand(lang, code_file_path, input_file_path);
  console.log(data, cmd);

  const taskNamespace = io.of(`/task/${data.sessionId}`);
  taskNamespace.on("connection", (socket) => {
    try {
      console.log("executing");
      const child = exec(cmd);

      child.stdout?.on("data", (data) => {
        console.log(data);
        socket.emit("output", data.toString());
      });

      child.stderr?.on("data", (data) => {
        console.log(data);
        socket.emit("error", data.toString());
      });

      child.on("close", (code) => {
        console.log(code);
        socket.emit("done", `Execution finished with exit code ${code}`);
        taskNamespace.disconnectSockets();
      });
    } catch (error) {
      console.warn(error);
    }
  });

  return c.json({ success: true });
});
