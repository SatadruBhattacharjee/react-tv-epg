/**
 * Created by satadru on 3/31/17.
 */
export default class EPGUtils {
    getShortTime(timeMillis) {
        var now = new Date(timeMillis);
        var hour = now.getHours();
        var minutes = now.getMinutes();
        //return dateWithouthSecond.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        var minutes = now.getMinutes();
        var ampm = "AM";
        if (minutes < 15) {
            minutes = "00";
        } else if (minutes < 45){
            minutes = "30";
        } else {
            minutes = "00";
            ++hour;
        }
        if (hour > 23) {
            hour = 12;
        } else if (hour > 12) {
            hour = hour - 12;
            ampm = "PM";
        } else if (hour == 12) {
            ampm = "PM";
        } else if (hour == 0) {
            hour = 12;
        }

        return(hour + ":" + minutes + " " + ampm);
        //return dateWithouthSecond.getHours() + ":" + dateWithouthSecond.getMinutes();
    }

    getWeekdayName(dateMillis) {
        let days = ['Sun','Mon','Tues','Wed','Thus','Fri','Sat'];
        let date = new Date(dateMillis);
        return days[ date.getDay() ];
    }

    scaleBetween(unscaledNum, max, min = 0, minAllowed = 0, maxAllowed = 1280) {
        return parseInt((maxAllowed - minAllowed) * (unscaledNum - min) / (max - min) + minAllowed);
    }
}