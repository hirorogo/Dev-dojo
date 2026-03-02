---
sidebar_position: 7
title: ツール・リファレンス
---

# ツール・リファレンス

今回の改造で使用したツール・スクリプトの一覧。

## フラッシュツール

### newflasher

Sony端末のファームウェアフラッシュツール。S1/XFLモードで .sin ファイルを書き込む。

- **GitHub**: https://github.com/munjeni/newflasher
- **用途**: ストックファームウェアの再フラッシュ
- **注意**: 内部で使われるsxflasherが「特殊ユニット」をスキップする

### sxflasher / somcusb

Sony Xperia向けのコマンドラインツール群。USB経由でS1プロトコルを使った通信を行う。

- **somcusb.py**: USB通信ライブラリ
- **somcta.py**: TAユニット定義

### xperable

ブートローダーアンロックツール。TAパーティションの `rooting_status` を書き換える。CVE-2021-1931 (ABL fastboot脆弱性) を利用。

- **GitHub**: https://github.com/hirorogo/xperable
- **重要**: 実行前にTA.imgのバックアップを自動作成する
- **DRM保存**: xperableでアンロックするとDRMキーが消去されない（Sony公式アンロックとの違い）

### SOV38 Helper Toolkit

xperableフォークに同梱のPythonラッパー。ガイド付きでBLU・バックアップ・Magisk導入を実行。

- **ファイル**: `sov38_helper.py`（xperableリポジトリに同梱）
- **自動リトライ**: エクスプロイト失敗時に自動リトライ（最大20回/サイズ × 10サイズ）
- **バッファサイズ最適化**: USBチャンクサイズを自動探索
- **詳細**: [SOV38 Helper Toolkit](/docs/phone-mod/helper-toolkit) ページ参照

```bash
python3 sov38_helper.py             # インタラクティブメニュー
python3 sov38_helper.py --unlock    # BLアンロック（リトライ付き）
```

## リカバリ

### TWRP (Team Win Recovery Project)

カスタムリカバリ。root shellアクセス、パーティションのバックアップ/リストア等が可能。

```bash
# 正規fastbootモードから一時起動（フラッシュではなくRAMブート）
adb reboot bootloader
fastboot boot twrp-aurora.img
```

:::warning TWRPの注意点
- SOV38ではTWRPの画面が映らない場合がある（青LED点灯のみ）。ADBは使える
- `/system` をマウントするとシンボリックループが発生し、adb shellが使えなくなることがある
- その場合はすべて `adb push/pull` で作業する
:::

## root

### Magisk v30.6

systemless rootツール。boot imageをパッチしてroot権限を取得する。

```bash
# インストール手順
adb install Magisk-v30.6.apk
adb push boot_a.img /sdcard/Download/
# Magiskアプリでパッチ → fastbootでフラッシュ

# root確認
adb shell "su -c 'id'"

# モジュールインストール（CLI）
adb shell "su -c 'magisk --install-module /sdcard/Download/module.zip'"
```

### resetprop

Magisk付属のプロパティ操作ツール。`ro.*` を含む読み取り専用プロパティも変更可能。

```bash
su -c 'resetprop ro.boot.verifiedbootstate green'
su -c 'resetprop ro.boot.flash.locked 1'
```

:::info
resetpropはシステムプロパティのみを変更する。secd等がTAパーティションから直接読み取る値には効果がない。
:::

## 解析ツール

### xxd

バイナリダンプツール。パッチの検証に使用。

```bash
# 特定オフセットのバイトを表示
xxd -s 0x87b0 -l 16 secd_binary

# 出力例
# 000087b0: 1f15 0071 6000 0054 1f09 0071 c100 0054
```

### dd

バイナリパッチ適用。`conv=notrunc` で既存ファイルの特定位置を上書き。

```bash
printf '\x1f\x20\x03\xd5' | dd of=target bs=1 seek=$((0x87b4)) conv=notrunc
```

### logcat

Androidシステムログの閲覧。DRM/カメラの問題特定に必須。

```bash
# タグでフィルタ
adb logcat -s secd@1.0-service

# 正規表現でフィルタ
adb logcat -d | grep -iE "suntory|ckb|camera.*fail"

# ログクリア
adb logcat -c
```

## 自作スクリプト

| スクリプト | 用途 |
|-----------|------|
| `restore_ta_cda.py` | CDA_NR の調査・最初の修復試行 |
| `fix_cda_unit2020.py` | CDA_NR パッチ（部分修正） |
| `fix_cda_clean.py` | CDA 設定ブロック全体の復元 |
| `restore_critical_ta_units.py` | 6つの重要TAユニットの復元（**最終修正**） |

## 参考リンク

- [XDA: Going Global - XZ2 Premium](https://xdaforums.com/t/going-global-with-your-japan-variant-xz2-premium-single-sim-only-au-softbank.4654973/)
- [XDA: sxflasher](https://xdaforums.com/t/tool-sxflasher-sony-xperia-command-line-tools.4675857/)
- [XDA: xperable exploit thread (Tama)](https://xdaforums.com/t/xz2-xz2c-xz2p-xz3-xperable-xperia-abl-fastboot-exploit-cve-2021-1931.4771932/)
- [XDA: Widevine L1 Fix (KmInstallKeybox)](https://xdaforums.com/t/fix-widevine-l1-unlocked-bootloader.4731374/)
- [GitHub: newflasher](https://github.com/munjeni/newflasher)
- [GitHub: xperable (hirorogo fork)](https://github.com/hirorogo/xperable)
- [GitHub: Sony-DRM-Fix-Magisk](https://github.com/the-brad/Sony-DRM-Fix-Magisk)
- [j4nn.github.io](https://j4nn.github.io/) — xperable/reno開発者ツール
