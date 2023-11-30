import Dexie from 'dexie';

const db = new Dexie('balances');

db.version(1).stores({ data: '++id, key, value' });

class IndexedDBService {
    static async saveData(key, value) {
        if (!key) {
            return;
        }

        try {
            const existingRecord = await db.data.where('key').equals(key).first();

            const parsedVal = JSON.parse(JSON.stringify(value));

            if (!existingRecord) {
                return await db.data.put({ key, value: parsedVal });
            }

            return await db.data.update(existingRecord.id, { key, value: parsedVal });
        } catch (error) {
            console.warn(`[IndexedDB](saveData): ${key}`, error);
        }
    }

    static async getData(key) {
        if (!key) {
            return null;
        }

        try {
            const result = await db.data.where('key').equals(key).first();

            return result ? result.value : null;
        } catch (error) {
            console.warn(`[IndexedDB](getData): ${key}`, error);
            return null;
        }
    }
}

export default IndexedDBService;
