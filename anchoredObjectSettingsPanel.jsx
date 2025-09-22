#target indesign
#targetengine "myScriptEngine" ;

app.scriptPreferences.userInteractionLevel = UserInteractionLevels.INTERACT_WITH_ALL;

(function(){
    if(app.documents.length===0){
        alert("ドキュメントを開いてください。");
        return;
    }

function mm2pt(mm){
    return parseFloat(mm) * 1; // mm → pt * 2.834645669
}

    // ===== パネル作成 =====
    var dlg = new Window("palette", "アンカー付きオブジェクトオプション");
    dlg.alignChildren = "fill";

    // 親文字からの間隔
    var posGroup = dlg.add("panel", undefined, "親文字からの間隔");
    var posDropdown = posGroup.add("dropdownlist", undefined, ["カスタム","インライン","行に合わせる"]);
    posDropdown.selection = 0;

    // ===== 基準点（9分割ボタン型） =====
    var anchorGroup = dlg.add("panel", undefined, "基準点");
    anchorGroup.orientation = "column";

    var labels=[
        ["左上","上中央","右上"],
        ["左中央","中央","右中央"],
        ["左下","下中央","右下"]
    ];

    var anchorPoints=[
        AnchorPoint.TOP_LEFT_ANCHOR,
        AnchorPoint.TOP_CENTER_ANCHOR,
        AnchorPoint.TOP_RIGHT_ANCHOR,
        AnchorPoint.LEFT_CENTER_ANCHOR,
        AnchorPoint.CENTER_ANCHOR,
        AnchorPoint.RIGHT_CENTER_ANCHOR,
        AnchorPoint.BOTTOM_LEFT_ANCHOR,
        AnchorPoint.BOTTOM_CENTER_ANCHOR,
        AnchorPoint.BOTTOM_RIGHT_ANCHOR,
    ];

    var anchorButtons=[];

    for(var r=0;r<3;r++){
        var row=anchorGroup.add("group");
        row.orientation="row";
        for(var c=0;c<3;c++){
            var idx=r*3+c;
            var btn=row.add('iconbutton', undefined, undefined, {style:'toolbutton'});
            btn.size=[30,20];
            btn.text=labels[r][c];
            btn.textPen = btn.graphics.newPen(btn.graphics.PenType.SOLID_COLOR,[0,0,0,1],1);
            btn.value=false;

            // 描画関数
            btn.onDraw = function(){
                with(this){
                    graphics.drawOSControl();
                    graphics.rectPath(0,0,size[0],size[1]);
                    if(value){
                        graphics.fillPath(graphics.newBrush(graphics.BrushType.SOLID_COLOR,[0.6,0.8,1,1]));
                    }else{
                        graphics.fillPath(graphics.newBrush(graphics.BrushType.SOLID_COLOR,[0.8,0.8,0.8,1]));
                    }
                    if(text){
                        var tw = graphics.measureString(text,graphics.font,size[0])[0];
                        graphics.drawString(text,textPen,(size[0]-tw)/2,(size[1]-graphics.font.capHeight)/2,graphics.font);
                    }
                }
            };

            // クリック処理（クロージャでbtnを固定）
            (function(button){
                button.onClick=function(){
                    for(var k=0;k<anchorButtons.length;k++){
                        anchorButtons[k].value=false;
                        anchorButtons[k].notify("onDraw");
                    }
                    button.value=true;
                    button.notify("onDraw");
                }
            })(btn);

            if(idx===0){ btn.value=true; } // 初期中央
            anchorButtons.push(btn);
        }
    }

// ===== アンカー付き位置の基準点 =====
var alignGroup = dlg.add("panel", undefined, "揃え");
alignGroup.orientation = "row";

// 水平揃え
var hAlignDropdown = alignGroup.add("dropdownlist", undefined, [
    "左揃え",
    "中央揃え",
    "中央揃え",
    "テキスト揃え"
]);
hAlignDropdown.selection = 1; // デフォルト中央

// 垂直揃え
var vAlignDropdown = alignGroup.add("dropdownlist", undefined, [
    "上揃え",
    "中央揃え",
    "下揃え"
]);
vAlignDropdown.selection = 1; // デフォルト中央

    // ===== X/Y基準 =====
    var xGroup = dlg.add("panel", undefined, "X 基準 / オフセット");
    var xRow = xGroup.add("group");
    xRow.add("statictext", undefined, "X 基準：");
    var xDropdown = xRow.add("dropdownlist", undefined, [
        "アンカーマーカー",
        "段枠",
        "テキストフレーム",
        "ページマージン",
        "ページ枠"
    ]);
    xDropdown.selection=0;
    xRow.add("statictext", undefined, "X オフセット（mm）：");
    var xOffset = xRow.add("edittext", undefined, "0");
    xOffset.characters=5;

    var yGroup = dlg.add("panel", undefined, "Y 基準 / オフセット");
    var yRow = yGroup.add("group");
    yRow.add("statictext", undefined, "Y 基準：");
    var yDropdown = yRow.add("dropdownlist", undefined, [
        "行（ベースライン）",
        "行（キャップハイト）",
        "仮想ボディの上",
        "仮想ボディの中央",
        "仮想ボディの下",
        "行（行送りの先頭）",
        "段枠",
        "テキストフレーム",
        "ページマージン",
        "ページ枠"
    ]);
    yDropdown.selection=0;
    yRow.add("statictext", undefined, "Y オフセット（mm）：");
    var yOffset = yRow.add("edittext", undefined, "0");
    yOffset.characters=5;

    // ===== オプション =====
    var optGroup = dlg.add("panel", undefined, "オプション");
    var fitBoundsCheck = optGroup.add("checkbox", undefined, "段の上下境界内に収める");
    fitBoundsCheck.value=true;
    var preventManualCheck = optGroup.add("checkbox", undefined, "手動配置を防ぐ");
    preventManualCheck.value=false;

    // ===== OK / 閉じる =====
    var btnGroup = dlg.add("group");
    btnGroup.alignment="right";
    var cancelBtn = btnGroup.add("button", undefined, "閉じる", {name:"cancel"});
    var okBtn = btnGroup.add("button", undefined, "設定", {name:"ok"});

    // ===== 選択テキスト範囲内アンカー付きオブジェクトに適用 =====
    function updateAnchoredObjectsInSelection(selText){
        var objs = selText.allPageItems;
        for(var i=0;i<objs.length;i++){
            var obj=objs[i];
            if(obj.anchoredObjectSettings){
                try{
                    var shiba = obj.anchoredObjectSettings;
                    var point;
                    for(var j=0;j<anchorButtons.length;j++){
                        if(anchorButtons[j].value){ point=anchorPoints[j]; break; }
                    }
                    shiba.anchorPoint = point;
                    shiba.horizontalReferencePoint = [
                        AnchoredRelativeTo.ANCHOR_LOCATION,
                        AnchoredRelativeTo.COLUMN_EDGE,
                        AnchoredRelativeTo.TEXT_FRAME,
                        AnchoredRelativeTo.PAGE_MARGINS,
                        AnchoredRelativeTo.PAGE_EDGE
                    ][xDropdown.selection.index];
                    shiba.horizontalAlignment = [
                        HorizontalAlignment.LEFT_ALIGN,
                        HorizontalAlignment.CENTER_ALIGN,
                        HorizontalAlignment.RIGHT_ALIGN,
                        HorizontalAlignment.TEXT_ALIGN
                    ][hAlignDropdown.selection.index];
                    shiba.verticalAlignment = [
                        VerticalAlignment.TOP_ALIGN,
                        VerticalAlignment.CENTER_ALIGN,
                        VerticalAlignment.BOTTOM_ALIGN
                    ][vAlignDropdown.selection.index];
                    shiba.verticalReferencePoint = [
                        VerticallyRelativeTo.LINE_BASELINE,
                        VerticallyRelativeTo.CAPHEIGHT,
                        VerticallyRelativeTo.EMBOX_TOP,
                        VerticallyRelativeTo.EMBOX_MIDDLE,
                        VerticallyRelativeTo.EMBOX_BOTTOM,
                        VerticallyRelativeTo.TOP_OF_LEADING,
                        VerticallyRelativeTo.COLUMN_EDGE,
                        VerticallyRelativeTo.TEXT_FRAME,
                        VerticallyRelativeTo.PAGE_MARGINS,
                        VerticallyRelativeTo.PAGE_EDGE
                    ][yDropdown.selection.index];
                    shiba.anchorXoffset = mm2pt(xOffset.text);
                    shiba.anchorYoffset = mm2pt(yOffset.text);
                    shiba.lockPosition = preventManualCheck.value;
                }catch(e){ $.writeln("処理エラー:"+e); }
            }
        }
    }

okBtn.onClick = function(){
    if(app.selection.length===0){
        alert("テキストを選択してください。");
        return;
    }

    app.doScript(function(){
        for(var s=0;s<app.selection.length;s++){
            var sel = app.selection[s];
            if(sel.hasOwnProperty("characters") || sel.constructor.name==="Text"){
                updateAnchoredObjectsInSelection(sel);
            }
        }
        alert("アンカー付きオブジェクトの設定を適用しました。");
    }, ScriptLanguage.JAVASCRIPT, [], UndoModes.FAST_ENTIRE_SCRIPT);
};


    cancelBtn.onClick=function(){ dlg.close(); };

    dlg.layout.layout(true);
    dlg.show();

})();
