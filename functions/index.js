let functions = require('firebase-functions');
let stripe = require("stripe")("sk_test_x4FUCBx7GzOwM9j9RBtoH0lU");
let admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);

let db = admin.firestore();


// Charge user £5
exports.charge500 = functions.https.onRequest((request, response) => {

    // boilerplate CORS code
    response.set('Access-Control-Allow-Origin', '*');

    if (request.method === 'OPTIONS') {
        // Send response to OPTIONS requests
        response.set('Access-Control-Allow-Methods', 'GET');
        response.set('Access-Control-Allow-Headers', 'Content-Type');
        response.set('Access-Control-Max-Age', '3600');
        response.status(204).send('');
    } else {
        // Set CORS headers for the main request
        response.set('Access-Control-Allow-Origin', '*');
    }

    // Token is created using Checkout or Elements!
    // Get the payment token ID submitted by the form:
    const token = request.body.token; // Using Express

    const charge = stripe.charges.create({
        amount: request.body.amount,
        currency: 'gbp',
        description: 'Example charge',
        source: token,
    }).then(function () {
        let playersRef = db.collection('players');

        var query = playersRef.where('UID', '==', request.body.UID).get()
            .then(snapshot => {
                let loopCounter = 0;

                snapshot.forEach(doc => {
                    if (loopCounter > 1) {
                        return response.send('loop counter went over 1, UID assigned to multiple players');
                    }

                    if (doc.data().credit) {
                        doc.update({credit: request.body.amount + doc.data().credit})
                            .then(function () {
                                return response.send('payment completed successfully, credit: ' + doc.data().credit);
                            }).catch(function (error) {
                                return response.send('tried to add to existing user credit but failed: ' + error);
                        });
                    } else {
                        doc.update({credit: request.body.amount})
                            .then(function () {
                                return response.send('payment completed successfully, credit: ' + doc.data().credit);
                            }).catch(function (error) {
                                return response.send('tried to create user credit field but failed: ' + error)
                        });
                    }
                    loopCounter ++;
                });

                if (loopCounter === 0) {
                    return response.send('Found no player with matching UID');
                }

            })
        .catch(error => {
            return response.send('encountered error on line 72: ' + error);
        });
    }).catch(function (error) {
        return response.send('encountered error: ' + error);
    });
});