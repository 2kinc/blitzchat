import { auth } from "./database.js";

class UI {
    constructor(dbref, el) {
        this.dbref = dbref;
        this.el = el;
        this.activate = function () {
            var that = this;
            var TYPE = {
                CHAT: 0,
                NEWCHAT: 1,
                INVITEACCEPTED: 1,
                INVITEWAITING: 0,
                INVITEDECLINED: -1
            };
            var STATE = {
                GROUND: 0,
                FLOATING: 1
            };
            var loadedUsers = {};
            var keyListener = new window.keypress.Listener();
            this.vue = new Vue({
                data: () => ({

                    dbref: this.dbref,
                    signedIn: true,
                    contacts: [],
                    openedChats: [],
                    displayName: '',
                    focusedChat: undefined,
                    display: {
                        width: window.innerWidth,
                        height: window.innerHeight
                    }

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
                                            chat.people[index].displayName = val.displayName || val.email;
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
                        this.openedChats = [];
                        var window = {
                            content: contact,
                            type: TYPE.CHAT,
                            state: STATE.GROUND
                        };
                        var that = this;
                        setTimeout(function () {
                            that.openedChats.push(window);
                            that.updateMDC();
                        }, 0);
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
                        var that = this;
                        setTimeout(function () {
                            that.openedChats.push({
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
                            that.updateMDC();
                        }, 0);

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
                                list.push(chat.content.name || 'Group');
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
                        this.$root.openChat(this.contact);
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
                    },
                    lastMessage() {
                        var toSort = [];
                        for (var message in this.contact.messages) {
                            toSort.push([message, this.contact.messages[message]]);
                        }
                        toSort.sort((a, b) => a.time - b.time);
                        return toSort[toSort.length - 1][1].message;
                    }
                }
            });
            this.chatWindow = Vue.component('chat-window', {
                props: { 'chat': Object, 'window': Object },
                template: '#chatWindowTemplate',
                data: () => ({
                    messageText: '',
                    minimumLength: 1,
                    maximumLength: 512,
                    STATE: STATE
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
                created() {
                    var that = this;
                    setTimeout(function () {
                        var chatEl = that.$refs.messages;
                        chatEl.scrollTop = chatEl.scrollHeight;
                    }, 0);
                },
                methods: {
                    close() {
                        var index = that.vue.openedChats.indexOf(this.window);
                        that.vue.openedChats.splice(index, 1);
                    },
                    focusHandler() {
                        that.vue.focusedChat = this;
                    },
                    fullscreenHandler() {
                        this.$root.openChat(this.chat);
                    },
                    sendMessage() {
                        if (!this.sendButtonEnabled) {
                            //sdfadfjlsa;kfj
                            return;
                        }

                        var d = new Date();
                        var message = {
                            message: this.messageText,
                            user: auth.currentUser.uid,
                            time: d.getTime()
                        };

                        this.messageText = ''; // clear

                        that.vue.dbref.ref('blitzchat/conversations/' + this.chat.key).child('messages').push(message);
                        this.getMessages();

                    },
                    getMessages() {

                        var that = this;

                        this.$root.dbref.ref('blitzchat/conversations/' + this.chat.key + '/messages').on('child_added', function (snap) {
                            that.chat.messages[snap.key] = snap.val();
                            var chatEl = that.$refs.messages;
                            chatEl.scrollTop = chatEl.scrollHeight;
                        });

                        this.$root.dbref.ref('blitzchat/conversations/' + this.chat.key + '/messages').limitToLast(1).on('child_added', function (snap) {
                            var chatEl = that.$refs.messages;
                            setTimeout(function () {
                                chatEl.scrollTop = chatEl.scrollHeight;
                            }, 0);
                        });

                        this.focusInput();
                    },
                    focusInput() {
                        this.$refs.sendMessageInput.focus();
                    }
                },
                mounted() {
                    this.$el.focus();
                    setTimeout(this.focusInput, 0);
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
                mounted() {
                    setTimeout(() => { this.$root.updateMDC(); }, 0);
                }
            });
            this.newConversationForm = Vue.component('new-conversation-form', {
                template: '#newConversationFormTemplate',
                props: { 'form': Object, 'window': Object },
                methods: {
                    close() {
                        var index = this.$root.openedChats.indexOf(this.window);
                        this.$root.openedChats.splice(index, 1);
                    },
                    focusHandler() {
                        that.vue.focusedChat = this;
                    },
                    nextPhase() {
                        this.form.phase = Math.min(this.form.phase + 1, 1);
                        setTimeout(() => {
                            this.$refs.contactSearch.focus();
                        }, 0);
                        if (this.form.people.length > 1 && !this.form.group)
                            this.form.people.length = 1;
                        this.$root.updateMDC();
                    },
                    previousPhase() {
                        this.form.phase = Math.max(this.form.phase - 1, 0);
                        this.$root.updateMDC();
                    },
                    toggleGroup() {
                        this.form.group = !this.form.group;
                    },
                    addProfile() {
                        var that = this;
                        this.$root.dbref.ref('users').orderByChild('email').equalTo(this.form.contactSearch).once('value').then(function (snap) {
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

                        this.$root.updateMDC();
                    },
                    submit() {
                        var that = this;
                        var broken = {};
                        if (!this.form.group) {
                            //check if contact exists
                            var parent = this.$root;
                            parent.contacts.forEach(function (contact) {
                                if (!contact.group) {
                                    contact.people.forEach(function (person) {
                                        if (person.email == that.form.people[0].email) {
                                            broken.d = true;
                                        }
                                    });
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
                        var ref = this.$root.dbref.ref('blitzchat/conversations').push(copied);
                        this.$root.dbref.ref('users/' + auth.currentUser.uid + '/blitzchat/conversations/' + ref.key).set({
                            accepted: TYPE.INVITEACCEPTED
                        });
                        for (var person in uids) {
                            this.$root.dbref.ref('users/' + uids[person] + '/blitzchat/conversations/' + ref.key).set({
                                accepted: TYPE.INVITEWAITING
                            });
                        }
                        this.close();
                    }
                },
                data: () => ({

                }),
                mounted() {
                    this.$el.focus();
                }
            });
            this.windowWrapper = Vue.component('window-wrapper', {
                template: '#windowWrapperTemplate',
                props: { 'window': Object },
                data: () => ({
                    TYPE: TYPE
                }),
                methods: {

                }
            });
            this.message = Vue.component('message', {
                template: '#messageTemplate',
                props: { 'message': Object },
                data: () => ({
                    
                }),
                methods: {
                    urlify(text) {
                        return text.replace(/(https?:\/\/[^\s]+)/g, function (url) {
                            return '<a href="' + url + '" target="_blank">' + url + '</a>';
                        })
                    },
                },
                mounted() {
                    if (this.message.user.uid) return;
                    if (loadedUsers[this.message.user]) {
                        var uid = this.message.user;
                        this.message.user = loadedUsers[this.message.user];
                        this.message.user.uid = uid;
                    } else {
                        var that = this;
                        this.$root.dbref.ref('users/' + this.message.user).once('value').then(function (snap) {
                            loadedUsers[that.message.user] = snap.val();
                            var uid = that.message.user;
                            that.message.user = loadedUsers[that.message.user];
                            that.message.user.uid = uid;
                        });
                    }
                },
                computed: {
                    sentBySelf() {
                        var uid = this.message.user.uid || this.message.user;
                        return uid == auth.currentUser.uid;
                    },
                    computedTime() {
                        var date = new Date(this.message.time);
                        return date.toLocaleString();
                    }
                }
            });
            keyListener.simple_combo('ctrl alt n', function () {
                that.vue.openNewConversation();
            });
            keyListener.simple_combo('ctrl alt w', function () {
                that.vue.focusedChat.close();
            });
            keyListener.simple_combo('ctrl ,', function () {
                /*
                if (!that.vue.focusedChat) {
                    if (that.vue.openedChats.length > 0) {
                        that.vue.focusedChat = that.vue.openedChats[0];
                        that.vue.focusedChat.$el.focus();
                    }
                } else {
                    var index = that.vue.openedChats.indexOf(that.vue.focusedChat);
                    var newIndex = index - 1;
                    if (newIndex < 0) newIndex = that.vue.openedChats.length - 1;
                    that.vue.focusedChat = that.vue.openedChats[newIndex];
                    that.vue.focusedChat.$el.focus();
                }
                */
                //work on this later, need to find way to get vue attached to chat
                console.log('tab to the left');
            });
            keyListener.simple_combo('ctrl .', function () {
                console.log('tab to the right');
            });
            function goToInput() {
                if (document.activeElement.tagName == 'INPUT')
                    return true;
                if (that.vue.focusedChat) {
                    if (that.vue.focusedChat.focusInput) {
                        that.vue.focusedChat.focusInput();
                    }
                }
            }
            keyListener.simple_combo('space', goToInput);
            keyListener.simple_combo('enter', goToInput);
            function resizeHandler() {
                that.vue.innerWidth = window.innerWidth;
                that.vue.innerHeight = window.innerHeight;
            }
            window.addEventListener('resize', resizeHandler);
            this.vue.updateMDC();
        }
    }
}

export { UI };