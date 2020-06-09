// キーボード入力取得
// 汎用性を考え、ES3で記述しています。

var Keyboard = {};
(function() {
    // "use strict";

    // TODO: 差し替え可能にする
    var keyMap = {
        "37": "Left",
        "38": "Up",
        "39": "Right",
        "40": "Down",
        "32": "Space"
    };

    // キー取得開始
    function startListening() {

        var keyState = {
            Left:  false,
            Up:    false,
            Right: false,
            Down:  false,
            Space: false
        };

        function callback(event) {
            if (!keyMap[event.keyCode]) { return; }

            event.preventDefault();

            // 本当は直接書き換えるのではなくキューに貯めた方がいい
            keyState[keyMap[event.keyCode]] = (event.type === "keydown");
        }

        window.addEventListener("keydown", callback, false);
        window.addEventListener("keyup",   callback, false);

        // 取得関数
        return function() {

            // 本当はキューに貯めデータを処理した方がいい
            return {
                Left:  keyState.Left,
                Up:    keyState.Up,
                Right: keyState.Right,
                Down:  keyState.Down,
                Space: keyState.Space
            };
        };
    }
    Keyboard.startListening = startListening;
}());
