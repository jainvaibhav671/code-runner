"use server";

import { Databases, Permission, Role, Storage } from "node-appwrite";
import { getClient } from "./db.js";
import fs from "fs-extra";
import dotenv from "dotenv";

dotenv.config();

type SessionSchema = {
  code: string;
  input: string;
  lang: string;
};

type Languages = "c" | "cpp" | "java" | "python" | "javascript";

export async function checkFileExists(file_id: string) {
  try {
    const client = getClient();
    const storage = new Storage(client);
    const bucket_id = process.env.APPWRITE_SESSIONS_BUCKET_ID as string;

    await storage.getFile(bucket_id, file_id);
    return { exist: true, error: null };
  } catch (error: any) {
    return {
      exist: false,
      error: error.type,
    };
  }
}

export async function createFile(file_id: string, file_data: string) {
  try {
    const client = getClient();
    const storage = new Storage(client);

    const bucket_id = process.env.APPWRITE_SESSIONS_BUCKET_ID as string;

    await storage.createFile(
      bucket_id,
      file_id,
      new File([file_data], file_id, {
        type: "text/plain",
      }),
      [
        Permission.read(Role.any()),
        Permission.update(Role.any()),
        Permission.write(Role.any()),
        Permission.delete(Role.any()),
      ]
    );
    return { error: null };
  } catch (error: any) {
    return { error: error.type };
  }
}

export async function createSession(data: SessionSchema, sessionId: string) {
  console.log("creating");
  try {
    const client = getClient();
    const db = new Databases(client);

    const db_id = process.env.APPWRITE_SESSION_DB_ID as string;
    const collection_id = process.env.APPWRITE_SESSION_COLLECTION_ID as string;

    const code_file_id = `code-${sessionId}.${data.lang}`;
    const input_file_id = `input-${sessionId}.${data.lang}`;

    // store the code and input file
    const { error: er1 } = await createFile(code_file_id, data.code);
    if (er1) {
      return { error: er1 };
    }

    const { error: er2 } = await createFile(input_file_id, data.input);
    if (er2) {
      return { error: er2 };
    }

    const doc = await db.createDocument(db_id, collection_id, sessionId, {
      code_file_id,
      input_file_id,
      lang: data.lang,
    });
    return {
      doc: doc,
      error: null,
    };
  } catch (error: any) {
    if (error.type === "storage_file_not_found") {
      console.log("File not found");
    } else if (error.type === "storage_file_already_exists") {
      console.log("File exists");
    }

    return {
      doc: null,
      error: error.type,
    };
  }
}

export async function updateSession(data: SessionSchema, sessionId: string) {
  console.log("updating");
  try {
    const client = getClient();
    const storage = new Storage(client);
    const bucket_id = process.env.APPWRITE_SESSIONS_BUCKET_ID as string;

    const code_file_id = `code-${sessionId}.${data.lang}`;
    const input_file_id = `input-${sessionId}.${data.lang}`;

    // delete the files
    await storage
      .deleteFile(bucket_id, code_file_id)
      .catch(() =>
        console.log(`Failed to delete the code file: ${code_file_id}`)
      );
    await storage
      .deleteFile(bucket_id, input_file_id)
      .catch(() => `Failed to delete the input file: ${input_file_id}`);

    // create with new content
    const { error: er1 } = await createFile(code_file_id, data.code);
    if (er1) {
      return { error: er1 };
    }
    const { error: er2 } = await createFile(input_file_id, data.input);
    if (er2) {
      return { error: er2 };
    }

    return { error: null };
  } catch (error: any) {
    console.log(error);
    return { error: error.type };
  }
}

export async function getSession(sessionId: string) {
  try {
    const client = getClient();
    const db = new Databases(client);

    const db_id = process.env.APPWRITE_SESSION_DB_ID as string;
    const collection_id = process.env.APPWRITE_SESSION_COLLECTION_ID as string;
    console.log(db_id, collection_id);
    const doc = await db.getDocument(db_id, collection_id, sessionId);

    return {
      doc,
      error: null,
    };
  } catch (error: any) {
    return {
      doc: null,
      error,
    };
  }
}

// Function to download a file from Appwrite storage
export async function downloadFileFromStorage(fileId: string, destDir: string) {
  try {
    const filePath = `${destDir}/${fileId}`;
    await fs.ensureDir(destDir);

    const bucket_id = process.env.APPWRITE_SESSIONS_BUCKET_ID as string;
    const client = getClient();
    const storage = new Storage(client);

    const arrayBuffer = await storage.getFileDownload(bucket_id, fileId);
    await fs.writeFile(filePath, new Uint8Array(arrayBuffer));

    return { filePath, error: null };
  } catch (error: any) {
    console.warn(error);
    return { filePath: null, error };
  }
}

export function buildDockerCommand(
  language: Languages,
  codeFile: string,
  inputFile: string
) {
  const languageImage = {
    python: "python:3.10",
    javascript: "node:18",
    c: "gcc",
    cpp: "gcc",
    java: "java:17",
  };

  const runCommand = {
    python: `python /sandbox/${codeFile} ${
      inputFile ? `< /sandbox/${inputFile}` : ""
    }`,
    javascript: `node /sandbox/${codeFile} ${
      inputFile ? `< /sandbox/${inputFile}` : ""
    }`,
    c: `gcc /sandbox/${codeFile} -o /sandbox/code && /sandbox/code ${
      inputFile ? `< /sandbox/${inputFile}` : ""
    }`,
    cpp: `g++ /sandbox/${codeFile} -o /sandbox/code && /sandbox/code ${
      inputFile ? `< /sandbox/${inputFile}` : ""
    }`,
    java: `java /sandbox/${codeFile} ${
      inputFile ? `< /sandbox/${inputFile}` : ""
    }`,
  };

  const image = languageImage[language];
  const cmd = runCommand[language];

  return `
    docker run --rm \
    --memory=128m --cpus=0.5 \
    -v ${codeFile}:/sandbox/${codeFile} \
    ${inputFile ? `-v ${inputFile}:/sandbox/${inputFile}` : ""} \
    -w /sandbox \
    ${image} sh -c "${cmd}";
  `.trim();
}
