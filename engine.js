'use strict';

class Rectangle {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    hitTest(other) {
        const horizontal = (other.x < this.x + this.width) && (this.x < other.x + other.width);
        const vertical = (other.y < this.y + this.height) && (this.y < other.y + other.height);
        return (horizontal && vertical);
    }
}

class Sprite {
    constructor(image, rectangle) {
        this.image = image;
        this.rectangle = rectangle;
    }
}

class AssetLoader {
    constructor() {
        this._promises = [];
        this._assets = new Map();
    }

    addImage(name, url) {
        const img = new Image();
        img.src = url;

        const promise = new Promise((resolve, reject) => {
            img.addEventListener('load', (e) => {
                this._assets.set(name, img);
                resolve(img);
            });
        });

        this._promises.push(promise);
    }

    loadAll() {
        return Promise.all(this._promises).then((p) => this._assets);
    }

    get(name) {
        return this._assets.get(name);
    }
}

const assets = new AssetLoader();

class EventDispatcher {
    constructor() {
        this._eventListeners = {};
    }

    addEventListener(type, callback) {
        if(this._eventListeners[type] == undefined) {
            this._eventListeners[type] = [];
        }

        this._eventListeners[type].push(callback);
    }

    dispatchEvent(type, event) {
        const listners = this._eventListeners[type];
        if(listners != undefined) listners.forEach((callback) => callback(event));
    }
}

class GameEvent {
    constructor(target) {
        this.target = target;
    }
}

class Actor extends EventDispatcher {
    constructor(x, y, hitArea, tags = []) {
        super();
        this.hitArea = hitArea;
        this._hitAreaOffsetX = hitArea.x;
        this._hitAreaOffsetY = hitArea.y;
        this.tags = tags;

        this.x = x;
        this.y = y;
    }

    update(gameInfo, input) {}

    render(target) {}

    hasTag(tagName) {
        return this.tags.includes(tagName);
    }

    spawnActor(actor) {
        this.dispatchEvent('spawnactor', new GameEvent(actor));
    }

    destroy() {
        this.dispatchEvent('destroy', new GameEvent(this));
    }

    get x() {
        return this._x;
    }

    set x(value) {
        this._x = value;
        this.hitArea.x = value + this._hitAreaOffsetX;
    }

    get y() {
        return this._y;
    }

    set y(value) {
        this._y = value;
        this.hitArea.y = value + this._hitAreaOffsetY;
    }
}

class SpriteActor extends Actor {
    constructor(x, y, sprite, hitArea, tags=[]) {
        super(x, y, hitArea, tags);
        this.sprite = sprite;
        this.width = sprite.rectangle.width;
        this.height = sprite.rectangle.height;
    }

    render(target) {
        const context = target.getContext('2d');
        const rect = this.sprite.rextangle;
        context.drawImage(
            this.sprite.image,
            rect.x, rect.y,
            rect.width, rect.height,
            this.x, this.y,
            rect.width, rect.height
        );
    }

    isOutOfBounds(boundRect) {
        const actorLeft = this.x;
        const actorRight = this.x + this.width;
        const actorTop = this.y;
        const actorBottom = this.y + this.height;

        const horizontal = (actorRight < boundRect.x || actorLeft > boundRect.width);
        const vertical = (actorBottom < boundRect.y || actorTop > boundRect.height);

        return (horizontal || vertical);
    }
}

class Input {
    constructor(keyMap, prevKeyMap) {
        this.keyMap = keyMap;
        this.prevKeyMap = prevKeyMap;
    }

    _getKeyFromMap(keyName, map) {
        if(map.has(keyName)) {
            return map.get(keyName);
        } else {
            return false;
        }
    }

    _getPrevKey(keyName){
        return this._getKeyFromMap(keyName, this.prevKeyMap);
    }

    getKey(keyName) {
        return this._getKeyFromMap(keyName, this.keyMap);
    }

    getKeyDown(keyName) {
        const prevDown = this._getPrevKey(keyName);
        const currentDown = this.getKey(keyName);
        return (!prevDown && currentDown);
    }

    getKeyUp(keyName) {
        const prevDown = this._getPrevKey(keyName);
        const currentDown = this.getKey(keyName);
        return (prevDown && !currentDown);
    }
}

class InputReceiver {
    constructor() {
        this._keyMap = new Map();
        this._prevKeyMap = new Map();

        addEventListener('keydown', (ke) => this._keyMap.set(ke.key, true));
        addEventListener('keyup', (ke) => this._keyMap.set(ke.key, false));
    }

    getInput() {
        const keyMap = new Map(this._keyMap);
        const prevKeyMap = new Map(this._prevKeyMap);
        this._prevKeyMap = new Map(this._keyMap);
        return new Input(keyMap, prevKeyMap);
    }
}