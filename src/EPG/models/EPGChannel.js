/**
 * Created by satadru on 3/30/17.
 */
export default class EPGChannel {

    constructor(icon, name, id) {
        this.id = id;
        this.name = name;
        this.icon = icon;
        this.events = new Array();
    }

    getChannelID() {
        return this.id;
    }

    getName() {
        return this.name;
    }

    getImageURL() {
        return this.icon;
    }

    getEvents() {
        return this.events;
    }
}