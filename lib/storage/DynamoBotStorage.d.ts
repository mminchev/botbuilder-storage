import { IBotStorage, IBotStorageContext } from "botbuilder";
import { IBotStorageDataHash, IDynamoBotStorageSettings, ITTLSettings } from "../types";
export declare class DynamoBotStorage implements IBotStorage {
    private dynamoClient;
    settings: IDynamoBotStorageSettings;
    ttl: ITTLSettings;
    constructor(dynamoClient: any, settings: IDynamoBotStorageSettings);
    getData(context: IBotStorageContext, callback: (err: Error, data: IBotStorageDataHash) => void): void;
    saveData(context: IBotStorageContext, data: IBotStorageDataHash, callback?: (err: Error) => void): void;
}
