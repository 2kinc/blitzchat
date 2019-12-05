import { app, db, auth } from '../scripts/database.js';
import { UI } from '../scripts/ui.js';

window.onload = function () {
    auth.getRedirectResult().then(function (result) {
        if (result.credential) {
            // This gives you a Google Access Token. You can use it to access the Google API.
            var token = result.credential.accessToken;
            // ...
        }
        // The signed-in user info.
        var user = result.user;
        if (user || auth.currentUser) {
            ui.vue.signInHandler();
        } else {
            ui.vue.signedIn = false;
        }
    document.querySelector('#loading').style.display = 'none';


    }).catch(function (error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // The email of the user's account used.
        var email = error.email;
        // The firebase.auth.AuthCredential type that was used.
        var credential = error.credential;
        // ...
        document.querySelector('#loading').innerText = 'Error! ' + errorCode + ': ' + errorMessage;
    });



    var ui = new UI(db, '#app');
    ui.activate();

    window.ui = ui;
    window.auth = auth;

}