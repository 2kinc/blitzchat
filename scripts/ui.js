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
                    displayName: ''
                }),
                methods: {
                    openChat (contact) {
                        this.openedChats = [contact];
                        this.$refs.chatGrid.classList.addClass('shown');
                    },
                    signIn () {
                        
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