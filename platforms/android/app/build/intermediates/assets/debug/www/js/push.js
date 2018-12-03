// imports
import * as api from './api';

var push;
var fcmTopics = ['all', 'artists'];
var serverKey = 'AAAAY5tckGE:APA91bG58lohPhe2J-T7PIY-27Ux6CRbz05ns_kfUY1B2raSRvHNQz5oLDq6-UVVWCBnGZ9Pz1qElFtl2bX6PjR8obu7q0auLgwpE9Abj9C0LBLYMNVilXaSGRpSaK_ko-awy6CbYhQz';

// Handle push notificaion receive event
export function handle() {
    return new Promise(function(resolve) {
        push = PushNotification.init({
            android: {
                icon: 'logo',
                iconColor: 'white',
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
        });
    
        push.on('notification', function(notif) {
            console.log(JSON.stringify(notif,null,2));
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

export function notification(id, topic, title, message, extra = null) {
    var content = {
        to: '/topics/' + topic,
        priority: 'high',
        data: {
            title: title,
            message: message,
            notId: parseInt(id),
            'content-available' : '1',
            image: 'logo',
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