import type { PipelineEntry, Settings } from '../types';

const PIPELINE_KEY = 'prospectai_pipeline';
const SETTINGS_KEY = 'prospectai_settings';

export const storage = {
  getPipeline(): PipelineEntry[] {
    try {
      return JSON.parse(localStorage.getItem(PIPELINE_KEY) || '[]');
    } catch { return []; }
  },

  savePipeline(entries: PipelineEntry[]): void {
    localStorage.setItem(PIPELINE_KEY, JSON.stringify(entries));
  },

  addEntry(entry: PipelineEntry): void {
    const entries = storage.getPipeline();
    const existing = entries.findIndex(e => e.id === entry.id);
    if (existing > -1) entries[existing] = entry;
    else entries.unshift(entry);
    storage.savePipeline(entries);
  },

  updateEntry(id: string, updates: Partial<PipelineEntry>): void {
    const entries = storage.getPipeline();
    const idx = entries.findIndex(e => e.id === id);
    if (idx > -1) {
      entries[idx] = { ...entries[idx], ...updates };
      storage.savePipeline(entries);
    }
  },

  deleteEntry(id: string): void {
    storage.savePipeline(storage.getPipeline().filter(e => e.id !== id));
  },

  getSettings(): Settings {
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      return { workerUrl: 'https://prospectai.drivyn-ai-innovations.workers.dev', ...saved };
    } catch {
      return { senderName: '', senderPhone: '', workerUrl: 'https://prospectai.drivyn-ai-innovations.workers.dev', defaultServiceType: 'HVAC' };
    }
  },

  saveSettings(settings: Settings): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },
};
