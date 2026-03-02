---
sidebar_position: 4
title: 文鎮からの復旧
---

# 文鎮（ブリック）からの復旧

CDA_NR変更による完全文鎮から、Android起動までの復旧プロセス。

## 復旧の前提条件

- xperableが作成した **TA.imgバックアップ** があること
- macOS/Linux + Python3 + libusb
- sxflasherツール（Sony S1通信用）
- 対象のストックファームウェア（.sinファイル）

:::danger TAバックアップがない場合
HW_CONF (unit 2003) はデバイス固有のX.509証明書データ。ファームウェアにも含まれず、別の個体からのコピーも不可。**バックアップなし = 復旧不可能**。
:::

## Step 1: ストックファームウェアの再フラッシュ

```bash
# newflasherでファームウェアを再フラッシュ
cd firmware/
./newflasher
```

全 .sin ファイル（boot, system, vendor, oem, modem等）をフラッシュ。計3回実行。

**結果**: ファームウェアは正常に書き込まれたが、TAの問題で起動しなかった。

## Step 2: CDA_NR の復元

### 調査

TAユニット2020にCDA設定が格納されていることを発見。newflasherのフラッシュ後、CDA_NRが `"XXXX"` （プレースホルダ）になっていた。

### 最初の修正（部分的成功）

```python
# unit 2020 を読み取り、CDA_NR="XXXX" → "1314-0765" にパッチ
current = sud.read_ta(2020)  # 1623 bytes
# XXXX(4bytes) → 1314-0765(9bytes) でサイズ変更
ret = sud.write_ta([2, 2020], fixed_data)
```

**結果**: デバイスが初めて **fastboot モード** に到達！しかしAndroid起動はまだできない。

### クリーン修正（設定ブロック全体）

部分パッチではOP_IDやOP_NAMEが不正だったため、設定ブロック全体を正しい値で書き換え：

```
Config 1: FOP_ID="6565";OP_NAME="KDDI JP";CDA_NR="1314-0765";ROOTING_ALLOWED="0";
Config 2: CSERVERID="bmcsecs01";AUTHCERT="UNKNOWN";TIMESTAMP="180723 15:46:26"
```

**結果**: ブートループ（緑→赤LED繰り返し）に変化 — 進展あり。

## Step 3: ブートログ解析

TAユニット2050から16384バイトのブートログを取得：

```
[ERROR @ hwconf.c:202]: No hardware config found
[ERROR @ xboot_glue.c:507]: failed to setup hwconfig (-1010)
MiscTA unit 2227 could not be read!
MiscTA unit 4990 could not be read!
Failed to read serial number from MiscTA
androidboot.serialno=INVALID
Booting Into Xperia Service
```

**根本原因の発見**: sxflasherがファームウェア再フラッシュ時に「特殊ユニット」をスキップしていた。HW_CONF (2003)、SERIAL_NO (4900) 等の重要ユニットが消失。

## Step 4: 重要TAユニットの復元（最終修正）

オリジナルのTA.imgバックアップから6つの重要ユニットを抽出し、デバイスに書き込み：

```python
target_units = [2003, 2227, 4990, 4900, 4901, 4902]

# バックアップからユニットを抽出
units = extract_units_from_ta('TA_original.img', target_units)

# デバイスに書き込み
for unit_num, data in units.items():
    sud.upload(data)
    sud.command(f'Write-TA:2:{unit_num}')
    # 検証読み取り
    verify = sud.read_ta(unit_num)
    assert verify == data, f"Unit {unit_num} verification failed!"
```

### 実行結果

```
✓ Write-TA:2:2003 SUCCEEDED + VERIFIED (exact match)
✓ Write-TA:2:2227 SUCCEEDED + VERIFIED (exact match)
✓ Write-TA:2:4990 SUCCEEDED + VERIFIED (exact match)
✓ Write-TA:2:4900 SUCCEEDED + VERIFIED (exact match)
✓ Write-TA:2:4901 SUCCEEDED + VERIFIED (exact match)
✓ Write-TA:2:4902 SUCCEEDED + VERIFIED (exact match)
✓ CDA_NR='1314-0765' still correct
```

**🎉 デバイスがAndroidを正常に起動！復旧完了。**

## 試したが失敗したアプローチ

| 試行 | 結果 | 理由 |
|------|------|------|
| `fastboot flash TA TA.img` | Command not authenticated | Sony fastboot の制限 |
| `fastboot boot twrp.img` | Command not supported | S1 fastboot では使えない |
| Development bootloader フラッシュ | Failed to verify cms | 署名検証失敗 |
| TA unit 2010 (SIMLOCK) の読み取り | error=-22 | 暗号化済みユニット |

## 補足: Global化の正しい方法（TAを変更しない）

:::tip 文鎮化を回避できた方法
今回の文鎮化はCDA_NRを直接TAパーティションで書き換えたことが原因でした。実は、**TAを一切変更せずに**Global化する方法があります。（[j4nn/xperable Issue #2](https://github.com/j4nn/xperable/issues/2) のcuynu氏の情報）

**手順:**
1. [XperiFirm](https://xdaforums.com/t/tool-xperifirm-xperia-firmware-downloader-v5-7-0.2834142/) で **H8116** (シングルSIM版) のGlobalファームウェアをダウンロード
2. ダウンロードしたファームウェアフォルダ内の **`*.ta` ファイルを全て削除**
3. `newflasher` でフラッシュ

```bash
# .taファイルを削除してからフラッシュ
cd firmware_H8116_global/
rm -f *.ta
./newflasher
```

TAファイルを削除することで、newflasherがTAパーティションを上書きしません。ファームウェア(system/vendor/boot等)だけがGlobal版に置き換わり、TAの整合性は保たれます。

**注意:**
- docomo版 (SO-04K) はGlobal化不可（ハードウェアレベルの制限）
- AU版 (SOV38) / SoftBank版は可能
- この方法ならCDA_NRの不整合による文鎮化のリスクはゼロ
:::

## Sony fastboot の2つのモード

:::info
Sony端末には2種類のfastbootモードがある：

| モード | 入り方 | `fastboot boot` | 用途 |
|--------|--------|-----------------|------|
| **正規fastboot** | `adb reboot bootloader` | ✅ 使える | TWRP起動、boot書き換え等 |
| **S1/XFL fastboot** | クラッシュ/電源ボタン長押し | ❌ Command not supported | ファームウェアフラッシュのみ |

S1モードで `fastboot boot` を試しても "Command not supported" となる。正規fastbootに入るにはAndroidが起動している必要がある。
:::
