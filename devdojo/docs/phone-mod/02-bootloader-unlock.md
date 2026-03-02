---
sidebar_position: 2
title: "Step 1: 準備とBLアンロック"
description: 必要なツールの導入からブートローダーアンロックまで
---

# Step 1: 準備とブートローダーアンロック

## ゴール

この章が終わると、スマホのブートローダーがアンロックされた状態になります。

## 1-1. 必要なツールをインストール

### adb と fastboot

adbとfastbootは、PCからスマホを操作するための公式ツールです。

#### Windows

1. [Android SDK Platform-Tools](https://developer.android.com/tools/releases/platform-tools) からZIPをダウンロード
2. 好きな場所に解凍（例: `C:\platform-tools`）
3. 環境変数PATHに追加するか、解凍したフォルダ内で作業

#### macOS

```bash
# Homebrewでインストール（推奨）
brew install android-platform-tools

# 確認
adb version
fastboot --version
```

#### Linux

```bash
# Ubuntu/Debian
sudo apt install android-tools-adb android-tools-fastboot

# 確認
adb version
fastboot --version
```

### Python 3（Sony端末の場合）

Sony端末ではxperableやsxflasherなどPythonベースのツールを使います。

```bash
# バージョン確認（3.8以上推奨）
python3 --version
```

### USB ドライバ（Windowsのみ）

Windowsの場合、Sonyの[USB ドライバ](https://developer.sony.com/open-source/aosp-on-xperia-open-devices/get-started/flash-tool/download-and-install-usb-drivers)をインストールしてください。macOS/Linuxは不要です。

## 1-2. スマホ側の準備

### 開発者オプションを有効化

1. **設定** → **端末情報** → **ビルド番号** を **7回タップ**
2. 「開発者になりました」と表示されればOK

### USBデバッグを有効化

1. **設定** → **システム** → **開発者向けオプション**
2. **USBデバッグ** をONにする

### OEMロック解除を有効化

1. 同じ開発者向けオプション内の **OEMロック解除** をONにする

:::warning OEMロック解除が表示されない場合
SIMカードを挿入してネットワークに接続した状態で再試行してください。キャリア版の中には、この項目が表示されない機種もあります。
:::

### 接続確認

```bash
# スマホをUSBで接続して実行
adb devices

# 出力例:
# List of devices attached
# CB512FUK5D    device
```

「device」と表示されればOK。「unauthorized」の場合、スマホ画面に表示される「USBデバッグを許可」ダイアログを承認してください。

## 1-3. バックアップを取る

:::danger 最重要：必ずバックアップを取ること
改造中に何か問題が起きたとき、**バックアップがなければ復旧不可能**になる場合があります。特にSony端末のTAパーティションは、バックアップなしで壊すと**修理不可能**です。
:::

### 写真やデータのバックアップ

- Google フォト / Google ドライブに同期
- PC に直接コピー
- 必要なアプリのデータも忘れずに

### TAパーティションのバックアップ（Sony端末）

Sony端末では、改造ツール (xperable) が自動的にTAバックアップを作成します。このファイル (`TA.img`) は**絶対に消さないでください**。

## 1-4. ブートローダーアンロック (BLU)

### 方法の選択

ブートローダーのアンロック方法は機種によって異なります：

| 方法 | 対応機種 | 難易度 |
|------|---------|--------|
| **公式アンロック** | Pixel、一部のXperia国際版 | 簡単 |
| **非公式ツール** | キャリア版Xperia (xperable等) | 中級 |
| **その他exploit** | 機種による | 上級 |

### 公式アンロック（Pixel等）の場合

```bash
# 1. fastbootモードに入る
adb reboot bootloader

# 2. アンロック実行
fastboot oem unlock

# 3. スマホ画面の指示に従って確認
# → ボリュームキーで選択、電源ボタンで決定
```

### xperableでのアンロック（AU版Xperia）

AU版XperiaはSonyの公式アンロックに対応していないため、xperableを使います。

```bash
# 1. xperableをダウンロード
git clone https://github.com/xperiofficial/xperable
cd xperable

# 2. スマホをS1（フラッシュ）モードにする
#    電源オフ → ボリュームDOWNを押しながらUSB接続
#    → 緑色のLEDが点灯すればOK

# 3. xperableを実行
python3 xperable.py

# 4. TAバックアップが自動作成される（TA.img）
# 5. rooting_statusが書き換えられる
# 6. 完了したらケーブルを抜いて再起動
```

:::tip S1モード（フラッシュモード）への入り方
1. スマホの電源を完全にオフ
2. **ボリュームDOWNボタンを押しながら** USBケーブルをPCに接続
3. **緑色のLED**が点灯 → S1モード成功
:::

## 1-5. アンロック後の確認

再起動すると、初回は以下のようになります：

1. 「ブートローダーがアンロックされています」という警告が数秒表示
2. 端末が**初期化（ファクトリーリセット）** される
3. 初期設定画面が表示される

:::info これは正常です
BLアンロック後に端末が初期化されるのは仕様です。だからStep 1-3でバックアップを取りました。
:::

### アンロック状態の確認

```bash
# fastbootモードで確認
adb reboot bootloader
fastboot oem device-info

# 出力に以下が含まれていればアンロック済み:
# Device unlocked: true
```

## BLアンロックで失われるもの

| 機能 | 状態 | 備考 |
|------|------|------|
| メーカー保証 | ❌ 無効 | |
| カメラDRM (Sony) | ❌ 消失 | CKB画像処理が無効化、画質低下 |
| Widevine | ⚠️ L1→L3 | Netflix等のHD/4K再生不可 |
| おサイフケータイ | ⚠️ 機種による | |
| SafetyNet/Play Integrity | ❌ 失敗 | Magiskで回避可能 |

次のステップでは、カスタムリカバリ (TWRP) の導入とMagiskでのroot化を行います。
