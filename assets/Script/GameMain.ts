const {ccclass, property} = cc._decorator;

import EventType = cc.Node.EventType;
import Event = cc.Event;

@ccclass
export default class Game extends cc.Component {

    @property(cc.Prefab)
    ballPrefab: cc.Prefab = null;

    @property([cc.Texture2D])
    ballSprites: cc.Texture2D[] = [];

    private firstBall: cc.Node = null;
    private removableBallList: cc.Node[] = [];
    private lineNodeList: cc.Node[] = [];
    private lastBall: cc.Node = null;
    private currentName: string = "";

    private static async wait(msec: number) {
        return new Promise(resolve => setTimeout(resolve, msec));
    }

    private static randomRange(max: number, min: number) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    private async dropBall(count: number) {
        let sp = [];
        for (let i = 0; i < this.ballSprites.length; i++) {
            sp[i] = new cc.SpriteFrame(this.ballSprites[i]);
        }
        for (let i = 0; i < count; i++) {
            let ball = cc.instantiate(this.ballPrefab);
            this.node.addChild(ball);
            ball.setPositionX(Game.randomRange(150, -150));
            ball.setPositionY(400);

            let spriteId = Game.randomRange(5, 0);
            ball.name = "Ball" + (spriteId + 1);
            ball.getComponent(cc.Sprite).spriteFrame = sp[spriteId];
            await Game.wait(10);
        }
    }

    private static getCurrentHitCollider(p: cc.Vec2): cc.PhysicsCollider {
        return cc.director.getPhysicsManager().testPoint(p);
    }

    private static getNode(obj): cc.Node {
        if (obj != null && obj.hasOwnProperty("node")) {
            return obj["node"];
        }
        return null;
    }

    private static createLine(p1: cc.Vec2, p2: cc.Vec2): cc.Node {
        let node: cc.Node = new cc.Node();
        let graphic: cc.Graphics = node.addComponent<cc.Graphics>(cc.Graphics);
        graphic.lineWidth = 6;
        graphic.moveTo(p1.x, p1.y);
        graphic.lineTo(p2.x, p2.y);
        graphic.strokeColor = cc.Color.ORANGE;
        graphic.stroke();
        return node;
    }

    private onDragStart() {
        let self = this;
        return function (event: Event.EventTouch) {
            if (self.firstBall != null) {
                return;
            }
            let node = Game.getNode(Game.getCurrentHitCollider(event.touch.getLocation()));
            if (node == null) {
                return;
            }

            self.removableBallList = [];
            self.lineNodeList = [];
            self.firstBall = node;
            self.currentName = node.name;
            self.pushToList(node);

            self.node.on(EventType.TOUCH_MOVE, self.onDragging());
            self.node.on(EventType.TOUCH_END, self.onDragEnd());
        }
    }

    private onDragging() {
        let self = this;
        return function (event: Event.EventTouch) {
            let node = Game.getNode(Game.getCurrentHitCollider(event.touch.getLocation()));
            if (node == null) {
                return;
            }
            if (node.name != self.currentName) {
                return;
            }
            let dist = cc.pDistance(node.position, self.lastBall.position);
            if (dist > 100) {
                return;
            }
            let lineNode: cc.Node = Game.createLine(self.lastBall.position, node.position);
            self.node.addChild(lineNode);
            self.lineNodeList.push(lineNode);

            self.pushToList(node);
        }
    }

    private onDragEnd() {
        let self = this;
        return function () {
            if (self.firstBall == null) {
                return;
            }
            self.firstBall = null;
            self.lineNodeList.forEach((n: cc.Node) => self.node.removeChild(n));
            if (self.removableBallList.length < 3) {
                self.removableBallList.forEach((node: cc.Node) => {
                    node.opacity = 255;
                    node.name = node.name.substring(1, node.name.length);
                });
                return;
            }
            self.removableBallList.forEach((node: cc.Node) => self.node.removeChild(node));
        }
    }

    private pushToList(node: cc.Node) {
        this.lastBall = node;
        this.removableBallList.push(node);
        node.name = "_" + node.name;
        node.opacity = 128;
    }

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        let collisionManager = cc.director.getCollisionManager();
        collisionManager.enabled = true;
        collisionManager.enabledDebugDraw = true;
        cc.director.getPhysicsManager().enabled = true;
        cc.director.setClearColor(cc.hexToColor('#D2CFCB'));
    }

    start() {
        this.dropBall(200);

        this.node.on(EventType.TOUCH_START, this.onDragStart());
    }

    // update(dt) {
    //
    // }
}
