// WebGL Bird 画面部分
// TODO: 開始時にconsoleに警告が出るのを直す

(function(THREE, Keyboard, GlBird) {
    "use strict";

    // 画面サイズ
    const WIDTH = 640;
    const HEIGHT = 360;

    // モデル情報
    const models = {
        //      [[X, Y], [W, H]],
        BirdA:  [[0, 0], [1, 1]],
        BirdB:  [[1, 0], [1, 1]],
        Tree:   [[0, 1], [1, 2]],
        Dango:  [[0, 3], [1, 1]],
        Shadow: [[1, 3], [1, 1]],
        Title:  [[2, 3], [2, 1]]
    };

    const geometryMemo = {}; // makeGeometryの戻り値のメモ

    // モデル名をもとにジオメトリを作る
    const makeGeometry = (name) => {
        if (geometryMemo[name]) { return geometryMemo[name]; }

        const model = models[name];
        if (!model) { throw Error("undefined model: " + name); }

        const [pos, size] = model;
        const [W, H] = size;
        const X = pos[0];
        const Y = 4 - pos[1] - H; // TODO: 4を外出しする
        const TILE = 0.25;        // TODO: 外出しする

        // 板ポリゴンの頂点ごとのUV情報
        const uvs = [
            new THREE.Vector2(X       * TILE, (Y + H) * TILE),
            new THREE.Vector2(X       * TILE, Y       * TILE),
            new THREE.Vector2((X + W) * TILE, Y       * TILE),
            new THREE.Vector2((X + W) * TILE, (Y + H) * TILE)
        ];

        // 板ポリゴンを作成し、2つの三角ポリゴンにUV情報を適用
        const geometry = new THREE.PlaneGeometry(W, H);
        geometry.faceVertexUvs[0][0] = [uvs[0], uvs[1], uvs[3]];
        geometry.faceVertexUvs[0][1] = [uvs[1], uvs[2], uvs[3]];

        geometryMemo[name] = geometry; // 戻り値をメモする
        return geometry;
    };

    // メッシュ関連

    const texture = new THREE.TextureLoader().load(ImageUri["sprite.png"]);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;

    const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true
    });

    const meshQueue = []; // putModelで配置したメッシュを記録する配列

    // 指定のモデルをメッシュを作成して配置
    const putModel = (name, x, y, z) => {
        const mesh = new THREE.Mesh(makeGeometry(name), material);
        mesh.position.set(x, y, z);
        meshQueue.push(mesh);
        scene.add(mesh);
        return mesh;
    };

    // putModelで配置したメッシュを全て消す
    const clearModels = () => {
        meshQueue.forEach((mesh) => scene.remove(mesh));
        meshQueue.length = 0;
    };

    // WebGL描画準備

    const canvas = document.getElementById("js-canvas");
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
    renderer.setClearColor(0xffffcc, 1);
    renderer.setSize(WIDTH, HEIGHT);

    //シーン初期化
    const scene = new THREE.Scene();

    // カメラ
    const camera = new THREE.PerspectiveCamera(45, WIDTH / HEIGHT, 1, 100);
    camera.position.y = 2;
    camera.position.z = 3;
    camera.lookAt(0, 0.4, -2);

    // 光源
    const light = new THREE.PointLight(0xffffff, 1, 0);
    light.position.set(0, 0, 1);
    scene.add(light);

    // 遠くのものを薄暗くする
    scene.fog = new THREE.Fog(0xccccff, 10, 50);

    // キー取得関数作成
    const getKey = Keyboard.startListening();

    // ゲームの状態を初期化
    let game = GlBird.Game.initialize();

    const scoreSpan = document.getElementById("js-score");
    const textNode = document.createTextNode("");
    scoreSpan.appendChild(textNode);

    // メインループ
    const animate = () => {
        requestAnimationFrame(animate);

        // ゲームの状態を更新
        game = GlBird.Game.update(game, getKey());

        // 前フレームで表示したモデルをすべて消す
        clearModels();

        const { mode, cycle, score, bird, itemList } = game;

        // 表示内容を計算
        const showTitle = (mode === "Title");
        const scoreText = (showTitle || score === 0) ? "" : score;
        const showBird = (mode !== "Miss" || cycle % 10 < 5);
        const birdModel = (mode === "Miss") ? (
            "BirdA"
        ) : (
            (cycle % 20 < 10) ? "BirdA" : "BirdB"
        );

        // 表示
        if (showTitle) {
            putModel("Title", 0, 1.5, 0);
        }
        textNode.textContent = scoreText;
        if (showBird) {
            const mesh = putModel(birdModel, bird.pos.x, bird.pos.y, bird.pos.z);
            mesh.rotation.setFromRotationMatrix(camera.matrix);
            mesh.rotateZ(-150 * bird.speedX * Math.PI / 180)
        }
        itemList.forEach((item) => {
            const pos = item.pos;
            const name = item.type;
            putModel(name, pos.x, pos.y, pos.z);
            const mesh = putModel("Shadow", pos.x, -1, pos.z);
            mesh.rotateX(-85 * Math.PI / 180);
        });
        renderer.render(scene, camera);
    };

    // メインループ開始
    animate();
}(window.THREE, window.Keyboard, window.GlBird));
