/**
 * Created by satadru on 3/31/17.
 */
import React, {Component} from 'react';

import Rect from '../models/Rect';
import ReactDOM from "react-dom";
import EPGData from '../utils/EPGData'
import EPGUtils from '../utils/EPGUtils'
import Styles from '../styles/app.css'

export default class TVGuide extends Component {

    static DAYS_BACK_MILLIS = 1 * 24 * 60 * 60 * 1000;        // 3 days
    static DAYS_FORWARD_MILLIS = 1 * 24 * 60 * 60 * 1000;     // 3 days
    static HOURS_IN_VIEWPORT_MILLIS = 2 * 60 * 60 * 1000;     // 2 hours
    static TIME_LABEL_SPACING_MILLIS = 30 * 60 * 1000;        // 30 minutes

    static VISIBLE_CHANNEL_COUNT = 6; // No of channel to show at a time
    static VERTICAL_SCROLL_BOTTOM_PADDING_ITEM = 2;
    static VERTICAL_SCROLL_TOP_PADDING_ITEM = 2;

    constructor(props) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.epgData = new EPGData();
        this.epgUtils = new EPGUtils();

        this.scrollX = 0;
        this.scrollY = 0;
        this.focusedChannelPosition = 0;
        this.focusedEventPosition = -1;
        //this.state = {translate3d : `translate3d(${this.scrollX}px, 0px, 0px)`};
        //this.translate3d = `translate3d(${this.scrollX}px, 0px, 0px)`;

        this.mChannelImageCache = new Map();

        this.mClipRect = new Rect();
        this.mDrawingRect = new Rect();
        this.mMeasuringRect = new Rect();

        this.mEPGBackground = '#1e1e1e';
        this.mVisibleChannelCount = 6;
        this.mChannelLayoutMargin = 3;
        this.mChannelLayoutPadding = 8;
        this.mChannelLayoutHeight = 70;
        this.mChannelLayoutWidth = 70;
        this.mChannelLayoutBackground = '#323232';

        //this.mEventLayoutBackground = '#4f4f4f';
        this.mEventLayoutBackground = '#234054';
        //this.mEventLayoutBackgroundCurrent = '#4f4f4f';
        this.mEventLayoutBackgroundCurrent = '#234054';
        this.mEventLayoutBackgroundFocus = 'rgba(65,182,230,1)';
        this.mEventLayoutTextColor = '#d6d6d6';
        this.mEventLayoutTextSize = 20;

        this.mTimeBarHeight = 30;
        this.mTimeBarTextSize = 14;
        this.mTimeBarLineWidth = 2;
        this.mTimeBarLineColor = '#c57120';

        this.mResetButtonSize = 40;
        this.mResetButtonMargin = 10;

