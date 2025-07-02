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
exports.syncReferralList = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
exports.syncReferralList = functions.firestore
    .document('users/{userId}')
    .onWrite(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();
    // تحقق من أن المستخدم تم التحقق منه
    if (!newData || newData.kycStatus !== 'Verified')
        return;
    const referredBy = newData.referredBy;
    const referredEmail = newData.email;
    if (!referredBy || !referredEmail)
        return;
    // ابحث عن حساب المحيل باستخدام referralCode
    const usersRef = admin.firestore().collection('users');
    const refQuery = await usersRef.where('referralCode', '==', referredBy).limit(1).get();
    if (refQuery.empty)
        return;
    const refUserDoc = refQuery.docs[0];
    const refUserId = refUserDoc.id;
    const refUserData = refUserDoc.data();
    const referralList = refUserData.referralList || [];
    const alreadyExists = referralList.find((r) => r.email === referredEmail);
    if (alreadyExists) {
        alreadyExists.status = 'Verified';
    }
    else {
        referralList.push({ email: referredEmail, status: 'Verified', claimed: false });
    }
    await usersRef.doc(refUserId).update({ referralList });
});
