import AsyncStorage from '@react-native-async-storage/async-storage';

import { SCHEMA_VERSION, STORAGE_KEYS } from '@/constants/storageKeys';
import { seedClients, seedProjects, seedSurveys } from '@/data/seed';

import { getClients, saveClients } from './clientStorage';
import { getProjects, saveProjects } from './projectStorage';
import { getSurveys, saveSurveys } from './surveyStorage';

async function writeSeed() {
  await Promise.all([
    saveClients(seedClients()),
    saveProjects(seedProjects()),
    saveSurveys(seedSurveys()),
    AsyncStorage.setItem(STORAGE_KEYS.schema, SCHEMA_VERSION),
  ]);
}

export async function seedIfNeeded() {
  const version = await AsyncStorage.getItem(STORAGE_KEYS.schema);
  if (version === SCHEMA_VERSION) return;
  await writeSeed();
}

export async function resetDemoData() {
  await writeSeed();
}

export async function loadAppData() {
  await seedIfNeeded();
  const [clients, projects, surveys] = await Promise.all([getClients(), getProjects(), getSurveys()]);
  return { clients, projects, surveys };
}

export { archiveClient, createClient, getClients, saveClients, updateClient } from './clientStorage';
export { createProject, getProjects, saveProjects, updateProject } from './projectStorage';
export { clearSession, getSession, saveSession } from './sessionStorage';
export { createSurvey, deleteSurvey, emptyElement, emptySector, getSurveys, saveSurveys, upsertSurvey } from './surveyStorage';
