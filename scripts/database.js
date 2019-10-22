// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyADD6YWKrzibRMwJNi1FwUR0jcR0GitZPI",
    authDomain: "k-inc-232222.firebaseapp.com",
    databaseURL: "https://k-inc-232222.firebaseio.com",
    projectId: "k-inc-232222",
    storageBucket: "k-inc-232222.appspot.com",
    messagingSenderId: "827804821456",
    appId: "1:827804821456:web:15820007d0a2532ab13bd5"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

var app = firebase;
var db = app.database();
var auth = app.auth();

auth.signInWithRedirect(new firebase.auth.GoogleAuthProvider());

export {app, db, auth}