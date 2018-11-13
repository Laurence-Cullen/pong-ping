const functions = require('firebase-functions');
var stripe = require("stripe")("sk_test_x4FUCBx7GzOwM9j9RBtoH0lU");

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

// Charge user £5
exports.charge500 = functions.https.onRequest((request, response) => {

    // Token is created using Checkout or Elements!
    // Get the payment token ID submitted by the form:
    const token = request.body.stripeToken; // Using Express

    const charge = stripe.charges.create({
        amount: 500,
        currency: 'gbp',
        description: 'Example charge',
        source: token,
    }).then(function () {
        return response.redirect('https://pong-ping1.firebaseapp.com/');
    });
});