"use strict";
const functions = require("firebase-functions");
const { updateReferralStatus } = require("./functions/referrals/updateReferralStatus");
const { sendPushNotification } = require("./functions/fcm/sendPushNotification");
exports.updateReferralStatus = updateReferralStatus;
exports.sendPushNotification = sendPushNotification;
