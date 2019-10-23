var UI = (function () {
    UI.prototype.activate = function () {
        this.vue = new Vue({
            data: () => {

            },
            el: this.el
        });
    }
    return function (dbref, el) {
        this.dbref = dbref;
        this.el = el;
    };
});

export { UI };