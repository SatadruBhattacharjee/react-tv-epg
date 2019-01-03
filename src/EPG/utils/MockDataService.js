/**
 * Created by satadru on 4/1/17.
 */
import EPGChannel from '../models/EPGChannel';
import EPGEvent from '../models/EPGEvent';
import EPG from '../components/TVGuideSTB';

export default class MockDataService {
    //static Random rand = new Random();
    static availableEventLength = [
        1000*60*15,  // 15 minutes
        1000*60*30,  // 30 minutes
        1000*60*45,  // 45 minutes
        1000*60*60,  // 60 minutes
        1000*60*120  // 120 minutes
    ];

    static availableEventTitles = [
        "Avengers",
        "How I Met Your Mother",
        "Silicon Valley",
        "Late Night with Jimmy Fallon",
        "The Big Bang Theory",
        "Leon",
        "Die Hard"
    ];

    static availableChannelLogos = [
        "http://s3-eu-west-1.amazonaws.com/rockettv.media.images/popcorn/images/channels/v3/logos/default/CNN_88.png",
        "http://s3-eu-west-1.amazonaws.com/rockettv.media.images/popcorn/images/channels/v3/logos/default/MB1_88.png",
        "http://s3-eu-west-1.amazonaws.com/rockettv.media.images/popcorn/images/channels/v3/logos/default/NGO_88.png",
        "http://s3-eu-west-1.amazonaws.com/rockettv.media.images/popcorn/images/channels/v3/logos/default/FXH_60.png",
        "http://s3-eu-west-1.amazonaws.com/rockettv.media.images/popcorn/images/channels/v3/logos/default/TRM_88.png"
    ];

    static getMockData() {
        let channels = new Array();

        let nowMillis = Date.now();

        for (let i=0 ; i < 20 ; i++) {
            let epgChannel = new EPGChannel(MockDataService.availableChannelLogos[i % 5],
                "Channel " + (i+1), i.toString());

            epgChannel.events = MockDataService.createEvents(epgChannel, nowMillis);
            channels.push(epgChannel);

            //result.set(epgChannel, MockDataService.createEvents(epgChannel, nowMillis));
        }

        return channels;
    }

    static createEvents(epgChannel, nowMillis) {
        let events = new Array();

        let epgStart = nowMillis - EPG.DAYS_BACK_MILLIS;
        let epgEnd = nowMillis + EPG.DAYS_FORWARD_MILLIS;

        let currentTime = epgStart;

        while (currentTime <= epgEnd) {
            let eventEnd = MockDataService.getEventEnd(currentTime);
            let epgEvent = new EPGEvent(currentTime, eventEnd, MockDataService.availableEventTitles[Math.floor((Math.random() * 6) + 0)]);
            events.push(epgEvent);
            currentTime = eventEnd;

        }

        return events;
    }

    static  getEventEnd( eventStartMillis) {
        let length = MockDataService.availableEventLength[Math.floor((Math.random() * 4) + 0)];
        return eventStartMillis + length;
    }

    /*private static int randomBetween(int start, int end) {
        return start + rand.nextInt((end - start) + 1);
    }*/
}
