"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function validateTTLSettings(settings) {
    const { userData: u, conversationData: c, privateConversationData: p } = settings;
    const invalidUserDataValue = !u || typeof u !== "number";
    const invalidConversationDataValue = !c || typeof c !== "number";
    const invalidPrivateConversationDataValue = !p || typeof p !== "number";
    if (invalidUserDataValue || invalidConversationDataValue || invalidPrivateConversationDataValue) {
        return false;
    }
    return true;
}
exports.validateTTLSettings = validateTTLSettings;
//# sourceMappingURL=utils.js.map