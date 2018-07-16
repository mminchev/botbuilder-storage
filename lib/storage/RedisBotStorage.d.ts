import { IBotStorage, IBotStorageContext } from "botbuilder";
import { IBotStorageDataHash, IRedisBotStorageSettings, ITTLSettings } from "../types";
export declare class RedisBotStorage implements IBotStorage {
    private redisClient;
    settings: IRedisBotStorageSettings;
    ttl: ITTLSettings;
    constructor(redisClient: any, settings?: IRedisBotStorageSettings);
    getData(context: IBotStorageContext, callback: (err: Error, data: IBotStorageDataHash) => void): void;
    saveData(context: IBotStorageContext, data: IBotStorageDataHash, callback?: (err: Error) => void): void;
}
