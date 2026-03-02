---
sidebar_position: 8
title: 教訓とまとめ
---

# 教訓とまとめ

## 最も重要な教訓

### 1. TAバックアップは絶対に取れ

TAパーティションにはデバイス固有のデータ（HW_CONF、シリアル番号、DRMキー）が含まれる。これらはファームウェアにも含まれず、他の個体からのコピーも不可能。

> **TAバックアップなし = 文鎮化時に復旧不可能**

xperableは自動でバックアップを取るが、手動でも必ず複数のコピーを異なる場所に保存すること。

### 2. CDA_NRの部分変更は危険 → そもそもTA変更不要だった

TA内の1箇所だけCDA_NRを変更すると、20箇所以上ある他のCDA_NR参照と整合性が崩れて文鎮化する。

:::warning 後から判明した事実
**Global化にTAの変更は不要。** XperiFirmでH8116 Globalファームウェアをダウンロードし、`*.ta`ファイルを削除してからnewflasherでフラッシュすれば、TAを一切触らずにGlobal化できる。（cuynu氏の情報: [Issue #2](https://github.com/j4nn/xperable/issues/2)）
:::

### 3. ファームウェア再フラッシュは万能ではない

newflasher/sxflasherは「特殊ユニット」をスキップするため、消失したTAユニットは復元されない。ブートログ（unit 2050）を読んで問題を特定する必要がある。

### 4. BLアンロックのDRM消失は不可逆

BLアンロックにより消去されるSuntory DRMブロブは、ソフトウェアパッチでは復元できない。セキュリティデーモンの分岐をバイパスしても、元のキーデータ自体がなければ意味がない。

### 5. dm-verityは/vendorの変更を元に戻す

`mount -o rw,remount /vendor` で一時的に書き込みできても、再起動するとdm-verityが検証し元に戻される。永続化にはMagiskモジュールが必要。

### 6. Magiskモジュールは慎重に

vendor HALバイナリの置換はSELinuxコンテキストの不一致でbootloopを引き起こす。service.sh方式（起動後にbind mount）の方が安全。

## Sony端末改造のブート順序

```
S1/XFL (Flash Mode)
    ↓
Bootloader / XBoot
    ↓  ← HW_CONF (unit 2003) が必要
UEFI
    ↓
Linux Kernel
    ↓  ← dm-verity 検証
Android Init
    ↓  ← Magisk (post-fs-data)
    ↓  ← secd 起動 → rooting_status 確認
System Ready
    ↓  ← Magisk (service.sh)
    ↓  ← カメラ利用可能（Suntoryが初期化されていれば）
```

## 復旧に要した時間と試行

| フェーズ | 試行回数 | 結果 |
|---------|---------|------|
| ファームウェア再フラッシュ | 3回 | 起動せず |
| CDA_NR部分パッチ | 2回 | fastboot到達 |
| CDA設定ブロック全書き換え | 1回 | ブートループ |
| ブートログ解析 | 1回 | 根本原因特定 |
| 重要TAユニット復元 | 1回 | **復旧成功** |
| DRMパッチ試行 | 3回 | Suntory初期化成功、ブロブ欠損で実効なし |

## 改造後の端末状態

| 機能 | 状態 | 備考 |
|------|------|------|
| Android起動 | ✅ 正常 | |
| 通話・通信 | ✅ 正常 | |
| root (Magisk) | ✅ 動作 | su -c 'id' = uid=0 |
| カメラ | ❌ 動作せず | CKB/Suntory DRM消失 |
| Bluetooth | ⚠️ 不安定 | 繰り返し停止（pm disable で無効化中） |
| Widevine | ❌ L3に低下 | HD動画再生不可 |
| NFC | ✅ 未確認 | |

## 後からわかったこと

作業完了後にGitHub Issue（[j4nn/xperable #2](https://github.com/j4nn/xperable/issues/2)）でcuynu氏から重要な情報を得た。

### 先にGlobalファームを焼けばよかった

AU版のP118ブートローダーはUSBバッファが大きく、xperableのデフォルトサイズ `0x400f90` ではオーバーフローが起きない。そのためサイズ修正（`0x430f90`）やhitcodeパッチが必要だった。

しかし**Global版P118ブートローダーならデフォルトサイズで普通に動く**（cuynu氏が別のAU版XZ2 Premiumで3回で成功）。

つまり正しい順番は：

```
1. XperiFirmでH8116 Globalファームウェアをダウンロード
2. *.ta ファイルを削除
3. newflasherでフラッシュ（ブートローダーもGlobal版になる）
4. xperableをデフォルト設定で実行 → そのまま成功
```

この順番なら、サイズ修正もhitcodeパッチもTA変更も全部不要で、文鎮化も起きなかった。

### docomo版 (SO-04K) だけはGlobal化不可

ハードウェアレベルの制限があり、Global版ファームウェアをフラッシュできない。AU版・SoftBank版は問題なくGlobal化できる。

### 今回の作業は無駄だったのか？

- サイズ修正・hitcodeパッチの[PR](https://github.com/j4nn/xperable/pull/3)は、**AU版ブートローダーのまま使いたい人には有効**
- TA復旧の手順やツールは、**同じミスをした人の救済手段**として残る
- 文鎮化したからこそ復旧方法を確立できた面もある

:::info まとめ
**「Global FWを先に焼く → xperableデフォルトで動く → TA変更不要」**が最短ルートだった。これから同じ端末で作業する人は、まずGlobal化してからBLアンロックに進むことを強く推奨する。
:::

## 今後の可能性

- **カスタムROM**: CKBに依存しないカメラHALを使うROMを探す
- **BLリロック**: rooting_statusを0に戻す（リスクあり、要調査）
- **Open Camera等**: CKBを使わないカメラアプリの検討
- **Bluetoothの修正**: SELinux/パーミッション問題の根本対処