        //this.resetBoundaries();

    }

    resetBoundaries() {
        this.mMillisPerPixel = this.calculateMillisPerPixel();
        this.mTimeOffset = this.calculatedBaseLine();
        this.mTimeLowerBoundary = this.getTimeFrom(0);
        this.mTimeUpperBoundary = this.getTimeFrom(this.getWidth());
    }


    calculateMaxHorizontalScroll() {
        this.mMaxHorizontalScroll = parseInt(((TVGuide.DAYS_BACK_MILLIS + TVGuide.DAYS_FORWARD_MILLIS - TVGuide.HOURS_IN_VIEWPORT_MILLIS) / this.mMillisPerPixel));
    }

    calculateMaxVerticalScroll() {
        let maxVerticalScroll = this.getTopFrom(this.epgData.getChannelCount() - 2) + this.mChannelLayoutHeight;
        this.mMaxVerticalScroll = maxVerticalScroll < this.getHeight() ? 0 : maxVerticalScroll - this.getHeight();
    }

    calculateMillisPerPixel() {
        return TVGuide.HOURS_IN_VIEWPORT_MILLIS / (this.getWidth() - this.mChannelLayoutWidth - this.mChannelLayoutMargin);
    }

    calculatedBaseLine() {
        //return LocalDateTime.now().toDateTime().minusMillis(DAYS_BACK_MILLIS).getMillis();
        return Date.now() - TVGuide.DAYS_BACK_MILLIS;
    }

    getProgramPosition(channelPosition, time) {
        let events = this.epgData.getEvents(channelPosition);
        if (events != null) {
            for (let eventPos = 0; eventPos < events.length; eventPos++) {
                let event = events[eventPos];
                if (event.getStart() <= time && event.getEnd() >= time) {
                    return eventPos;
                }
            }
        }
        return -1;
    }

    getFirstVisibleChannelPosition() {
        let y = this.getScrollY(false);

        let position = parseInt((y - this.mChannelLayoutMargin - this.mTimeBarHeight)
            / (this.mChannelLayoutHeight + this.mChannelLayoutMargin));

        if (position < 0) {
            position = 0;
        }
        return position;
    }

    getLastVisibleChannelPosition() {
        let y = this.getScrollY(false);
        let totalChannelCount = this.epgData.getChannelCount();
        let screenHeight = this.getHeight();
        let position = parseInt((y + screenHeight + this.mTimeBarHeight - this.mChannelLayoutMargin)
            / (this.mChannelLayoutHeight + this.mChannelLayoutMargin));

        if (position > totalChannelCount - 1) {
            position = totalChannelCount - 1;
        }

        // Add one extra row if we don't fill screen with current..
        return (y + screenHeight) > (position * this.mChannelLayoutHeight) && position < totalChannelCount - 1 ? position + 1 : position;
    }

    getXFrom(time) {
        return parseInt(((time - this.mTimeLowerBoundary) / this.mMillisPerPixel) + this.mChannelLayoutMargin + this.mChannelLayoutWidth + this.mChannelLayoutMargin);
    }

    getTopFrom(position) {
        let y = position * (this.mChannelLayoutHeight + this.mChannelLayoutMargin)
            + this.mChannelLayoutMargin + this.mTimeBarHeight;
        return y - this.getScrollY(false);
    }

    getXPositionStart() {
        return this.getXFrom(Date.now() - (TVGuide.HOURS_IN_VIEWPORT_MILLIS / 2));
    }


    getTimeFrom(x) {
        return (x * this.mMillisPerPixel) + this.mTimeOffset;
    }

    shouldDrawTimeLine(now) {
        return now >= this.mTimeLowerBoundary && now < this.mTimeUpperBoundary;
    }

    isEventVisible(start, end) {
        return (start >= this.mTimeLowerBoundary && start <= this.mTimeUpperBoundary)
            || (end >= this.mTimeLowerBoundary && end <= this.mTimeUpperBoundary)
            || (start <= this.mTimeLowerBoundary && end >= this.mTimeUpperBoundary);
    }

    getFocusedChannelPosition () {
        return this.focusedChannelPosition;
    }

    getFocusedEventPosition () {
        return this.focusedEventPosition;
    }

    isRTL() {
        return false;
    }

    getScrollX(neglect = true) {
        if (neglect) {
            return 0;
        }
        return this.scrollX;
        //return window.scrollX;
    }

    getScrollY(neglect = true) {
        if (neglect) {
            return 0;
        }
        return this.scrollY;
        //return window.scrollY;
    }

    getWidth() {
        return 1280;
    }

    getHeight() {
        return this.mTimeBarHeight + (this.mChannelLayoutMargin + this.mChannelLayoutHeight) * TVGuide.VISIBLE_CHANNEL_COUNT;
    }

    onDraw(canvas) {

        if (this.epgData != null && this.epgData.hasData()) {
            this.mTimeLowerBoundary = this.getTimeFrom(this.getScrollX(false));
            this.mTimeUpperBoundary = this.getTimeFrom(this.getScrollX(false) + this.getWidth());

            let drawingRect = this.mDrawingRect;
            //console.log("X:" + this.getScrollX());
            drawingRect.left = this.getScrollX();
            drawingRect.top = this.getScrollY();
            drawingRect.right = drawingRect.left + this.getWidth();
            drawingRect.bottom = drawingRect.top + this.getHeight();

            this.drawChannelListItems(canvas, drawingRect);
            this.drawEvents(canvas, drawingRect);
            this.drawTimebar(canvas, drawingRect);
            this.drawTimeLine(canvas, drawingRect);
            //drawResetButton(canvas, drawingRect);
            this.drawFocusEvent(canvas, drawingRect);
        }
    }

    drawTimebar(canvas, drawingRect) {

        drawingRect.left = this.getScrollX() + this.mChannelLayoutWidth + this.mChannelLayoutMargin;
        drawingRect.top = this.getScrollY();
        drawingRect.right = drawingRect.left + this.getWidth();
        drawingRect.bottom = drawingRect.top + this.mTimeBarHeight;

        this.mClipRect.left = this.getScrollX() + this.mChannelLayoutWidth + this.mChannelLayoutMargin;
        this.mClipRect.top = this.getScrollY();
        this.mClipRect.right = this.getScrollX() + this.getWidth();
        this.mClipRect.bottom = this.mClipRect.top + this.mTimeBarHeight;

        //canvas.save();
        //canvas.rect(this.mClipRect.left, this.mClipRect.top, this.mClipRect.width, this.mClipRect.height);
        //canvas.clip();


        // Background
        canvas.fillStyle = this.mChannelLayoutBackground
        canvas.fillRect(drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);

        // Time stamps
        //mPaint.setColor(mEventLayoutTextColor);
        //mPaint.setTextSize(mTimeBarTextSize);
        canvas.fillStyle = this.mEventLayoutTextColor;
        if (this.isRTL()) {
            //canvas.setTransform(1, 0, 0, 1, 0, 0);
            //canvas.save();
            canvas.setTransform(1, 0, 0, 1, 0, 0);
        }

        for (let i = 0; i < TVGuide.HOURS_IN_VIEWPORT_MILLIS / TVGuide.TIME_LABEL_SPACING_MILLIS; i++) {
            // Get time and round to nearest half hour
            let time = TVGuide.TIME_LABEL_SPACING_MILLIS *
                (((this.mTimeLowerBoundary + (TVGuide.TIME_LABEL_SPACING_MILLIS * i)) +
                (TVGuide.TIME_LABEL_SPACING_MILLIS / 2)) / TVGuide.TIME_LABEL_SPACING_MILLIS);

            if (this.isRTL()) {
                canvas.fillText(this.epgUtils.getShortTime(time),
                    (this.getWidth() + this.mChannelLayoutMargin + this.mChannelLayoutMargin - this.mChannelLayoutHeight) - this.getXFrom(time),
                    drawingRect.top + (((drawingRect.bottom - drawingRect.top) / 2) + (this.mTimeBarTextSize / 2)));
            } else {
                canvas.fillText(this.epgUtils.getShortTime(time),
                    this.getXFrom(time),
                    drawingRect.top + (((drawingRect.bottom - drawingRect.top) / 2) + (this.mTimeBarTextSize / 2)));
            }


        }
        if (this.isRTL()) {
            this.ctx.setTransform(-1, -0, 0, 1, this.getWidth(), 0);
            //canvas.restore();
        }

        //canvas.restore();

        this.drawTimebarDayIndicator(canvas, drawingRect);
        this.drawTimebarBottomStroke(canvas, drawingRect);
    }

    drawTimebarDayIndicator(canvas, drawingRect) {
        drawingRect.left = this.getScrollX();
        drawingRect.top = this.getScrollY();
        drawingRect.right = drawingRect.left + this.mChannelLayoutWidth;
        drawingRect.bottom = drawingRect.top + this.mTimeBarHeight;

        // Background
        //mPaint.setColor(mChannelLayoutBackground);
        canvas.fillStyle = this.mChannelLayoutBackground;
        //canvas.drawRect(drawingRect, mPaint);
        canvas.fillRect(drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);

        // Text
        //mPaint.setColor(mEventLayoutTextColor);
        canvas.fillStyle = this.mEventLayoutTextColor;
        //mPaint.setTextSize(mTimeBarTextSize);
        //mPaint.setTextAlign(Paint.Align.CENTER);
        canvas.textAlign = "center";
        //canvas.drawText(EPGUtil.getWeekdayName(mTimeLowerBoundary),
        //drawingRect.left + ((drawingRect.right - drawingRect.left) / 2),
        //drawingRect.top + (((drawingRect.bottom - drawingRect.top) / 2) + (mTimeBarTextSize / 2)), mPaint);
        if (this.isRTL()) {
            //canvas.save();
            canvas.setTransform(1, 0, 0, 1, 0, 0);
            //canvas.scale(-1, 1);

            canvas.fillText(this.epgUtils.getWeekdayName(this.mTimeLowerBoundary),
                (this.getWidth() + this.mChannelLayoutMargin + this.mChannelLayoutMargin - this.mChannelLayoutHeight) - drawingRect.left + ((drawingRect.right - drawingRect.left) / 2),
                drawingRect.top + (((drawingRect.bottom - drawingRect.top) / 2) + (this.mTimeBarTextSize / 2))
            );
        } else {
            canvas.fillText(this.epgUtils.getWeekdayName(this.mTimeLowerBoundary),
                drawingRect.left + ((drawingRect.right - drawingRect.left) / 2),
                drawingRect.top + (((drawingRect.bottom - drawingRect.top) / 2) + (this.mTimeBarTextSize / 2))
            );
        }

        if (this.isRTL()) {
            this.ctx.setTransform(-1, -0, 0, 1, this.getWidth(), 0);
        }

        //mPaint.setTextAlign(Paint.Align.LEFT);
        canvas.textAlign = "left";
    }

    drawTimebarBottomStroke(canvas, drawingRect) {
        drawingRect.left = this.getScrollX();
        drawingRect.top = this.getScrollY() + this.mTimeBarHeight;
        drawingRect.right = drawingRect.left + this.getWidth();
        drawingRect.bottom = drawingRect.top + this.mChannelLayoutMargin;

        // Bottom stroke
        //mPaint.setColor(mEPGBackground);
        canvas.fillStyle = this.mEPGBackground;
        canvas.fillRect(drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);
    }

    drawTimeLine(canvas, drawingRect) {
        let now = Date.now();
        if (this.shouldDrawTimeLine(now)) {
            drawingRect.left = this.getXFrom(now);
            drawingRect.top = this.getScrollY();
            drawingRect.right = drawingRect.left + this.mTimeBarLineWidth;
            drawingRect.bottom = drawingRect.top + this.getHeight();

            //mPaint.setColor(mTimeBarLineColor);
            canvas.fillStyle = this.mTimeBarLineColor;
            //canvas.drawRect(drawingRect, mPaint);
            canvas.fillRect(drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);
        }

    }

    drawEvents(canvas, drawingRect) {
        let firstPos = this.getFirstVisibleChannelPosition();
        let lastPos = this.getLastVisibleChannelPosition();

        //console.log ("First: " + firstPos + " Last: " + lastPos);

        for (let pos = firstPos; pos <= lastPos; pos++) {
            // Set clip rectangle
            this.mClipRect.left = this.getScrollX() + this.mChannelLayoutWidth + this.mChannelLayoutMargin;
            this.mClipRect.top = this.getTopFrom(pos);
            this.mClipRect.right = this.getScrollX() + this.getWidth();
            this.mClipRect.bottom = this.mClipRect.top + this.mChannelLayoutHeight;

            //canvas.save();
            //canvas.rect(this.mClipRect.left, this.mClipRect.top, this.mClipRect.width, this.mClipRect.height);
            //canvas.clip();

            // Draw each event
            let foundFirst = false;

            let epgEvents = this.epgData.getEvents(pos);
            if (this.isRTL()) {
                //canvas.setTransform(1, 0, 0, 1, 0, 0);
                //canvas.textAlign = "right";
            }

            for (let event of epgEvents) {
                if (this.isEventVisible(event.getStart(), event.getEnd())) {
                    this.drawEvent(canvas, pos, event, drawingRect);
                    foundFirst = true;
                } else if (foundFirst) {
                    break;
                }
            }

            if (this.isRTL()) {
                //this.ctx.setTransform(-1, -0, 0, 1, this.getWidth(), 0);
            }

            //canvas.restore();
        }

    }

    drawEvent(canvas, channelPosition, event, drawingRect) {

        this.setEventDrawingRectangle(channelPosition, event.getStart(), event.getEnd(), drawingRect);

        // Background
        //mPaint.setColor(event.isCurrent() ? mEventLayoutBackgroundCurrent : mEventLayoutBackground);
        canvas.fillStyle = event.isCurrent() ? this.mEventLayoutBackgroundCurrent : this.mEventLayoutBackground;
        if (channelPosition == this.getFocusedChannelPosition()) {
            let focusedEventPosition = this.getFocusedEventPosition();
            if (focusedEventPosition != -1) {
                let focusedEvent = this.epgData.getEvent(channelPosition, focusedEventPosition);
                if (focusedEvent == event) {
                    canvas.fillStyle = this.mEventLayoutBackgroundFocus;
                }

            } else if (event.isCurrent()) {
                this.focusedEventPosition = this.epgData.getEventPosition(channelPosition, event);
                canvas.fillStyle = this.mEventLayoutBackgroundFocus
            }
        }
        //canvas.drawRect(drawingRect, mPaint);
        // if Clip is not working properly, hack
        if (drawingRect.left < this.getScrollX() + this.mChannelLayoutWidth + this.mChannelLayoutMargin ) {
            drawingRect.left = this.getScrollX() + this.mChannelLayoutWidth + this.mChannelLayoutMargin;
        }
        canvas.fillRect(drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);

        // Add left and right inner padding
        drawingRect.left += this.mChannelLayoutPadding;
        drawingRect.right -= this.mChannelLayoutPadding;

        // Text
        //mPaint.setColor(mEventLayoutTextColor);
        canvas.fillStyle = this.mEventLayoutTextColor;
        //mPaint.setTextSize(mEventLayoutTextSize);
        canvas.font = "20px Arial";

        // Move drawing.top so text will be centered (text is drawn bottom>up)
        //mPaint.getTextBounds(event.getTitle(), 0, event.getTitle().length(), mMeasuringRect);
        drawingRect.top += (((drawingRect.bottom - drawingRect.top) / 2) + (10/2));

        let title = event.getTitle();
        /*title = title.substring(0,
         mPaint.breakText(title, true, drawingRect.right - drawingRect.left, null));*/
        if (this.isRTL()) {
            //canvas.setTransform(1, 0, 0, 1, 0, 0);
            //canvas.fillText(title, (this.getWidth() + this.mChannelLayoutMargin + this.mChannelLayoutMargin - this.mChannelLayoutHeight) - drawingRect.left, drawingRect.top);
            //canvas.scale(1, -1);
            console.log("LEFT :" + drawingRect.left);
            canvas.fillText(title, drawingRect.left, drawingRect.top);
            //canvas.setTransform(-1, -0, 0, 1, this.getWidth(), 0);
            //canvas.textAlign = "right";
        } else {
            canvas.fillText(title, drawingRect.left, drawingRect.top);
        }

    }

    setEventDrawingRectangle(channelPosition, start, end, drawingRect) {
        drawingRect.left = this.getXFrom(start);
        drawingRect.top = this.getTopFrom(channelPosition);
        drawingRect.right = this.getXFrom(end) - this.mChannelLayoutMargin;
        drawingRect.bottom = drawingRect.top + this.mChannelLayoutHeight;

        return drawingRect;
    }


    drawChannelListItems(canvas, drawingRect) {
        // Background
        this.mMeasuringRect.left = this.getScrollX();
        this.mMeasuringRect.top = this.getScrollY();
        this.mMeasuringRect.right = drawingRect.left + this.mChannelLayoutWidth;
        this.mMeasuringRect.bottom = this.mMeasuringRect.top + this.getHeight();

        //mPaint.setColor(mChannelLayoutBackground);
        canvas.fillStyle = this.mChannelLayoutBackground;
        canvas.fillRect(this.mMeasuringRect.left, this.mMeasuringRect.top, this.mMeasuringRect.width, this.mMeasuringRect.height);

        let firstPos = this.getFirstVisibleChannelPosition();
        let lastPos = this.getLastVisibleChannelPosition();

        for (let pos = firstPos; pos <= lastPos; pos++) {
            this.drawChannelItem(canvas, pos, drawingRect);
        }
    }

    drawChannelItem(canvas, position, drawingRect) {
        drawingRect.left = this.getScrollX();
        drawingRect.top = this.getTopFrom(position);
        drawingRect.right = drawingRect.left + this.mChannelLayoutWidth;
        drawingRect.bottom = drawingRect.top + this.mChannelLayoutHeight;

        // Loading channel image into target for
        let imageURL = this.epgData.getChannel(position).getImageURL();

        if (this.mChannelImageCache.has(imageURL)) {
            let image = this.mChannelImageCache.get(imageURL);
            drawingRect = this.getDrawingRectForChannelImage(drawingRect, image);
            //canvas.drawBitmap(image, null, drawingRect, null);
            if (this.isRTL()) {
                canvas.setTransform(1, 0, 0, 1, 0, 0);
                canvas.drawImage(image, (this.getWidth() + 4* this.mChannelLayoutMargin - this.mChannelLayoutWidth) - drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);
                canvas.setTransform(-1, -0, 0, 1, this.getWidth(), 0);
            } else {
                canvas.drawImage(image, drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);
            }

        } else {
            let img = new Image();
            img.src = imageURL;
            let that = this;
            img.onload = function () {
                that.mChannelImageCache.set(imageURL, img);
                that.updateCanvas();
                //drawingRect = that.getDrawingRectForChannelImage(drawingRect, img);
                //canvas.drawBitmap(image, null, drawingRect, null);
                //canvas.drawImage(img, drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);
            };

        }
    }


    getDrawingRectForChannelImage(drawingRect, image) {
        drawingRect.left += this.mChannelLayoutPadding;
        drawingRect.top += this.mChannelLayoutPadding;
        drawingRect.right -= this.mChannelLayoutPadding;
        drawingRect.bottom -= this.mChannelLayoutPadding;

        let imageWidth = image.width;
        let imageHeight = image.height;
        let imageRatio = imageHeight / parseFloat(imageWidth);

        let rectWidth = drawingRect.right - drawingRect.left;
        let rectHeight = drawingRect.bottom - drawingRect.top;

        // Keep aspect ratio.
        if (imageWidth > imageHeight) {
            let padding = parseInt((rectHeight - (rectWidth * imageRatio)) / 2);
            drawingRect.top += padding;
            drawingRect.bottom -= padding;
        } else if (imageWidth <= imageHeight) {
            let padding = parseInt((rectWidth - (rectHeight / imageRatio)) / 2);
            drawingRect.left += padding;
            drawingRect.right -= padding;
        }

        return drawingRect;
    }

    drawFocusEvent (canvas, drawingRect) {

    }

    handleClick(event) {
        this.scrollX = this.getScrollX(false) + parseInt(TVGuide.TIME_LABEL_SPACING_MILLIS / this.mMillisPerPixel);
        //this.scroller.scrollTo(this.scrollX, this.scrollY);
        //window.scrollTo(this.scrollX, this.scrollY);


        //this.ctx.fillStyle = 'red';
        this.ctx.clearRect(0, 0, this.getWidth(), this.getHeight());
        this.clear();
        this.onDraw(this.ctx);
        //this.updateCanvas();
    }

    clear() {
        this.mClipRect = new Rect();
        this.mDrawingRect = new Rect();
        this.mMeasuringRect = new Rect();
    }

    recalculateAndRedraw( withAnimation) {
        if (this.epgData != null && this.epgData.hasData()) {
            this.resetBoundaries();

            this.calculateMaxVerticalScroll();
            this.calculateMaxHorizontalScroll();

            this.scrollX = this.getScrollX() + this.getXPositionStart() - this.getScrollX();
            this.scrollY = this.getScrollY();
            this.scroller = document.getElementsByClassName("programguide-contents")[0];
            this.updateCanvas();
        }
    }

    handleScroll() {
        console.log("scrolling...");
    }

    handleKeyPress(event) {
        let keyCode = event.keyCode;
        /*keyCode = this.isRTL() && (keyCode == 39) ? 37 : 39;
        keyCode = this.isRTL() && (keyCode == 37) ? 39 : 37;*/
        let programPosition = this.getFocusedEventPosition();
        let channelPosition = this.getFocusedChannelPosition();
        let dx = 0, dy = 0;
        switch (keyCode) {
            case 39 :
                //let programPosition = this.getProgramPosition(this.getFocusedChannelPosition(), this.getTimeFrom(this.getScrollX(false) ));
                programPosition +=1
                if (programPosition != -1 && programPosition < this.epgData.getEventCount(this.getFocusedChannelPosition())) {
                    this.focusedEvent = this.epgData.getEvent(this.getFocusedChannelPosition(), programPosition);
                    if (this.focusedEvent) {
                        this.focusedEventPosition = programPosition;
                        dx =  parseInt((this.focusedEvent.getEnd() - this.focusedEvent.getStart()) / this.mMillisPerPixel);
                    }
                }
                this.scrollX = this.getScrollX(false) + dx;
                break;
            case 37 :
                programPosition -= 1;
                if (programPosition != -1 && programPosition > -1) {
                    this.focusedEvent = this.epgData.getEvent(this.getFocusedChannelPosition(), programPosition);
                    if (this.focusedEvent) {
                        this.focusedEventPosition = programPosition;
                        dx = (-1) * parseInt((this.focusedEvent.getEnd() - this.focusedEvent.getStart()) / this.mMillisPerPixel);
                    }
                }
                this.scrollX = this.getScrollX(false) + dx;
                break;
            case 40 :
                channelPosition +=1;
                if (channelPosition < this.epgData.getChannelCount()) {

                    dy = this.mChannelLayoutHeight + this.mChannelLayoutMargin;
                    this.focusedEventPosition = this.getProgramPosition(channelPosition, this.getTimeFrom(this.getScrollX(false) + this.getWidth() / 2));

                    if (channelPosition > (TVGuide.VISIBLE_CHANNEL_COUNT - TVGuide.VERTICAL_SCROLL_BOTTOM_PADDING_ITEM)) {
                        if (channelPosition != (this.epgData.getChannelCount() - TVGuide.VERTICAL_SCROLL_BOTTOM_PADDING_ITEM)) {
                            this.scrollY = this.getScrollY(false) + dy;
                        }
                    }
                    console.log(channelPosition);
                    this.focusedChannelPosition = channelPosition;

                }
                break;
            case 38 :
                channelPosition -=1;
                if (channelPosition >= 0) {

                    dy = (-1) * (this.mChannelLayoutHeight + this.mChannelLayoutMargin);
                    this.focusedEventPosition = this.getProgramPosition(channelPosition, this.getTimeFrom(this.getScrollX(false) + this.getWidth() / 2));
                    if (channelPosition >= (TVGuide.VISIBLE_CHANNEL_COUNT - TVGuide.VERTICAL_SCROLL_BOTTOM_PADDING_ITEM)) {

                        if (this.epgData.getChannelCount() - channelPosition != TVGuide.VERTICAL_SCROLL_BOTTOM_PADDING_ITEM) {
                            this.scrollY = this.getScrollY(false) + dy;
                        }
                    }
                    console.log(channelPosition);
                    this.focusedChannelPosition = channelPosition;
                }
                break;
        }


        this.ctx.clearRect(0, 0, this.getWidth(), this.getHeight());
        this.clear();
        this.onDraw(this.ctx);
    }


    componentDidMount() {
        //this.updateCanvas();
        this.recalculateAndRedraw(false);
        this.focusEPG();
    }

    componentDidUpdate() {
        this.updateCanvas();
    }

    updateCanvas() {
        this.ctx = this.refs.canvas.getContext('2d');
        if (this.isRTL()) {
            //this.ctx.scale(-1,1);
            //this.ctx.translate(this.getWidth(), 0);
            this.ctx.setTransform(-1,-0,0,1,this.getWidth(),0);
            //this.ctx.setTransform(-1,-0,0,1,this.getWidth(),0);

            // WORKING
            /*this.ctx.setTransform(1,0,0,1,0,0);
            this.ctx.translate(this.getWidth(),0);
            this.ctx.scale(-1,1);*/
            //console.log(this.ctx.currentTransform);
            //this.ctx.rotate(360*Math.PI/180);
            //console.log(this.ctx.currentTransform);
        }
        // draw children “components”
        this.onDraw(this.ctx)
    }

    focusEPG() {
        ReactDOM.findDOMNode(this.refs.epg).focus();
    }

    render() {
        window.addEventListener("scroll", function(event) {
        }, false);
        return (
            <div id="wrapper" ref="epg" tabIndex='-1' onKeyDown={this.handleKeyPress} className={Styles.background}>
                <div className="programguide-contents">
                        <canvas
                            ref = "canvas"
                            width = {this.getWidth()}
                            height = {this.getHeight()}
                            style={{border:'1px solid'}}/>
                </div>
            </div>

    )
        ;
    }
}