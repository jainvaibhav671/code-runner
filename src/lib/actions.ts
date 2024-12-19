"use server";

import { Databases, Permission, Role, Storage } from "appwrite";
import { getClient } from "./db";

type SessionSchema = {
  code: string;
  input: string;
  lang: string;
};

export async function checkFileExists(file_id: string) {
  try {
    const client = getClient();
    const storage = new Storage(client);
    const bucket_id = process.env.APPWRITE_SESSIONS_BUCKET_ID as string;

    const doc = await storage.getFile(bucket_id, file_id);
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
  console.log("createing");
  try {
    const client = getClient();
    const db = new Databases(client);
    const storage = new Storage(client);

    const db_id = process.env.APPWRITE_SESSION_DB_ID as string;
    const collection_id = process.env.APPWRITE_SESSION_COLLECTION_ID as string;

    const code_file_id = `code-${sessionId}.${data.lang}`;
    const input_file_id = `input-${sessionId}.${data.lang}`;

    // store the code and input file
    await createFile(code_file_id, data.code);
    await createFile(input_file_id, data.input);

    const doc = await db.createDocument(db_id, collection_id, sessionId, {
      code_file_id: code_file.$id,
      input_file_id: input_file.$id,
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
    await storage.deleteFile(bucket_id, code_file_id);
    await storage.deleteFile(bucket_id, input_file_id);

    // create with new content
    await createFile(code_file_id, data.code);
    await createFile(input_file_id, data.input);

    return { error: null };
  } catch (error: any) {
    console.log(error);
    return { error: error.type };
  }
}

export async function getSession(sessionId: string) {
  const client = getClient();
  const db = new Databases(client);

  const db_id = process.env.APPWRITE_SESSION_DB_ID as string;
  const collection_id = process.env.APPWRITE_SESSION_COLLECTION_ID as string;

  const doc = await db.getDocument(db_id, collection_id, sessionId);

  console.log(doc);
  return doc;
}
