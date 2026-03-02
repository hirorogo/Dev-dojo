---
sidebar_position: 5
title: Magiskでroot化
---

# Magiskによるroot化

復旧後のデバイスにMagisk v30.6をインストールしてroot権限を取得する。

## 手順

### 1. 現在のboot imageをバックアップ

```bash
# TWRP経由でbootパーティションをバックアップ
adb reboot bootloader
fastboot boot twrp-aurora.img

# TWRPが起動したらbootをバックアップ
adb shell "dd if=/dev/block/by-name/boot_a of=/sdcard/Download/boot_a_current.img"
adb pull /sdcard/Download/boot_a_current.img ./backup/
```

### 2. Magisk APKをインストール

```bash
# Magisk APKをダウンロード・インストール
adb install Magisk-v30.6.apk
```

### 3. boot imageをパッチ

```bash
# boot imageをデバイスに送る
adb push boot_a_current.img /sdcard/Download/

# Magiskアプリを開き：
# 「インストール」→「パッチするファイルを選択」→ boot_a_current.img を選択
# → magisk_patched-xxxxx.img が /sdcard/Download/ に生成される

# パッチ済みイメージを取得
adb pull /sdcard/Download/magisk_patched-30600_XXXXX.img ./backup/
```

### 4. パッチ済みboot imageをフラッシュ

```bash
adb reboot bootloader
fastboot flash boot_a magisk_patched-30600_XXXXX.img
fastboot reboot
```

### 5. root確認

```bash
adb shell "su -c 'id'"
# uid=0(root) gid=0(root) groups=0(root) ...
```

## Magiskで出来ること

- `su` によるroot shell
- `resetprop` でシステムプロパティの変更
- Magiskモジュールによるシステムファイルのオーバーレイ（Magic Mount）
- Zygiskによるアプリレベルのフック

## 注意: dm-verity

Magiskのboot imageパッチはdm-verityを無効化するが、`/vendor` パーティションのdm-verityは完全には無効化されないことがある。

```bash
# /vendor を rw でリマウント（一時的には成功する）
su -c 'mount -o rw,remount /vendor'

# しかしリブート後、変更はdm-verityにより元に戻される
```

`/vendor` への永続的な変更にはMagiskモジュールを使う必要がある。

## Magiskモジュールの作成

Magiskモジュールでシステムファイルを置換する基本構造：

```
module_name/
├── module.prop          # モジュールメタデータ
├── system/
│   └── vendor/
│       └── bin/
│           └── hw/
│               └── target_binary   # 置換対象
├── customize.sh         # インストール時スクリプト（SELinux設定等）
├── post-fs-data.sh      # マウント後・サービス起動前に実行
└── service.sh           # ブート完了後に実行
```

### module.prop の例

```properties
id=my_module
name=My Module
version=v1.0
versionCode=1
author=hiro
description=Description here
```

### インストール

```bash
adb push module.zip /sdcard/Download/
adb shell "su -c 'magisk --install-module /sdcard/Download/module.zip'"
adb reboot
```

### SELinuxコンテキスト

:::warning
vendor HALバイナリを置換する場合、SELinuxコンテキストを正しく設定しないとbootloopになる：

```bash
# 元のコンテキストを確認
ls -laZ /vendor/bin/hw/target_binary
# → u:object_r:hal_xxx_default_exec:s0

# customize.sh で設定
set_perm $MODPATH/system/vendor/bin/hw/target_binary 0 2000 0755 \
    "u:object_r:hal_xxx_default_exec:s0"
```
:::

### bootloop した場合の復旧

電源ボタン長押しで強制シャットダウン → 起動時にXPERIAロゴが出たら **ボリュームDOWN長押し** → Magiskセーフモード（全モジュール無効）で起動。

```bash
# セーフモード起動後にモジュールを削除
adb shell "su -c 'rm -rf /data/adb/modules/module_id'"
adb reboot
```
