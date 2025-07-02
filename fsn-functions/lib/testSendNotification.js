"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/// <reference types="node" />
const admin = __importStar(require("firebase-admin"));
const serviceAccount = __importStar(require("./serviceAccountKey.json")); // ✅ تأكد أن الملف موجود بنفس المجلد
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});
const payload = {
    notification: {
        title: '🚀 Test Notification',
        body: 'Push notification sent successfully!',
    },
    tokens: [
        'feedhapfqrxh0NzyewDJ8q:APA91bEDQq33nUFJbqFxHbp6hleV4HoyvymNxEYaJJbPU17bPhj_zJDc764ElHkMfJ0HyTQmtRW5cg8gJjUpQHQLL3yQv8p60FzjZhSW48lz283YuDxk-jw',
    ],
};
admin
    .messaging()
    .sendEachForMulticast(payload)
    .then((response) => {
    console.log('✅ Sent:', response.successCount, '🧨 Failed:', response.failureCount);
    console.log(response.responses);
})
    .catch((err) => {
    console.error('❌ Error sending notification:', err);
});
