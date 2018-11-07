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