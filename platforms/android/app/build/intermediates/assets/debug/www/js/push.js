// imports
import * as api from './api';

var push;
var fcmTopics = ['all', 'artists'];
var serverKey = 'AAAAY5tckGE:APA91bG58lohPhe2J-T7PIY-27Ux6CRbz05ns_kfUY1B2raSRvHNQz5oLDq6-UVVWCBnGZ9Pz1qElFtl2bX6PjR8obu7q0auLgwpE9Abj9C0LBLYMNVilXaSGRpSaK_ko-awy6CbYhQz';

// Handle push notificaion receive event
export function handle() {
    return new Promise(function(resolve) {
        // Create notification channels (Android 8.0+)
        try {
            PushNotification.createChannel(function() {
                console.log("Create notification channel for new events.");
            }, function() {
                console.log("Failed to create notification channel for new events.");
            },
            {
                id: "PushPluginChannel",
                description: "New Events",
                importance: 5,
                vibration: true
            });
        
            PushNotification.createChannel(function() {
                console.log("Create notification channel for deals.");
            }, function() {
                console.log("Failed to create notification channel for deals.");
            },
            {
                id: "DealsChannel",
                description: "Deals",
                importance: 3,
                vibration: true
            });
            
            PushNotification.createChannel(function() {
                console.log("Create notification channel for booked events.");
            }, function() {
                console.log("Failed to create notification channel for booked events.");
            },
            {
                id: "BookedEventsChannel",
                description: "Booked Events",
                importance: 5,
                vibration: true
            });
        }
        catch(e) {
            console.warn(e)
        }

        push = PushNotification.init({
            android: {
                icon: 'logo',
                iconColor: 'black',
                topics: fcmTopics,
                clearNotifications: 'false',
                forceShow: 'true'
            },
            browser: 
            {
                
            },
            ios: {
              alert: 'true',
              badge: 'true',
              sound: 'true',
              topics: fcmTopics,
              fcmSandbox: 'true'
            }
        });

        push.on('registration', function(data) {
            console.log('registration id ' + data.registrationId);
            api.saveFcmToken(data.registrationId);
        });
    
        push.on('notification', function(notif) {
            console.log(JSON.stringify(notif,null,2));

            // If weblink in payload
            if(notif.additionalData.extra.weblink) {

                // Load with timeout to allow for device ready
                setTimeout(function() {

                    navigator.notification.confirm(
                        "Open notification link?",
                        function(index) {
                            if(index === 1) cordova.InAppBrowser.open(notif.additionalData.extra.weblink);
                        },
                        "Notification",
                        ["Yes", "No"]
                    );
                    
                // Allow 3 seconds
                }, 3 * 1000);

            }
        });
        
        api.getFcmTopics();

        resolve(true);
    });
};

export function subscribe(topic) {
    push.subscribe(
        topic,
        function() {
            console.log("FCM subscribed to "+topic);
            api.saveFcmTopic(topic);
        },
        function(e) {
            console.log("FCM failed to subscribe to "+topic);
        }
    );
};

export function unsubscribe(topic) {
    push.unsubscribe(
        topic,
        function() {
            console.log("FCM unsubscribed to "+topic);
        },
        function(e) {
            console.log("FCM failed to unsubscribe to "+topic);
        }
    );
};

export function notification(id, topic, title, message, channel = 'PushPluginChannel', extra = null) {
    var content = {
        to: '/topics/' + topic,
        priority: 'high',
        data: {
            title: title,
            message: message,
            notId: parseInt(id),
            'content-available' : '1',
            'force-start' : '1',
            image: 'logo',
            'android_channel_id' : channel,
            extra: extra
        }
    };

    return send(content);
};

function send(message) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            type: "POST",
            url: "https://fcm.googleapis.com/fcm/send",
            dataType: "json",
            contentType: "application/json",
            headers: {
                "Authorization" : "key="+serverKey
            },
            data: JSON.stringify(message),
            success: function(response) {
                resolve(response);
            },
            error: function(xhr, status, error) {
                reject(err);
            }
        })
    })
}