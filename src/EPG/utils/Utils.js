/**
 * Created by satadru on 3/30/17.
 */

export default class Utils {

    static DAYS_BACK_MILLIS = 3 * 24 * 60 * 60 * 1000;        // 3 days
    static DAYS_FORWARD_MILLIS = 3 * 24 * 60 * 60 * 1000;     // 3 days
    static HOURS_IN_VIEWPORT_MILLIS = 2 * 60 * 60 * 1000;     // 2 hours
    static TIME_LABEL_SPACING_MILLIS = 30 * 60 * 1000;        // 30 minutes

    constructor() {

        this.WIDTH_PIXELS = 1280;
        this.HEIGHT_PIXELS = 600;
        this.mChannelLayoutWidth = 300;
        this.mChannelLayoutMargin  = 10;
        this.mTimeBarHeight = 60;

        this.resetBoundaries()
    }

    resetBoundaries() {
        this.mMillisPerPixel = this.calculateMillisPerPixel();
        this.mTimeOffset = this.calculatedBaseLine();
        this.mTimeLowerBoundary = this.getTimeFrom(0);
        this.mTimeUpperBoundary = this.getTimeFrom(this.getWidth());
    }

    getShortTime(timeMillis) {
        var dateWithouthSecond = new Date(timeMillis);
        return dateWithouthSecond.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }


    calculatedBaseLine() {
        return Date.now() - Utils.DAYS_BACK_MILLIS;
    }

    calculateMillisPerPixel() {
        return Utils.HOURS_IN_VIEWPORT_MILLIS / (this.WIDTH_PIXELS - this.mChannelLayoutWidth - this.mChannelLayoutMargin);
    }

    getTimeFrom(x) {
        return (x * this.mMillisPerPixel) + this.mTimeOffset;
    }

    getChannelLayoutWidth() {
        return this.mChannelLayoutWidth;
    }

    getChannelLayoutMargin() {
        return this.mChannelLayoutMargin;
    }

    getTimeBarHeight() {
        return this.mTimeBarHeight;
    }

    getMillisPerPixel() {
        return this.mMillisPerPixel;
    }

    getTimeOffset() {
        return this.mTimeOffset;
    }

    getWidth() {
        return this.WIDTH_PIXELS;
    }

    getHeight() {
        return this.HEIGHT_PIXELS;
    }
}
