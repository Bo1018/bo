import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Document, DocumentSummary } from "@/lib/types";

interface ScanDB extends DBSchema {
  documents: {
    key: string;
    value: Document;
    indexes: { "by-updated": number };
  };
}

const DB_NAME = "simplescan";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<ScanDB>> | null = null;

function getDB() {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB를 사용할 수 없는 환경입니다.");
  }
  if (!dbPromise) {
    dbPromise = openDB<ScanDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore("documents", { keyPath: "id" });
        store.createIndex("by-updated", "updatedAt");
      },
    });
  }
  return dbPromise;
}

export async function saveDocument(doc: Document): Promise<void> {
  const db = await getDB();
  await db.put("documents", doc);
}

export async function getDocument(id: string): Promise<Document | undefined> {
  const db = await getDB();
  return db.get("documents", id);
}

export async function deleteDocument(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("documents", id);
}

/** 목록 화면용: 최근 업데이트순으로 경량 요약 반환. */
export async function listDocumentSummaries(): Promise<DocumentSummary[]> {
  const db = await getDB();
  const docs = await db.getAllFromIndex("documents", "by-updated");
  return docs
    .map((doc) => ({
      id: doc.id,
      title: doc.title,
      pageCount: doc.pages.length,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      cover: doc.pages[0]?.image,
    }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function renameDocument(id: string, title: string): Promise<void> {
  const db = await getDB();
  const doc = await db.get("documents", id);
  if (!doc) return;
  doc.title = title;
  doc.updatedAt = Date.now();
  await db.put("documents", doc);
}
