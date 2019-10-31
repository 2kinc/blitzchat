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
                    usernameSearch: '',
                    usernameSearchResults: {},
                    newConversationPerson: undefined,
                    newConversationOpen: false,
                    newConversationPhase: 0,
                    usernameSearchOpen: false
                }),
                methods: {
                    openChat(contact) {
                        this.openedChats = [contact];
                    },
                    signIn() {

                    },
                    openNewConversation() {
                        this.newConversationOpen = true;
                    },
                    toggleGroup() {
                        this.newConversationForm.group = !this.newConversationForm.group;
                    },
                    nextPhase() {
                        this.newConversationPhase = (this.newConversationPhase + 1) % 3;
                        if (!this.newConversationForm.group && this.newConversationPhase == 1)
                            this.newConversationPhase = 2;
                    },
                    searchForProfiles() {
                        var that = this;
                        if (!this.usernameSearchOpen) {
                            this.dbref.ref('users').orderByChild('displayName').equalTo(this.usernameSearch).once('value').then(function (snap) {
                                var result = snap.val();
                                if (result) {
                                    that.usernameSearchResults = result;
                                    that.usernameSearchOpen = true;
                                }
                            });
                        } else {
                            that.usernameSearchResults = {};
                            that.usernameSearchOpen = false;
                        }

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
                            list.push('New Convcersation');
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
            this.usernameSearchResult = Vue.component('username-search-result', {
                props: { 'profile': Object },
                template: '#usernameSearchResultTemplate'
            })
        }
    }
}

export { UI };