import * as storage from './storage';
import * as api from './api';

export function getEvent(jobId) {
    // Try load from storage
    try {
        return storage.get(`event-${jobId}`)
            .then(JSON.parse)
            .then(function(e) {
                // If event found return
                if(e) return e;

                // If not cached then get from server
                return apiGetEvent();
            })
    }
    // Storage failed, get from server
    catch(e) {
        return apiGetEvent();
    }
}

function apiGetEvent() {
    return api.getEvent(jobId)
        .then(function(d) {
            return d.data;
        });
}