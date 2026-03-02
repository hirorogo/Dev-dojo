---
sidebar_position: 6
title: DRM/カメラ解析
---

# Sony Suntory DRM とカメラ (CKB) 解析

ブートローダーアンロック後にカメラが動作しなくなる原因と、その解析過程。

## 症状

カメラアプリを開くと画面が真っ黒。logcatに以下のエラー：

```
campf: DeviceType = 14 is not ready. errCode(131332)
campf: Ckb start fail
campf: Ckb apply fail
CameraApp: Error caused by evicted:false deviceError:false otherError:false
```

すべてのフレームが処理できずドロップされる。

## 原因の概要

```
BLアンロック (rooting_status=2)
    ↓
secd が rooting_status を確認
    ↓
「unlocked, use limited functionality」
    ↓
Suntory_ConvertAllBlobs をスキップ
    ↓
CKBエンジンが初期化されない
    ↓
カメラフレーム処理不可
```

## 登場するコンポーネント

### secd (Security Daemon)

パス: `/vendor/bin/hw/vendor.semc.hardware.secd@1.0-service`

Sony独自のセキュリティデーモン。起動時にTAパーティションから `rooting_status` を読み取り、ブートローダーのロック状態に応じてDRM機能の初期化を制御する。

### Suntory DRMエンジン

Sony独自のDRM基盤。TAパーティションのブロブユニット (2022-2034) に暗号化されたキーデータを保持し、`Suntory_ConvertAllBlobs` で活性化する。

### CKB (Camera Kernel Block)

Sony独自の画像処理エンジン。IMX400/IMX379のRAWデータをSuntoryの暗号化パイプラインで処理する。Suntoryが初期化されていないと動作しない。

## secd バイナリの解析

### 基本情報

```
フォーマット: ELF 64-bit LSB ARM64 (aarch64)
サイズ: 269000 bytes
.text: 0x5c48 - 0x17bb8
.rodata: 0x17bb8 以降
```

### 重要な文字列

```
0x18308: "do_backend_devsec_get_rooting_status failed"
0x18334: "the bootloader is unlocked, use limited functionality"
0x1836a: "the bootloader is OK, try to init suntory"
0x183f0: "suntory initialized"
```

### 分岐ロジック（ARM64逆アセンブル）

secd起動時の処理フロー：

```asm
0x0878c: BL  0xff30              ; do_backend_devsec_get_rooting_status() 呼出
0x08790: CBZ w0, 0x87ac          ; 戻り値==0 (成功) → ステータス確認へ
0x08794: ...                     ; 失敗時: ログ出力して別パスへ

; ---- ステータス確認 ----
0x087ac: LDR w8, [sp, #8]        ; rooting_status の値をロード
0x087b0: CMP w8, #5              ; status == 5 ?
0x087b4: B.EQ 0x87c0             ; → 「unlocked」パスへ
0x087b8: CMP w8, #2              ; status == 2 ?
0x087bc: B.NE 0x87d4             ; status != 2 → 「OK」パスへ ★パッチ対象

; ---- unlocked パス ----
0x087c0: ADRP+ADD "the bootloader is unlocked, use limited functionality"
0x087d0: B forward               ; Suntory初期化をスキップ

; ---- OK パス ----
0x087d4: ADRP+ADD "the bootloader is OK, try to init suntory"
0x087e8: BL  0x55a8              ; ログ出力
0x087ec: BL  0x141bc             ; Suntory_ConvertAllBlobs() 呼出 ★DRM初期化
```

### 分岐の図解

```
              do_backend_devsec_get_rooting_status()
                          |
                     成功? (w0==0)
                    /          \
                  Yes           No → "failed" ログ
                  |
            status値を確認
                  |
          status == 5? ──Yes──→ "unlocked, limited"
                  |                    (Suntoryスキップ)
                  No
                  |
          status == 2? ──Yes──→ "unlocked, limited"
                  |                    (Suntoryスキップ)
                  No
                  |
                  ↓
        "bootloader is OK" → Suntory_ConvertAllBlobs()
                                     ↓
                              "suntory initialized"
                                     ↓
                                CKBカメラ動作 ✅
```

## パッチの設計

### 目標

`rooting_status` が2（アンロック済み）でも「OK」パスに進むようにする。

### パッチ内容

| アドレス | 元の命令 | 元のバイト | パッチ後 | パッチバイト |
|---------|---------|-----------|---------|------------|
| 0x87b4 | `B.EQ 0x87c0` | `60 00 00 54` | `NOP` | `1f 20 03 d5` |
| 0x87bc | `B.NE 0x87d4` | `c1 00 00 54` | `B 0x87d4` | `06 00 00 14` |

### ARM64 命令エンコーディング

```
NOP = 0xD503201F
  → リトルエンディアン: 1F 20 03 D5

B (unconditional branch):
  オフセット = (0x87d4 - 0x87bc) / 4 = 6
  B #6 = 0x14000006
  → リトルエンディアン: 06 00 00 14
```

### パッチ適用

```bash
# バイナリコピー
cp secd_backup secd_patched

# パッチ1: B.EQ → NOP
printf '\x1f\x20\x03\xd5' | dd of=secd_patched bs=1 seek=$((0x87b4)) conv=notrunc

# パッチ2: B.NE → B (無条件分岐)
printf '\x06\x00\x00\x14' | dd of=secd_patched bs=1 seek=$((0x87bc)) conv=notrunc

# 検証
xxd -s 0x87b0 -l 16 secd_patched
# 期待: 1f15 0071 1f20 03d5 1f09 0071 0600 0014
```

## パッチ適用後のログ

パッチ適用後、secdは「OK」パスを通るようになった：

```
libsuntory_static: process miscTA unit 2024
libsuntory_static: invalid blob size 0     ← ブロブデータが空
...（unit 2024-2034 全て同様）...
secd@1.0-service: suntory initialized      ← ✅ Suntory初期化成功！
secd@1.0-service: credmgr initialized
```

## 残存する問題: Suntoryブロブの欠損

パッチによりSuntory初期化パスには進んだが、TAユニット2024-2034のブロブデータが全て空（0x00、1バイト）のため、`Suntory_ConvertAllBlobs` が実質的に何もできない。

```
Suntory_GetAllBlobStatus failed
```

### なぜブロブが空なのか

- BLアンロック時にSuntoryブロブが消去（ゼロ化）された
- オリジナルTAバックアップの時点で既に空だった（xperableのバックアップはBLアンロック後に作成される可能性）
- `Suntory_ConvertAllBlobs` は元のブロブデータを変換する処理のため、元データがなければ変換できない

### 結論

:::info カメラ修復の限界
secdのバイナリパッチだけではカメラは復活しない。Suntoryブロブデータ自体がBLアンロック時に不可逆的に消去されるため、ソフトウェアパッチでは対処できない。

カメラを使いたい場合の選択肢：
1. **BLリロック** — TAのrooting_statusを0に戻す（リスクあり）
2. **サードパーティカメラアプリ** — CKBを使わないカメラアプリ（画質低下）
3. **カスタムROM** — CKBに依存しないカメラHALを使うROM
:::
