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
            ui.vue.signedIn = true;
            var contactsRef = db.ref('users/' + auth.currentUser.uid + '/blitzchat/contacts');
            ui.vue.displayName = auth.currentUser.displayName;
            contactsRef.on('child_added', function (snap) {
                var result = snap.val();
                /*if (result.people.length == 1) {
                    db.ref('users/' + result.people[0] + '/photoURL').on('value', function (snap) {
                        result.picture = snap.val();
                        db.ref('users/' + result.people[0] + '/displayName').on('value', function (snap) {
                            result.name = snap.val();
                            ui.vue.contacts.push(result);
                        });
                    });
                } else {
                    ui.vue.contacts.push(result);
                }*/
            });
            contactsRef.on('child_changed', function (snap) {
                /*Vue.set(ui.vue.contacts, Number(snap.key), snap.val());*/
            });
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
    });



    var ui = new UI(db.ref('blitzchat'), '#app');
    ui.activate();
    ui.vue.signIn = function () {
        var provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithRedirect(provider);
    }

    window.ui = ui;
    window.auth = auth;

}