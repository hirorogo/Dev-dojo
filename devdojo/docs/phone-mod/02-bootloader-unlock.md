---
sidebar_position: 2
title: "Step 1: 準備とBLアンロック"
description: 必要なツールの導入からブートローダーアンロックまで
---

# Step 1: 準備とブートローダーアンロック

## ゴール

この章が終わると、SOV38のブートローダーがアンロックされた状態になります。

## 1-1. 必要なツールをインストール

### adb と fastboot

adbとfastbootは、PCからスマホを操作するためのGoogle公式ツールです。

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

### Python 3

xperableやsxflasherなど、Sony端末用ツールの実行に必要です。

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
改造中に何か問題が起きたとき、**バックアップがなければ復旧不可能**になります。特にSOV38の**TAパーティション**は、バックアップなしで壊すと**修理不可能**です（詳細は[TAパーティション解説](/docs/phone-mod/magisk-root)）。
:::

### 写真やデータのバックアップ

BLアンロック後に端末が初期化されるため、**必ず先に**バックアップしてください。

- Google フォト / Google ドライブに同期
- PCに直接コピー
- LINEのトーク履歴もバックアップを忘れずに

### TAパーティションのバックアップ

次のステップで使う xperable が**自動的にTAバックアップ (TA.img)** を作成します。このファイルは**絶対に消さないでください**。複数の場所にコピーを保存しておくことを強く推奨します。

## 1-4. ブートローダーアンロック (BLU)

SOV38はSonyの公式アンロックに対応していないため、**xperable**を使って非公式にアンロックします。

### xperable とは

[xperable](https://github.com/xperiofficial/xperable) は、国内キャリア版Xperiaのブートローダーをアンロックするツールです。S1モードでデバイスに接続し、TAパーティションの `rooting_status` を書き換えます。

### 手順

#### ① xperableをダウンロード

```bash
git clone https://github.com/xperiofficial/xperable
cd xperable
```

#### ② SOV38をS1モードにする

1. SOV38の電源を**完全にオフ**にする
2. **ボリュームDOWNボタンを押しながら** USBケーブルをPCに接続
3. **緑色のLED**が点灯すれば成功

:::tip うまくいかない場合
- ケーブルを抜き、10秒待ってから再試行
- 別のUSBケーブルやポートを試す
- Windowsの場合はUSBドライバがインストールされているか確認
:::

#### ③ xperableを実行

```bash
python3 xperable.py
```

実行すると以下のことが自動的に行われます：

1. **TA.img のバックアップが作成される**（カレントディレクトリに保存）
2. TAパーティションの `rooting_status` が `2`（アンロック済み）に書き換えられる
3. 完了メッセージが表示される

#### ④ 再起動

ケーブルを抜いて、電源ボタンで起動します。

## 1-5. アンロック後の確認

再起動すると、初回は以下のようになります：

1. 「**ブートローダーがアンロックされています**」という警告が数秒表示される
2. 端末が**初期化（ファクトリーリセット）** される
3. 初期設定画面が表示される

:::info これは正常です
BLアンロック後に端末が初期化されるのは仕様です。だからStep 1-3でバックアップを取りました。初期設定を済ませて、再度USBデバッグを有効にしてください。
:::

### アンロック状態の確認

初期設定後、USBデバッグを再度有効にしてPCと接続：

```bash
# 正規fastbootモード（青LED）に入る
adb reboot bootloader

# アンロック状態を確認
fastboot oem device-info

# 出力に以下が含まれていればアンロック済み:
# Device unlocked: true

# Androidに戻る
fastboot reboot
```

## BLアンロックで失われるもの

SOV38のBLアンロック後、以下の機能が影響を受けます：

| 機能 | 状態 | 詳細 |
|------|------|------|
| メーカー保証 | ❌ 無効 | au/Sonyの保証対象外に |
| カメラDRM (Suntory/CKB) | ❌ 消失 | Sony独自の画像処理が無効化。カメラは使えるが画質が低下 |
| Widevine | ⚠️ L1→L3 | Netflix等のHD/4K再生不可。SD画質のみ |
| おサイフケータイ | ⚠️ 要確認 | FeliCaが動作しなくなる場合がある |
| SafetyNet / Play Integrity | ❌ 失敗 | 銀行アプリ等が動作しない（Magiskで回避可能） |

:::info カメラDRMについて
BLアンロックでSuntory DRMのブロブデータが不可逆的に消去されます。セキュリティデーモン (secd) がアンロック状態を検知し、CKBカメラエンジンの初期化をスキップするようになります。詳しくは[DRM/カメラ解析](/docs/phone-mod/drm-analysis)を参照。
:::

次のステップでは、TWRP導入とMagiskでのroot化を行います。
