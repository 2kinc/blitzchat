import { auth } from "./database.js";

class UI {
    constructor(dbref, el) {
        this.dbref = dbref;
        this.el = el;
        this.activate = function () {
            var TYPE = {
                CHAT: 0,
                NEWCHAT: 1,
                INVITEACCEPTED: 1,
                INVITEWAITING: 0,
                INVITEDECLINED: -1
            };
            var loadedUsers = {};
            this.vue = new Vue({
                data: () => ({

                    dbref: this.dbref,
                    signedIn: true,
                    contacts: [],
                    openedChats: [],
                    displayName: ''

                }),
                methods: {
                    getContacts() {
                        var that = this;
                        this.dbref.ref('users/' + auth.currentUser.uid + '/blitzchat/conversations').on('child_added', function (snap) {
                            that.dbref.ref('blitzchat/conversations/' + snap.key).once('value').then(function (snap1) {
                                var chat = snap1.val();

                                if (chat) {

                                    chat.key = snap1.key;

                                    chat.people.forEach(function (person, index) {
                                        that.dbref.ref('users/' + person).once('value').then(function (snap2) {
                                            var val = snap2.val();
                                            chat.people[index] = {};
                                            chat.people[index].displayName = val.displayName;
                                            chat.people[index].photoURL = val.photoURL;

                                            if (!chat.group && person != auth.currentUser.uid) {
                                                //other person in contact
                                                chat.name = chat.people[index].displayName;
                                                chat.photoURL = chat.people[index].photoURL; //set photourl for contact
                                            }

                                            if (index == chat.people.length - 1) {
                                                that.contacts.push(chat);
                                            }

                                        });


                                    });
                                }


                            });
                        });
                    },
                    openChat(contact) {
                        var window = {
                            content: contact,
                            type: TYPE.CHAT
                        };
                        this.openedChats = [window];
                        this.updateMDC();
                    },
                    signIn() {
                        var provider = new firebase.auth.GoogleAuthProvider();
                        auth.signInWithRedirect(provider);
                    },
                    signInHandler() {
                        this.displayName = auth.currentUser.displayName;
                        this.signedIn = true;
                        var path = 'users/' + auth.currentUser.uid;
                        this.dbref.ref(path + '/email').set(auth.currentUser.email);
                        this.dbref.ref(path + '/displayName').set(auth.currentUser.displayName);
                        this.dbref.ref(path + '/photoURL').set(auth.currentUser.photoURL);

                        this.getContacts();
                    },
                    openNewConversation() {
                        this.openedChats = [];
                        this.openedChats.push({
                            type: TYPE.NEWCHAT,
                            content: {
                                name: 'New Conversation',
                                form: {
                                    group: false,
                                    name: '',
                                    people: [],
                                    contactSearch: '',
                                    phase: 0,
                                }
                            }
                        });
                        this.updateMDC();
                    },
                    nextPhase() {
                        if (this.newConversationForm.group && this.newConversationPhase == 1) {
                            if (this.newConversationForm.name == '') {
                                setTimeout(() => {
                                    if (document.querySelector('#new-conversation-form input')) {
                                        document.querySelector('#new-conversation-form input').focus();
                                    }
                                }, 0);
                                return;
                            }
                        }
                        this.newConversationPhase = (this.newConversationPhase + 1) % 3;
                        if (!this.newConversationForm.group && this.newConversationPhase == 1)
                            this.newConversationPhase = 2;
                        setTimeout(() => {
                            if (document.querySelector('#new-conversation-form input')) {
                                document.querySelector('#new-conversation-form input').focus();
                            }
                        }, 0);
                        this.updateMDC();
                    },

                    updateMDC() {
                        var buttons = document.querySelectorAll('.button, .mdc-button');
                        buttons.forEach(function (node) {
                            mdc.ripple.MDCRipple.attachTo(node);
                        });
                    }

                },
                computed: {
                    chatTitle() {
                        if (this.openedChats.length == 0)
                            return 'No chats are open.';
                        var list = [];
                        for (var chat of this.openedChats) {
                            if (chat.group && chat.name == '') {
                                list.push('Group');
                            }
                            list.push(chat.content.name);
                        }
                        return list.join();
                    }
                },
                el: this.el
            });
            this.contactItem = Vue.component('contact-item', {
                props: { 'contact': Object, 'openChat': Function },
                template: '#contactItemTemplate',
                methods: {
                    open() {
                        this.$parent.openChat(this.contact);
                    }
                },
                computed: {
                    computedName() {
                        if (this.contact.group && !this.contact.name) {
                            var people = [];
                            this.contact.people.forEach(function (person) {
                                people.push(person.displayName);
                            });
                            return people.join();
                        }
                        return this.contact.name;
                    }
                }
            });
            this.chatWindow = Vue.component('chat-window', {
                props: { 'chat': Object },
                template: '#chatWindowTemplate',
                data: () => ({
                    messageText: '',
                    minimumLength: 1,
                    maximumLength: 512
                }),
                computed: {
                    computedName() {
                        if (this.chat.group && !this.chat.name) {
                            var people = [];
                            this.chat.people.forEach(function (person) {
                                people.push(person.displayName);
                            });
                            return people.join();
                        }
                        return this.chat.name;
                    },
                    sendButtonEnabled() {
                        if (this.messageText.length >= this.minimumLength && this.messageText.length <= this.maximumLength) {
                            return true;
                        }
                        return false;
                    }
                },
                methods: {
                    close() {
                        var index = this.$parent.$parent.openedChats.indexOf(this.window);
                        this.$parent.$parent.openedChats.splice(index, 1);
                    },
                    sendMessage() {

                        var d = new Date();
                        var message = {
                            message: this.messageText,
                            user: auth.currentUser.uid,
                            time: d.getTime()
                        };

                        this.messageText = ''; // clear

                        this.$parent.$parent.dbref.ref('blitzchat/conversations/' + this.chat.key).child('messages').push(message);
                        this.getMessages();

                    },
                    getMessages() {

                        var that = this;
                        
                        this.$parent.$parent.dbref.ref('blitzchat/conversations/' + this.chat.key + '/messages').once('value').then(function (snap) {
                            that.chat.messages = snap.val();
                            var opened = that.$parent.$parent.openedChats.filter(chat => chat.content.key == that.chat.key);
                            if (opened) opened[0].content.messages;
                        });

                    }
                }
            });
            this.contactSearchResult = Vue.component('contact-search-result', {
                props: { 'profile': Object },
                template: '#contactSearchResultTemplate',
                data: () => ({
                    red: false,
                    dying: false
                }),
                methods: {
                    remove() {
                        var that = this;
                        setTimeout(() => this.dying = true, 0);
                        setTimeout(function () {
                            var people = that.$parent.form.people;
                            var index = people.indexOf(that.profile.uid);
                            people.splice(index, 1);
                        }, 300);
                    }
                },
                created() {
                    setTimeout(() => { this.$parent.$parent.$parent.updateMDC(); }, 0);

                }
            });
            this.newConversationForm = Vue.component('new-conversation-form', {
                template: '#newConversationFormTemplate',
                props: { 'form': Object, 'window': Object },
                methods: {
                    close() {
                        var index = this.$parent.$parent.openedChats.indexOf(this.window);
                        this.$parent.$parent.openedChats.splice(index, 1);
                    },
                    nextPhase() {
                        this.form.phase = Math.min(this.form.phase + 1, 1);
                        setTimeout(() => {
                            this.$refs.contactSearch.focus();
                        }, 0);
                        this.$parent.$parent.updateMDC();
                    },
                    previousPhase() {
                        this.form.phase = Math.max(this.form.phase - 1, 0);
                        this.$parent.$parent.updateMDC();
                    },
                    toggleGroup() {
                        this.form.group = !this.form.group;
                    },
                    addProfile() {
                        var that = this;
                        this.$parent.$parent.dbref.ref('users').orderByChild('email').equalTo(this.form.contactSearch).once('value').then(function (snap) {
                            var result = snap.val();
                            if (result) {
                                for (var d in result) {
                                    var complete = result[d];
                                    complete.uid = d;
                                    if (complete.uid == auth.currentUser.uid)
                                        return;
                                    if (that.form.group) {
                                        if (!that.form.people.includes(d) && !that.form.people.includes(auth.currentUser.uid))
                                            that.form.people.push(complete);
                                        that.form.contactSearch = '';
                                    } else {
                                        that.form.people = [complete];
                                        that.form.contactSearch = '';
                                    }
                                }

                            }
                        });

                        this.$parent.$parent.updateMDC();
                    },
                    submit() {
                        var that = this;
                        var broken = {};
                        if (!this.form.group) {
                            //check if contact exists
                            var parent = this.$parent.$parent;
                            parent.contacts.forEach(function (contact) {
                                if (!contact.group) {
                                    for (var person in contact.people) {
                                        if (person.email == this.form.people[0].email) {
                                            broken.d = true;
                                        }
                                    }
                                }
                            });
                        }
                        if (broken.d) return;
                        var uids = [];
                        this.form.people.forEach(function (person) {
                            uids.push(person.uid);
                        });
                        uids.push(auth.currentUser.uid);
                        var copied = {
                            name: this.form.name,
                            group: this.form.group,
                            people: uids,
                            messages: []
                        };
                        var ref = this.$parent.$parent.dbref.ref('blitzchat/conversations').push(copied);
                        this.$parent.$parent.dbref.ref('users/' + auth.currentUser.uid + '/blitzchat/conversations/' + ref.key).set({
                            accepted: TYPE.INVITEACCEPTED
                        });
                        for (var person in uids) {
                            this.$parent.$parent.dbref.ref('users/' + uids[person] + '/blitzchat/conversations/' + ref.key).set({
                                accepted: TYPE.INVITEWAITING
                            });
                        }
                        this.close();
                    }
                },
                data: () => ({

                }),

            });
            this.windowWrapper = Vue.component('window-wrapper', {
                template: '#windowWrapperTemplate',
                props: { 'window': Object },
                data: () => ({
                    TYPE: TYPE
                })

            });
            this.message = Vue.component('message', {
                template: '#messageTemplate',
                props: { 'message': Object },
                data: () => ({

                })
            });
            this.vue.updateMDC();
        }
    }
}

export { UI };