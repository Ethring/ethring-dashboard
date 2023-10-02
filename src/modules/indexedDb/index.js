import Dexie from 'dexie';

const db = new Dexie('balances');

db.version(1).stores({ data: '++id, key, value' });

class IndexedDBService {
    static async saveData(key, value) {
        try {
            const existingRecord = await db.data.where('key').equals(key).first();

            if (existingRecord) {
                return await db.data.update(existingRecord.id, { key, value });
            }

            return await db.data.put({ key, value });
        } catch (error) {
            console.error('Error when saving data to IndexedDB:', error);
        }
    }

    static async getData(key) {
        try {
            const result = await db.data.where('key').equals(key).first();

            return result ? result.value : null;
        } catch (error) {
            console.error('Error when retrieving data from IndexedDB:', error);
            return null;
        }
    }
}

export default IndexedDBService;
