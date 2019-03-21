import * as storage from '../storage';

const apiSecret = 'sk_test_ccu7Gl8YxOlksae8zncTMTiE';

/**
 * API: Stripe.js Card API
 */

export function getStripeId(token) {
    return new Promise((resolve, reject) => {
        const data = {
            'client_secret' : apiSecret,
            'code' : token,
            'grant_type' : 'authorization_code',
        };

        $.ajax({
            url: 'https://connect.stripe.com/oauth/token',
            headers: {
                'Authorization' : `Bearer ${apiSecret}`,
            },
            method: 'POST',
            data,
            success: (r) => {
                (r.hasOwnProperty('stripe_user_id')) ? resolve(r.stripe_user_id) : reject(false);
            },
        });
    });
}

export function getCustomerInfo() {
    return new Promise((resolve, reject) => {
        storage.get('login')
            .then(JSON.parse)
            .then((u) => {
                $.ajax({
                    url: `https://api.stripe.com/v1/customers/${u.stripeId}`,
                    headers: {
                        'Authorization' : `Bearer ${apiSecret}`,
                    },
                    method: 'GET',
                    success: (r) => {
                        resolve(r);
                    },
                    error: (e) => {
                        reject(e);
                    },
                });
            });
    });
}
