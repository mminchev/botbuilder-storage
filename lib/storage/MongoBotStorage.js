"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const utils_1 = require("../utils");
class MongoBotStorage {
    constructor(mongoClient, settings) {
        this.mongoClient = mongoClient;
        this.settings = settings;
        const { collection, ttl } = settings || {};
        if (!mongoClient || !collection) {
            throw new Error("Invalid constructor arguments for the MongoBotStorage class.");
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
                    _id: userId,
                    type: "userData",
                });
            }
            if (conversationId) {
                readOps.push({
                    _id: `${userId}:${conversationId}`,
                    type: "privateConversationData",
                });
            }
        }
        if (persistConversationData && conversationId) {
            readOps.push({
                _id: conversationId,
                type: "conversationData",
            });
        }
        const db = this.mongoClient;
        const { collection: c } = this.settings;
        Promise.all(readOps.map((entry) => {
            return new Promise((resolve, reject) => {
                const { _id, type } = entry;
                db.collection(c).findOne({ _id }, (err, doc) => {
                    if (err) {
                        return reject(err);
                    }
                    const docData = doc && doc.data || {};
                    const hash = doc && doc.hash;
                    const hashKey = type + "Hash";
                    data[type] = docData;
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
        let addWrite = (type, id, state, prevHash) => {
            const stateAsString = JSON.stringify(state || {});
            const hash = crypto_1.createHash("sha256").update(stateAsString);
            const newHash = hash.digest("hex");
            if (newHash !== prevHash) {
                const writeOperation = {
                    _id: id,
                    data: state,
                    hash: newHash,
                    type,
                    lastModified: new Date(),
                };
                if (this.ttl) {
                    const timestamp = Date.now() + this.ttl[type] * 1000;
                    writeOperation.expireAt = new Date(timestamp);
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
                const id = `${userId}:${conversationId}`;
                const { privateConversationData: d, privateConversationDataHash: h } = data;
                addWrite("privateConversationData", id, d, h);
            }
        }
        if (persistConversationData && conversationId) {
            const { conversationData: d, conversationDataHash: h } = data;
            addWrite("conversationData", conversationId, d, h);
        }
        const db = this.mongoClient;
        const { collection } = this.settings;
        Promise.all(writeOps.map((entry) => {
            return new Promise((resolve, reject) => {
                const { _id, data, hash, type, lastModified, expireAt } = entry;
                const doc = { data, hash, type, lastModified };
                if (expireAt) {
                    doc.expireAt = expireAt;
                }
                const options = { upsert: true };
                db.collection(collection).update({ _id }, doc, options, (err) => {
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
exports.MongoBotStorage = MongoBotStorage;
//# sourceMappingURL=MongoBotStorage.js.map