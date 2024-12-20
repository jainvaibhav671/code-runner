import { Client, ID } from "node-appwrite";

export const client = new Client();

export function getClient() {
  return client
    .setEndpoint(process.env.APPWRITE_ENDPOINT as string)
    .setProject(process.env.APPWRITE_PROJECT_ID as string);
}

export function createSessionId() {
  return ID.unique();
}
