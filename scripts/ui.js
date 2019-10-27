class UI {
    constructor (dbref, el) {
        this.dbref = dbref;
        this.el = el;
        this.activate = function () {
            this.vue = new Vue({
                data: () => ({
                    signedIn: true,
                    contacts: [],
                    chatTitle: 'No chats are open.',
                    openedChats: [],
                    displayName: '',
                    newConversationForm: {
                        group: false,
                        name: '',
                        people: []
                    },
                    newConversationPerson: undefined,
                    newConversationOpen: false,
                    newConversationPhase: 0
                }),
                methods: {
                    openChat (contact) {
                        this.openedChats = [contact];
                    },
                    signIn () {
                        
                    },
                    openNewConversation () {
                        this.newConversationOpen = true;
                    },
                    toggleGroup () {
                        this.newConversationForm.group = !this.newConversationForm.group;
                    }
                },
                el: this.el
            });
            this.contactItem = Vue.component('contact-item', {
                props: {'contact': Object, 'openChat': Function},
                template: '#contactItemTemplate',
                methods: {
                    open () {
                        this.$parent.openChat(this.contact);
                    }
                }
            });
            this.chatWindow = Vue.component('chat-window', {
                props: {'chat': Object},
                template: '#chatWindowTemplate'
            });
        }
    }
}

export { UI };