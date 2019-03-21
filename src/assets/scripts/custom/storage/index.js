const storage = window.localStorage;

export function get(key) {
    return new Promise((resolve) => {
        resolve(storage.getItem(key));
    });
}

export function save(key, data) {
    return new Promise((resolve, reject) => {
        storage.setItem(key, data);
        get(key)
        .then((d) => {
            if (d) resolve(true);
            else reject(Error(`Failed to save ${key} to local storage.`));
        });
    });
}

export function remove(key) {
    return new Promise((resolve) => {
        storage.removeItem(key);
        resolve(true);
    });
}

export function clear() {
    return new Promise((resolve) => {
        storage.clear();
        resolve(true);
    });
}
