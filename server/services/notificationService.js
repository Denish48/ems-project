const axios = require("axios");
const { FCMserverKey } = require('../configs');
// const fcm = new FCM(FCMserverkey)
const mongoose = require('mongoose')
const DeviceInfo = mongoose.model('DeviceInfo')

exports.sendNotification = async (userArr, mobilePayload) => {
    return new Promise(async (resolve) => {
        try {
            resolve();
            const deviceQuery = {};
            if (userArr?.length > 0 && Array.isArray(userArr)) {
                deviceQuery.user_id = { $in: userArr }
            }
            const usersList = await DeviceInfo.find(deviceQuery).limit(1).exec();
            if (!usersList && usersList.length === 0) {
                return;
            }
            var fcm_tokens = usersList.map(item => item.device_token);

            const headers = { 'authorization': `key=${FCMserverKey}` };

            const api_url = 'https://fcm.googleapis.com/fcm/send';
            for (const token of fcm_tokens) {
                let notification = {
                    'title': 'New notification from Elsner Elevate',
                    'body': 'Elsner Elevate'
                };
                let body = {
                    "priority": "HIGH",
                    "to": token,
                    "notification": notification,
                    "mutable_content": true,
                    "sound": "Tri-tone"
                }

                if (mobilePayload) {
                    body = {
                        ...body,
                        ...mobilePayload
                    }
                }

                const response = await axios.post(api_url, body, { headers: headers, 'content_type': 'application/json' });
                console.log(response?.data);
            }
        } catch (err) {
            console.log('Push catch', err);
            resolve();
        }
    });
}