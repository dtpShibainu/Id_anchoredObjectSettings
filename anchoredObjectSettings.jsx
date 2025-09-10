//ダイアログ表示
app.scriptPreferences.userInteractionLevel = 1699311169;

(function () {
    if (app.documents.length === 0) {
        alert("ドキュメントを開いてください。");
        return;
    }
    if (app.selection.length === 0) {
        alert("対象を選択してください。");
        return;
    }
    function updateAnchoredObjects(container) {
        var frames = container.allPageItems;
        for (var i = 0; i < frames.length; i++) {
            var obj = frames[i];
            if (obj.anchoredObjectSettings !== undefined) {
                try {
                    var shiba = obj.anchoredObjectSettings;

                    shiba.anchoredPosition = AnchorPosition.ANCHORED; // 親文字からの間隔：カスタム
                    shiba.anchorPoint = AnchorPoint.TOP_LEFT_ANCHOR; // 基準点：左上
                    shiba.verticalAlignment = VerticalAlignment.CENTER_ALIGN; // アンカー付き位置:揃え：中央
                    shiba.horizontalAlignment = HorizontalAlignment.CENTER_ALIGN; // アンカー付き位置:揃え：: 中央
                    shiba.horizontalReferencePoint = AnchoredRelativeTo.ANCHOR_LOCATION; // X基準: アンカーマーカー
                    shiba.anchorXoffset = -1.8; // Xオフセット
                } catch (e) {
                    $.writeln("処理エラー: " + e);
                }
            }
        }
    }

function main() {
    for (var s = 0; s < app.selection.length; s++) {
        var sel = app.selection[s];
        if (sel.hasOwnProperty("allPageItems")) {
            updateAnchoredObjects(sel);
        } else if (sel.constructor.name === "Text") {
            var objs = sel.allPageItems;
            for (var j = 0; j < objs.length; j++) {
                updateAnchoredObjects(objs[j]);
            }
        }
    }
    alert("アンカー付きオブジェクトの設定を適用しました。");
}
    app.doScript(main, ScriptLanguage.JAVASCRIPT, [], UndoModes.FAST_ENTIRE_SCRIPT);

})();
