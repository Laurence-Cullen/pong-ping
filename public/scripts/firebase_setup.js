// Initialize Firebase
const config = {
    apiKey: "AIzaSyDhK3e6CvMP6M9g4MytCIxhDhgePG02v4c",
    authDomain: "pong-ping1.firebaseapp.com",
    databaseURL: "https://pong-ping1.firebaseio.com",
    projectId: "pong-ping1",
    storageBucket: "pong-ping1.appspot.com",
    messagingSenderId: "451414841154"
};

firebase.initializeApp(config);

// Initialize Cloud Firestore through Firebase
let db = firebase.firestore();

// Disable deprecated features
db.settings({
    timestampsInSnapshots: true
});

// Initialize the FirebaseUI Widget using Firebase.
var ui = new firebaseui.auth.AuthUI(firebase.auth());

var uiConfig = {
    callbacks: {
        signInSuccessWithAuthResult: function(authResult, redirectUrl) {
            // User successfully signed in.
            // Return type determines whether we continue the redirect automatically
            // or whether we leave that to developer to handle.
            app.setAuthUser();
            app.refreshCurrentPlayer();
            // return true;
        },
        uiShown: function() {
            // The widget is rendered.
            // Hide the loader.
            document.getElementById('loader').style.display = 'none';
        }
    },
    // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
    signInFlow: 'popup',
    signInSuccessUrl: 'https://pong-ping1.firebaseapp.com/',
    signInOptions: [
        // Leave the lines as is for the providers you want to offer your users.
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        firebase.auth.FacebookAuthProvider.PROVIDER_ID,
    ],
};

// The start method will wait until the DOM is loaded.
ui.start('#firebaseui-auth-container', uiConfig);

const charge500URL = 'https://us-central1-pong-ping1.cloudfunctions.net/charge500';
const homeURL = 'https://pong-ping1.firebaseapp.com/';
