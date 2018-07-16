import { IBotStorage, IBotStorageContext } from "botbuilder";
import { IBotStorageDataHash, IMongoBotStorageSettings, ITTLSettings } from "../types";
export declare class MongoBotStorage implements IBotStorage {
    private mongoClient;
    settings: IMongoBotStorageSettings;
    ttl: ITTLSettings;
    constructor(mongoClient: any, settings: IMongoBotStorageSettings);
    getData(context: IBotStorageContext, callback: (err: Error, data: IBotStorageDataHash) => void): void;
    saveData(context: IBotStorageContext, data: IBotStorageDataHash, callback?: (err: Error) => void): void;
}
