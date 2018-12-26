import * as storage from './storage';
import * as api from './api';

/**
 * API: Stripe.js Card API
 */
export function getCustomerId(token) {
    return new Promise(function(resolve) {
        storage.get("login")
            .then(JSON.parse)
            .then(function(u) {
                if(u.stripeId) {
                    updateStripeCustomer(token)
                        .then(function() {
                            resolve(u.stripeId);
                        });
                }
                else {
                    makeStripeCustomer(token, u.email)
                        .then(function(r) {
                            resolve(r.id)
                        });
                }
            })
    });
}

export function updateStripeCustomer(token) {
    return new Promise(function(resolve) {
        storage.get("login")
            .then(function(u) {
                return JSON.parse(u);
            })
            .then(function(u) {
                var url = "https://api.stripe.com/v1/customers/" + u.stripeId + "/sources"

                $.ajax({
                    url: url,
                    headers: {
                        'Authorization' : 'Bearer sk_test_ccu7Gl8YxOlksae8zncTMTiE'
                    },
                    method: "POST",
                    data: "source="+token,
                    success: function(r) {
                        console.log(r);
                        resolve(r);
                    }
                });
            });
    });
}

export function getStripeId(token) {
    return new Promise(function(resolve, reject) {
        var data = {
            "client_secret" : "sk_test_ccu7Gl8YxOlksae8zncTMTiE",
            "code" : token,
            "grant_type" : "authorization_code"
        }

        $.ajax({
            url: "https://connect.stripe.com/oauth/token",
            headers: {
                'Authorization' : 'Bearer sk_test_ccu7Gl8YxOlksae8zncTMTiE'
            },
            method: "POST",
            data: data,
            success: function(r) {
                console.log(r);
                
                if(r.stripe_user_id) {
                    resolve(r.stripe_user_id);
                } else {
                    reject(false);
                }
            }
        });
    });
}

export function deleteCard(cardId) {
    return new Promise(function(resolve) {
        storage.get("login")
            .then(function(u) {
                return JSON.parse(u);
            })
            .then(function(u) {
                var url = "https://api.stripe.com/v1/customers/" + u.stripeId + "/sources/" + cardId
                $.ajax({
                    url: url,
                    headers: {
                        'Authorization' : 'Bearer sk_test_ccu7Gl8YxOlksae8zncTMTiE'
                    },
                    method: "DELETE",
                    success: function(r) {
                        console.log(r);
                        resolve(r);
                    }
                });
            });
    });
}

export function getUserCards() {
    return new Promise(function(resolve, reject) {
        storage.get("login")
            .then(function(u) {
                return JSON.parse(u);
            })
            .then(function(u) {
                if(!u.stripeId) {
                    reject(new Error("No Stripe ID for current client"));
                    return;
                }
                var url = "https://api.stripe.com/v1/customers/" + u.stripeId + "/sources?object=card"

                $.ajax({
                    url: url,
                    headers: {
                        'Authorization' : 'Bearer sk_test_ccu7Gl8YxOlksae8zncTMTiE'
                    },
                    method: "GET",
                    success: function(r) {
                        resolve(r.data);
                    },
                    error: function(xhr, status, err) {
                        reject(err);
                    }
                });
            });
    });
}

export function getCustomerInfo() {
    return new Promise(function(resolve) {
        storage.get("login")
            .then(function(u) {
                return JSON.parse(u);
            })
            .then(function(u) {
                var url = "https://api.stripe.com/v1/customers/" + u.stripeId

                $.ajax({
                    url: url,
                    headers: {
                        'Authorization' : 'Bearer sk_test_ccu7Gl8YxOlksae8zncTMTiE'
                    },
                    method: "GET",
                    success: function(r) {
                        resolve(r);
                    }
                });
            });
    });
}

export function updateDefaultUserCard(cardID) {
    return new Promise(function(resolve) {
        storage.get("login")
            .then(function(u) {
                return JSON.parse(u);
            })
            .then(function(u) {
                var url = "https://api.stripe.com/v1/customers/" + u.stripeId

                $.ajax({
                    url: url,
                    headers: {
                        'Authorization' : 'Bearer sk_test_ccu7Gl8YxOlksae8zncTMTiE'
                    },
                    method: "POST",
                    data: "default_source="+cardID,
                    success: function(r) {
                        console.log(r);
                        resolve(r);
                    }
                });
            });
    });
}