const storage = window.localStorage;

export function save(key, data) {
    return new Promise(function(resolve, reject) {
        storage.setItem(key, data);
        get(key)
        .then(function(d) {
            if(d) resolve(true);
            else reject(Error("Failed to save "+key+" to local storage."));
        });
    });
}

export function get(key) {
    return new Promise(function(resolve) {
        var data = storage.getItem(key);
        resolve(data);
    });
}

export function remove(key) {
    return new Promise(function(resolve) {
        storage.removeItem(key);
        resolve(true);
    });
}

export function clear() {
    return new Promise(function(resolve) {
        storage.clear();
        resolve(true);
    });
}