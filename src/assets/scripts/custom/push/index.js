// imports
import * as api from '../api';
import * as storage from '../storage';
import * as chat from '../chat';

let push;
const fcmTopics = ['all', 'artists', 'deals'];
const notificationUrl = 'https://fcm.googleapis.com/fcm/send';
const serverKey = 'AAAAY5tckGE:APA91bG58lohPhe2J-T7PIY-27Ux6CRbz05ns_kfUY1B2raSRvHNQz5oLDq6-UVVWCBnGZ9Pz1qElFtl2bX6PjR8obu7q0auLgwpE9Abj9C0LBLYMNVilXaSGRpSaK_ko-awy6CbYhQz';

export function subscribe(topic) {
    return new Promise((resolve, reject) => {
        // Remove illegal spaces
        if (!topic) return;
        topic = topic.replace(' ', '-');

        push.subscribe(
            topic,
            () => {
                console.log(`FCM subscribed to ${topic}`);
                api.saveFcmTopic(topic);
                resolve(true);
            },
            (e) => {
                console.log(`FCM failed to subscribe to ${topic}`);
                reject(new Error(e));
            }
        );
    });
}

export function unsubscribe(topic) {
    return new Promise((resolve, reject) => {
        push.unsubscribe(
            topic,
            () => {
                console.log(`FCM unsubscribed to ${topic}`);
                resolve(true);
            },
            (e) => {
                console.log(`FCM failed to unsubscribe to ${topic}`);
                reject(new Error(e));
            }
        );
    });
}

function subUserLocale() {
    return storage.get('locale')
    .then((l) => {
        return subscribe(l.country);
    });
}

// Handle push notificaion receive event
export function handle() {
    return new Promise((resolve) => {
        try {
            PushNotification.createChannel(() => {
                console.log('Create notification channel for events.');
            }, () => {
                console.log('Failed to create notification channel for events.');
            },
            {
                id: 'PushPluginChannel',
                description: 'New Events',
                importance: 5,
                vibration: true,
            });

            PushNotification.createChannel(() => {
                console.log('Create notification channel for deals.');
            }, () => {
                console.log('Failed to create notification channel for deals.');
            },
            {
                id: 'DealsChannel',
                description: 'Product Deal Notifications',
                importance: 3,
                vibration: true,
            });

            PushNotification.createChannel(() => {
                console.log('Create notification channel for deals.');
            }, () => {
                console.log('Failed to create notification channel for deals.');
            },
            {
                id: 'LocaleChannel',
                description: 'Local Events',
                importance: 3,
                vibration: true,
            });

            PushNotification.createChannel(() => {
                console.log('Create notification channel for booked events.');
            }, () => {
                console.log('Failed to create notification channel for booked events.');
            },
            {
                id: 'BookedEventsChannel',
                description: 'Booked Events',
                importance: 5,
                vibration: true,
            });
        } catch (e) {
            console.warn(e);
        }

        push = PushNotification.init({
            android: {
                icon: 'logo',
                iconColor: 'black',
                topics: fcmTopics,
                clearNotifications: 'false',
                forceShow: 'true',
            },
            browser: {},
            ios: {
                alert: 'true',
                badge: 'true',
                sound: 'true',
                topics: fcmTopics,
                fcmSandbox: 'true',
            },
        });

        push.on('registration', (data) => {
            console.log(`Push ID ${data.registrationId}`);
            api.saveFcmToken({ fcm_token: data.registrationId });
            chat.pushSub(data.registrationId);
            subUserLocale();
        });

        push.on('notification', (notif) => {
            console.log(JSON.stringify(notif, null, '\t'));

            if (notif.hasOwnProperty('weblink')) {
                // Load with timeout to allow for device ready
                setTimeout(() => {
                    navigator.notification.confirm(
                        'Open notification link?',
                        (index) => {
                            if (index === 1) cordova.InAppBrowser.open(notif.additionalData.extra.weblink);
                        },
                        'Notification',
                        ['Yes', 'No']
                    );

                // Allow 3 seconds
                }, 3 * 1000);
            }
        });

        api.getFcmTopics();

        resolve(true);
    });
}

function send(message, url) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: 'post',
            url,
            dataType: 'json',
            contentType: 'application/json',
            headers: {
                'Authorization' : `key=${serverKey}`,
            },
            data: JSON.stringify(message),
            success: (response) => {
                resolve(response);
            },
            error: (xhr, status, error) => {
                reject(error);
            },
        });
    });
}

export function notification(id, topic, title, message, channel = 'PushPluginChannel', extra = null) {
    const content = {
        to: `/topics/${topic}`,
        priority: 'high',
        data: {
            title,
            message,
            notId: parseInt(id),
            'content-available' : '1',
            'force-start' : '1',
            image: 'logo',
            'android_channel_id' : channel,
            extra,
        },
    };
    return send(content, notificationUrl);
}
