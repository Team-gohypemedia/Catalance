/**
 * Demo database: plain arrays per collection, persisted to localStorage.
 * Seeds come from src/mocks/data/*.js — each file exports { collectionName: [...] }.
 * When any seed changes, the stored demo data resets automatically.
 */
import core from "./data/core";
import learning from "./data/learning";
import earn from "./data/earn";
import community from "./data/community";
import admin from "./data/admin";
import assessment from "./data/assessment";
import payments from "./data/payments";
import catalog from "./data/catalog";
import projects from "./data/projects";
import platform from "./data/platform";
import ops from "./data/ops";
import { uid, now } from "./utils";

const KEY = "campus-demo-db";
const SEEDS = [core, learning, earn, community, admin, assessment, payments, catalog, projects, platform, ops];

function buildSeed() {
  const out = {};
  for (const seed of SEEDS) {
    for (const [name, docs] of Object.entries(seed || {})) out[name] = [...(out[name] || []), ...docs];
  }
  return out;
}

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return String(h);
}

const seedData = buildSeed();
// dates in seeds are relative to "now", so hash structure without timestamps
const SEED_VERSION = hash(JSON.stringify(seedData).replace(/"\d{4}-\d{2}-\d{2}T[^"]+"/g, ""));

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.version === SEED_VERSION) return parsed.data;
    }
  } catch {
    /* fall through to fresh seed */
  }
  return structuredClone(seedData);
}

let state = load();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: SEED_VERSION, data: state }));
  } catch {
    /* storage full or blocked — keep in memory */
  }
}

export const db = {
  all(collection) {
    if (!state[collection]) state[collection] = [];
    return state[collection];
  },
  findById(collection, id) {
    return this.all(collection).find((d) => d.id === id) ?? null;
  },
  find(collection, predicate) {
    return this.all(collection).find(predicate) ?? null;
  },
  filter(collection, predicate) {
    return this.all(collection).filter(predicate);
  },
  insert(collection, doc) {
    const record = { id: doc.id ?? uid(collection.slice(0, 3)), createdAt: now(), ...doc };
    this.all(collection).push(record);
    persist();
    return record;
  },
  update(collection, id, patch) {
    const list = this.all(collection);
    const i = list.findIndex((d) => d.id === id);
    if (i === -1) return null;
    list[i] = { ...list[i], ...(typeof patch === "function" ? patch(list[i]) : patch) };
    persist();
    return list[i];
  },
  remove(collection, id) {
    const list = this.all(collection);
    const i = list.findIndex((d) => d.id === id);
    if (i !== -1) list.splice(i, 1);
    persist();
  },
  save() {
    persist();
  },
  reset() {
    state = structuredClone(seedData);
    persist();
  },
};
