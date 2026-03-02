---
sidebar_position: 3
title: "Step 2: root化 (Magisk)"
description: Magiskを使ったroot化の手順
---

# Step 2: Magiskでroot化

## ゴール

この章が終わると、スマホで**root権限（管理者権限）**が使えるようになります。

## root化とは？

スマホは通常、システムの重要な部分を触れないように制限されています。root化すると、この制限が解除されて**何でもできる**ようになります。

```
通常のスマホ:  アプリの操作のみ可能
              ↓
root化後:     システムファイルの編集、
              プリインアプリの削除、
              CPUクロック変更、
              広告の完全ブロック... 何でもOK
```

## Magiskを使う理由

root化の方法はいくつかありますが、**Magisk**が現在最も人気で安全な方法です。

| 特徴 | 説明 |
|------|------|
| **Systemless** | システムパーティションを直接書き換えない |
| **SafetyNet回避** | 銀行アプリ等がroot検知をすり抜けられる |
| **モジュール** | 機能追加がZIPインストールで簡単 |
| **OTA対応** | システムアップデートが（ほぼ）可能 |
| **オープンソース** | 安全性が検証可能 |

## 2-1. 現在のboot imageを取得

Magiskはboot image（起動イメージ）をパッチすることでrootを実現します。まず現在のboot imageを取り出します。

### 方法A: TWRPから取得（推奨）

```bash
# 1. fastbootモードに入る
adb reboot bootloader

# 2. TWRPを一時起動（フラッシュではなくRAMブート）
fastboot boot twrp-aurora.img
# → TWRPが起動する（画面が映らない場合もある、ADBは使える）

# 3. bootパーティションをコピー
adb shell "dd if=/dev/block/by-name/boot_a of=/sdcard/Download/boot_current.img"

# 4. PCに取り出す
adb pull /sdcard/Download/boot_current.img ./
```

:::info TWRPの画面が映らない場合
一部の端末ではTWRPの画面が表示されません。でも **ADBは使えます**。PCから `adb shell` で操作すればOKです。
:::

### 方法B: ファームウェアから抽出

ファームウェアの中にboot.sinやboot.imgがある場合、それを使うこともできます。ただし、OTAアップデート済みの場合はバージョンが一致しないことがあるので、方法Aの方が確実です。

## 2-2. Magiskをインストール

### アプリのインストール

1. [Magisk 公式GitHub](https://github.com/topjohnwu/Magisk/releases) から最新のAPKをダウンロード
2. PCから直接インストール：

```bash
adb install Magisk-v27.0.apk
# ※バージョン番号は最新のものに読み替えてください
```

### boot imageをパッチ

1. boot imageをスマホに送る：

```bash
adb push boot_current.img /sdcard/Download/
```

2. スマホで **Magisk アプリ**を開く
3. 「**Magisk インストール**」をタップ
4. 「**パッチするファイルを選択**」をタップ
5. `/sdcard/Download/boot_current.img` を選択
6. 「**インストール**」をタップ
7. 完了するまで待つ

パッチが完了すると、`/sdcard/Download/` に `magisk_patched-XXXXX.img` が生成されます。

```bash
# パッチ済みboot imageをPCに取り出す
adb pull /sdcard/Download/magisk_patched-XXXXX.img ./
```

## 2-3. パッチ済みboot imageをフラッシュ

```bash
# 1. fastbootモードに入る
adb reboot bootloader

# 2. パッチ済みimageを書き込み
fastboot flash boot_a magisk_patched-XXXXX.img

# ※ A/Bスロット端末の場合、現在のスロットに書き込む
# スロット確認: fastboot getvar current-slot

# 3. 再起動
fastboot reboot
```

:::warning boot_a と boot_b
SOV38はA/Bスロット方式です。通常は `boot_a` でOKですが、不安な場合は：
```bash
fastboot getvar current-slot
# → current-slot: a  ← この場合 boot_a に書き込む
```
:::

## 2-4. root化の確認

再起動後：

1. Magiskアプリを開いて、「**インストール済み**」にバージョン番号が表示されていればOK
2. PCからも確認：

```bash
adb shell "su -c 'id'"
# 出力: uid=0(root) gid=0(root) groups=0(root) ...
# ↑ uid=0 が表示されれば root化成功！
```

3. 「スーパーユーザー」ダイアログが表示されたら「**許可**」をタップ

## 2-5. Magiskの基本操作

### モジュールのインストール

Magiskモジュールは、システムを直接変更せずに機能を追加する仕組みです。

```bash
# PCからモジュールZIPをインストール
adb push module.zip /sdcard/Download/
adb shell "su -c 'magisk --install-module /sdcard/Download/module.zip'"
adb reboot  # 再起動で有効化
```

または、Magiskアプリの「**モジュール**」タブからZIPを選択してインストール。

### rootシェルの使い方

```bash
# PCから
adb shell
$ su
# ← プロンプトが # に変わればroot

# または直接
adb shell "su -c 'コマンド'"
```

### プロパティの変更 (resetprop)

```bash
# 読み取り専用プロパティも変更可能
su -c 'resetprop ro.debuggable 1'
```

## トラブルシューティング

### Magiskアプリが「インストールなし」と表示

boot imageのパッチとフラッシュが正しくできていない可能性。再度 2-2 からやり直してください。

### 「su: not found」と表示

Magiskが正しくインストールされていません。Magiskアプリで「インストール」→「直接インストール」を試してください（root済みの場合）。

### bootloop（起動ループ）になった

1. **電源ボタン10秒長押し**で強制シャットダウン
2. **fastbootモードに入る**（`adb reboot bootloader`、またはハードウェアキーの組み合わせ）
3. **元のboot imageを書き戻す**：
```bash
fastboot flash boot_a boot_current.img  # バックアップしたオリジナル
fastboot reboot
```

### Magiskセーフモード

モジュールが原因でbootloopした場合：

1. 電源ボタン長押しで強制オフ
2. 電源を入れて、**メーカーロゴが出たらボリュームDOWNを押し続ける**
3. Magiskセーフモード（全モジュール無効）で起動

```bash
# セーフモード起動後に問題のモジュールを削除
adb shell "su -c 'rm -rf /data/adb/modules/問題のモジュール名'"
adb reboot
```

これでroot化は完了です！次のページでは、改造中に起きた文鎮化とその復旧について解説します。
