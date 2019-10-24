class UI {
    constructor (dbref, el) {
        this.dbref = dbref;
        this.el = el;
        this.activate = function () {
            this.vue = new Vue({
                data: () => ({
                    signedIn: true,
                    contacts: [],
                    signIn: function () {
                        
                    },
                    chatTitle: 'No chats are open.',
                    openedChats: [],
                    openChat: function (contact) {
                        this.openedChats = [contact];
                        console.log(contact);
                    }
                }),
                el: this.el
            });
            this.contactItem = Vue.component('contact-item', {
                props: {'contact': Object},
                template: '#contactItemTemplate',
                created: function () {
                    console.log(this.contact);
                }
            })
        }
    }
}

export { UI };