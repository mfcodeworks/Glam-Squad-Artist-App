import * as storage from '../storage';
import * as api from '../api';

export function getEvent(event, forceApi = false) {
    // Get from server
    if(forceApi === true) return apiGetEvent(event);

    return storage.get(`event-${event}`)
        .then(JSON.parse)
        .then(function(e) {
            // If event found return
            if(e && e != null) return e;

            // If not cached then get from server
            return apiGetEvent(event);
        });
}

function apiGetEvent(event) {
    console.log(event);
    return api.getEvent(event)
        .then(function(d) {
            storage.save(`event-${event}`, JSON.stringify(d))
            return d;
        });
}