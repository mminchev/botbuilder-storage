"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const utils_1 = require("../utils");
class RedisBotStorage {
    constructor(redisClient, settings) {
        this.redisClient = redisClient;
        this.settings = settings;
        const { ttl } = settings || {};
        if (!redisClient) {
            throw new Error("Invalid constructor arguments for the RedisBotStorage class.");
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
                    key: `userData:user:${userId}`,
                    type: "userData",
                });
            }
            if (conversationId) {
                readOps.push({
                    key: `privateConversationData:user:${userId}:conversation:${conversationId}`,
                    type: "privateConversationData",
                });
            }
        }
        if (persistConversationData && conversationId) {
            readOps.push({
                key: `conversationData:conversation:${conversationId}`,
                type: "conversationData",
            });
        }
        Promise.all(readOps.map((entry) => {
            return new Promise((resolve, reject) => {
                const { key, type } = entry;
                this.redisClient.get(key, (err, res) => {
                    if (err) {
                        return reject(err);
                    }
                    res = res || "{}#";
                    const [obj, hash] = res.split("#");
                    const hashKey = type + "Hash";
                    data[type] = JSON.parse(obj);
                    data[hashKey] = hash;
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
                    value: `${state}#${newHash}`,
                };
                if (this.ttl) {
                    writeOperation.expireAt = this.ttl[type];
                }
                writeOps.push(writeOperation);
            }
        };
        addWrite = addWrite.bind(this);
        if (userId) {
            if (persistUserData) {
                const id = "userData";
                const key = `${id}:user:${userId}`;
                addWrite(id, key, data.userData, data.userDataHash);
            }
            if (conversationId) {
                const id = "privateConversationData";
                const key = `${id}:user:${userId}:conversation:${conversationId}`;
                const { privateConversationData: d, privateConversationDataHash: h } = data;
                addWrite(id, key, d, h);
            }
        }
        if (persistConversationData && conversationId) {
            const id = "conversationData";
            const key = `${id}:conversation:${conversationId}`;
            const { conversationData: d, conversationDataHash: h } = data;
            addWrite(id, key, d, h);
        }
        Promise.all(writeOps.map((entry) => {
            return new Promise((resolve, reject) => {
                const { key, value, expireAt } = entry;
                const callback = (err) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                };
                const args = [key, value, callback];
                if (expireAt) {
                    args.splice(2, 0, "EX", expireAt);
                }
                this.redisClient.set(...args);
            });
        })).then(() => {
            callback(null);
        }).catch((error) => {
            callback(error);
        });
    }
}
exports.RedisBotStorage = RedisBotStorage;
//# sourceMappingURL=RedisBotStorage.js.map