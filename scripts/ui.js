import { auth } from "./database.js";

class UI {
    constructor(dbref, el) {
        this.dbref = dbref;
        this.el = el;
        this.activate = function () {

            this.vue = new Vue({
                data: () => ({
                    dbref: this.dbref,
                    signedIn: true,
                    contacts: [],
                    openedChats: [],
                    displayName: '',
                    newConversationForm: {
                        group: false,
                        name: '',
                        people: []
                    },
                    contactSearch: '',
                    newConversationPerson: undefined,
                    newConversationOpen: false,
                    newConversationPhase: 0,
                }),
                methods: {
                    openChat(contact) {
                        this.openedChats = [contact];
                        this.updateMDC();
                    },
                    signIn() {

                    },
                    openNewConversation() {
                        this.newConversationOpen = true;
                        this.updateMDC();
                    },
                    closeNewConversation() {
                        this.newConversationOpen = false;
                        this.newConversationForm = {
                            group: false,
                            name: '',
                            people: []
                        };
                        this.updateMDC();
                    },
                    toggleGroup() {
                        this.newConversationForm.group = !this.newConversationForm.group;
                    },
                    nextPhase() {
                        if (this.newConversationForm.group && this.newConversationPhase == 1) {
                            if (this.newConversationForm.name == '') {
                                setTimeout(() => {if (document.querySelector('#new-conversation-form input')) {
                                    document.querySelector('#new-conversation-form input').focus();
                                }}, 0);
                                return;
                            }
                        }
                        this.newConversationPhase = (this.newConversationPhase + 1) % 3;
                        if (!this.newConversationForm.group && this.newConversationPhase == 1)
                            this.newConversationPhase = 2;
                        setTimeout(() => {if (document.querySelector('#new-conversation-form input')) {
                            document.querySelector('#new-conversation-form input').focus();
                        }}, 0);
                        this.updateMDC();
                    },
                    addProfile() {
                        var that = this;
                        this.dbref.ref('users').orderByChild('email').equalTo(this.contactSearch).once('value').then(function (snap) {
                            var result = snap.val();
                            if (result) {
                                for (var d in result) {
                                    var complete = result[d];
                                    complete.uid = d;
                                    if (complete.uid == auth.currentUser.uid)
                                        return;
                                    if (that.newConversationForm.group) {
                                        if (!that.newConversationForm.people.includes(d) && !that.newConversationForm.people.includes(auth.currentUser.uid))
                                            that.newConversationForm.people.push(complete);
                                        that.contactSearch = '';
                                    } else {
                                        that.newConversationForm.people = [complete];
                                        that.contactSearch = '';
                                    }
                                }

                            }
                        });

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
                        if (this.openedChats.length == 0 && !this.newConversationOpen)
                            return 'No chats are open.';
                        if (this.newConversationOpen && this.openedChats.length == 0)
                            return 'New Conversation';
                        var list = [];
                        for (var chat in this.openedChats) {
                            list.push(chat.name);
                        }
                        if (this.newConversationOpen)
                            list.push('New Conversation');
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
                }
            });
            this.chatWindow = Vue.component('chat-window', {
                props: { 'chat': Object },
                template: '#chatWindowTemplate'
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
                            var people = that.$parent.newConversationForm.people;
                            var index = people.indexOf(that.profile.uid);
                            people.splice(index, 1);
                        }, 300);
                    }
                },
                created() {
                    setTimeout(() => {this.$parent.updateMDC();}, 0);
                    
                }
            });
            this.vue.updateMDC();
        }
    }
}

export { UI };