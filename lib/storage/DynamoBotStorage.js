"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const utils_1 = require("../utils");
class DynamoBotStorage {
    constructor(dynamoClient, settings) {
        this.dynamoClient = dynamoClient;
        this.settings = settings;
        const { tableName, primaryKey, ttl } = settings || {};
        if (!dynamoClient || !tableName || !primaryKey) {
            throw new Error("Invalid constructor arguments for the DynamoBotStorage class.");
        }
        if (ttl) {
            if (!utils_1.validateTTLSettings(ttl)) {
                throw new Error("Invalid TTL settings.");
            }
            else {
                this.ttl = ttl;
            }
        }
    }
    getData(context, callback) {
        const readOps = [];
        const data = {};
        const { userId, conversationId, persistUserData, persistConversationData, } = context;
        if (userId) {
            if (persistUserData) {
                readOps.push({
                    key: userId,
                    type: "userData",
                });
            }
            if (conversationId) {
                readOps.push({
                    key: `${userId}:${conversationId}`,
                    type: "privateConversationData",
                });
            }
        }
        if (persistConversationData && conversationId) {
            readOps.push({
                key: conversationId,
                type: "conversationData",
            });
        }
        const { tableName, primaryKey } = this.settings;
        Promise.all(readOps.map((entry) => {
            return new Promise((resolve, reject) => {
                const { key, type } = entry;
                const item = {
                    TableName: tableName,
                    Key: { [primaryKey]: { S: key } },
                };
                this.dynamoClient.getItem(item, (err, doc) => {
                    if (err) {
                        return reject(err);
                    }
                    const docItem = doc && doc.Item || {};
                    const dataString = docItem.data && docItem.data.S && JSON.parse(docItem.data.S) || {};
                    const hashString = docItem.hash && docItem.hash.S;
                    const hashKey = type + "Hash";
                    data[type] = dataString;
                    data[hashKey] = hashString;
                    resolve();
                });
            });
        })).then(() => {
            callback(null, data);
        }).catch((error) => {
            callback(error, {});
        });
    }
    saveData(context, data, callback) {
        const writeOps = [];
        const { userId, conversationId, persistUserData, persistConversationData, } = context;
        let addWrite = (type, key, state, prevHash) => {
            state = JSON.stringify(state || {});
            const hash = crypto_1.createHash("sha256").update(state);
            const newHash = hash.digest("hex");
            if (newHash !== prevHash) {
                const writeOperation = {
                    key,
                    data: state,
                    hash: newHash,
                    type,
                    lastModified: new Date().toISOString(),
                };
                if (this.ttl) {
                    const timestamp = Math.floor(Date.now() / 1000) + this.ttl[type];
                    writeOperation.expireAt = timestamp;
                }
                writeOps.push(writeOperation);
            }
        };
        addWrite = addWrite.bind(this);
        if (userId) {
            if (persistUserData) {
                addWrite("userData", userId, data.userData, data.userDataHash);
            }
            if (conversationId) {
                const key = `${userId}:${conversationId}`;
                const { privateConversationData: d, privateConversationDataHash: h } = data;
                addWrite("privateConversationData", key, d, h);
            }
        }
        if (persistConversationData && conversationId) {
            const { conversationData: d, conversationDataHash: h } = data;
            addWrite("conversationData", conversationId, d, h);
        }
        const { tableName, primaryKey } = this.settings;
        Promise.all(writeOps.map((entry) => {
            return new Promise((resolve, reject) => {
                const { key, data, hash, type, lastModified, expireAt } = entry;
                const doc = {
                    TableName: tableName,
                    Item: {
                        [primaryKey]: { S: key },
                        data: { S: data },
                        hash: { S: hash },
                        type: { S: type },
                        lastModified: { S: lastModified },
                    },
                };
                if (expireAt) {
                    doc.Item.expireAt = { N: expireAt.toString() };
                }
                this.dynamoClient.putItem(doc, (err) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                });
            });
        })).then(() => {
            callback(null);
        }).catch((error) => {
            callback(error);
        });
    }
}
exports.DynamoBotStorage = DynamoBotStorage;
//# sourceMappingURL=DynamoBotStorage.js.map