import { auth } from "./database.js";

class UI {
    constructor(dbref, el) {
        this.dbref = dbref;
        this.el = el;
        this.activate = function () {
            var TYPE = {
                CHAT: 0,
                NEWCHAT: 1
            };
            this.vue = new Vue({
                data: () => ({
                    dbref: this.dbref,
                    signedIn: true,
                    contacts: [],
                    openedChats: [],
                    displayName: '',

                }),
                methods: {
                    openChat(contact) {
                        this.openedChats = [contact];
                        this.updateMDC();
                    },
                    signIn() {

                    },
                    openNewConversation() {
                        this.openedChats = [{
                            type: TYPE.NEWCHAT,
                            name: 'New Conversation',
                            content: {
                                group: false,
                                name: '',
                                people: [],
                                contactSearch: '',
                                phase: 0
                            }
                        }];
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
                            list.push(chat.name);
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
            this.vue.updateMDC();
        }
    }
}

export { UI };