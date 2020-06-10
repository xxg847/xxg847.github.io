// WebGL Bird - ゲームロジック
// ES6で関数型プログラミングを採用しています。
// TODO: 複雑な式を分解する、自動テストを書いてみる。

// 名前空間
window.GlBird = {};
(function(GlBird) {
    "use strict";

    // 各オブジェクトは 型名.make(args...) で作成する。
    // 操作は newObject = 型名.操作(object, args...) とする。

    // ベクター
    // (現時点では3D座標以外の使い方をしていない)

    const Vec = {};
    GlBird.Vec = Vec;

    // ベクターを作る。
    Vec.make = (x, y, z) => ({ x, y, z });

    // ベクターをずらす。
    Vec.move = (that, x, y, z) =>
        Vec.make(that.x + x, that.y + y, that.z + z);

    // アイテム
    const Item = {};
    GlBird.Item = Item;

    // アイテムを作る。
    Item.make = (type, pos) => ({ type, pos });

    // アイテムリスト

    const ItemList = {};
    GlBird.ItemList = ItemList;

    // アイテムリストはただの配列なのでmakeは無し。

    // だんごを設置する。
    ItemList.putDango = (that, x, y) => {
        return [Item.make("Dango", Vec.make(x, y, -60))].concat(that);
    };

    // 木を設置する。
    ItemList.putTree = (that, x) => {
        return [Item.make("Tree", Vec.make(x, 0, -60))].concat(that);
    };

    // アイテムリストのアイテムを動かす。
    ItemList.update = (that) => {
        const zMove = 0.1;
        return that.map(
            (item) => Item.make(item.type, Vec.move(item.pos, 0, 0, zMove))
        ).filter(
            (item) => item.pos.z < 10
        );
    };

    // 鳥
    const Bird = {};
    GlBird.Bird = Bird;

    // 鳥を作る。
    Bird.make = (pos, speedX, speedY) => ({ pos, speedX, speedY });

    // 鳥を初期化する。
    Bird.initialize = () => Bird.make(Vec.make(0, 0.5, 0), 0, 0);

    // 加速させる。
    Bird.accel = (that, x, y) => {
        const speedX = Math.min(Math.max(that.speedX + x, -0.05), 0.05);
        const speedY = Math.min(Math.max(that.speedY + y, -0.05), 0.05);
        return Bird.make(that.pos, speedX, speedY);
    };

    // 減速させる
    Bird.deaccel = (that, x, y) => {
        let speedX = that.speedX;
        if (Math.abs(speedX) < x) {
            speedX = 0;
        } else if (x > 0) {
            speedX += (speedX < 0) ? x : -x;
        }
        let speedY = that.speedY;
        if (Math.abs(speedY) < y) {
            speedY = 0;
        } else if (y > 0) {
            speedY += (speedY < 0) ? y : -y;
        }
        return Bird.make(that.pos, speedX, speedY);
    };

    // 移動させる。
    Bird.update = (that) => {
        return Bird.make(
            Vec.move(that.pos, that.speedX, that.speedY, 0),
            that.speedX,
            that.speedY
        );
    };

    // 移動範囲を制限する
    // TODO: 範囲を定数かパラメータにする
    Bird.clip = (that) => {
        const x = Math.max(Math.min(that.pos.x, 2), -2);
        const y = Math.max(Math.min(that.pos.y, 1), 0);
        return Bird.make(Vec.make(x, y, 0), that.speedX, that.speedY);
    };

    // ゲーム全体管理
    const Game = {};
    GlBird.Game = Game;

    // ゲーム全体を作成
    Game.make = (mode, cycle, score, bird, itemList) => ({ mode, cycle, score, bird, itemList });

    // ゲーム全体を初期化
    Game.initialize = () => Game.make("Title", 0, 0, Bird.initialize(), []);

    // 鳥がだんごに触れていれば、そのだんごを消す。
    // TODO: itemListに移す?
    Game.checkDango = (bird, itemList) => {
        return itemList.filter(
            (item) =>
                item.type !== "Dango"
                || Math.abs(bird.pos.x - item.pos.x) > 0.5
                || Math.abs(bird.pos.y - item.pos.y) > 0.5
                || Math.abs(bird.pos.z - item.pos.z) > 1
        );
    };

    // 鳥が木に触れているか?
    Game.checkTree = (bird, itemList) => {
        return itemList.find(
            (item) =>
                item.type === "Tree"
                && Math.abs(bird.pos.z - item.pos.z) <= 0.25
                && Math.abs(bird.pos.x - item.pos.x) <= 0.25
        );
    };

    // ゲーム全体を更新
    Game.update = (that, keyState) => {

        const { cycle, mode } = that;
        let { score, bird, itemList } = that;

        // モード:タイトル画面・ゲームオーバー

        if (mode === "Title" || mode === "Miss") {
            if (keyState.Space) { // キーが押された
                // モードをゲームプレイ中にして処理中断
                return Game.make("Play", 0, 0, Bird.initialize(), []);
            }
            // モードそのままで処理中断
            return Game.make(mode, cycle + 1, score, bird, itemList);
        }

        // モード:ゲームプレイ中

        const encountTree = (cycle % 90 === 0);
        const encountDango = (cycle % 90 === 45);

        // 木とだんごを動かす
        itemList = ItemList.update(itemList);
        if (encountTree) { // 木が出現
            const treeX = Math.floor(5 * Math.random()) - 2;
            itemList = ItemList.putTree(itemList, treeX);
        }
        if (encountDango) { // だんごが出現
            const dangoX = Math.floor(5 * Math.random()) - 2;
            const dangoY = Math.floor(4 * Math.random()) / 4;
            itemList = ItemList.putDango(itemList, dangoX, dangoY);
        }

        // 鳥の移動方向を決める

        let aX = 0;
        if (keyState.Left) {
            aX -= 1;
        }
        if (keyState.Right) {
            aX += 1;
        }

        let aY = 0;
        if (keyState.Up) {
            aY += 1;
        }
        if (keyState.Down) {
            aY -= 1;
        }

        // 鳥を動かす
        bird = Bird.accel(bird, aX * 0.01, aY * 0.01);
        bird = Bird.deaccel(bird, (aX === 0) ? 0.005 : 0, (aY === 0) ? 0.005 : 0);
        bird = Bird.update(bird);

        // 鳥の移動範囲を制限
        bird = Bird.clip(bird);

        // 鳥とだんごのあたり判定
        const oldLength = itemList.length; // 減る前の数を求める
        itemList = Game.checkDango(bird, itemList);
        score += oldLength - itemList.length; // 減った数を得点に加算

        // 鳥が木のあたり判定
        if (Game.checkTree(bird, itemList)) {
            // モードをゲームオーバーにして処理中断
            return Game.make("Miss", 0, score, bird, itemList);
        }

        // 鳥が木に当たっていない

        // 次フレームもゲーム続行
        return Game.make("Play", cycle + 1, score, bird, itemList);
    };
}(window.GlBird));
