const functions = require('firebase-functions');
var stripe = require("stripe")("sk_test_x4FUCBx7GzOwM9j9RBtoH0lU");
const admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);

var db = admin.firestore();


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

        return response.send('payment completed successfully');
    }).catch(function (error) {
        return response.send('encountered error: ' + error);
    });
});