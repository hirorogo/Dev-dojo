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

:::tip この方法を使えば文鎮化は避けられた
今回の文鎮化はCDA_NRを直接TAパーティションで書き換えたことが原因でした。実は、**TAを一切変更せずに**Global化する方法があります。（[j4nn/xperable Issue #2](https://github.com/j4nn/xperable/issues/2) のcuynu氏の情報）
:::

### なぜGlobal化するのか

国内キャリア版（AU/docomo/SoftBank）のブートローダーは、Global版と挙動が違うことがある。実際にAU版P118ブートローダーではxperableのデフォルトサイズ `0x400f90` でオーバーフローが発生せず、サイズ修正やhitcodeパッチが必要だった。

一方、**Global版P118ブートローダーならxperableがデフォルト設定のまま動く**。先にGlobal化してからBLアンロックすれば、余計なパッチは一切不要。

### 対応端末

| キャリア | 型番 | Global化 |
|---------|------|----------|
| AU | SOV38 | ✅ 可能 |
| SoftBank | — | ✅ 可能 |
| docomo | SO-04K | ❌ **不可**（ハードウェア制限） |

### 必要なもの

- **XperiFirm** — Sony公式サーバーからファームウェアをダウンロードするツール（[XDA](https://xdaforums.com/t/tool-xperifirm-xperia-firmware-downloader-v5-7-0.2834142/)）
- **newflasher** — ファームウェアをフラッシュするツール
- **USBケーブル**

### 手順

#### 1. Globalファームウェアをダウンロード

XperiFirmを起動し、**H8116**（XZ2 PremiumのシングルSIMモデル）を選択。リージョンはどこでもOK（Customized GLが無難）。

:::warning H8166 ではなく H8116 を選ぶこと
- **H8116** = シングルSIM版（Global）← これを選ぶ
- **H8166** = デュアルSIM版
- SOV38はシングルSIMなので H8116 を使う
:::

#### 2. TAファイルを削除

ダウンロードしたフォルダの中に `.ta` ファイルがいくつか入っている。**これを全部削除する**。

```bash
cd firmware_H8116_global/
ls *.ta          # TAファイルがあることを確認
rm -f *.ta       # 全て削除
ls *.ta          # 何も表示されなければOK
```

TAファイルを消す理由：newflasherはフォルダ内の `.ta` ファイルがあるとTAパーティションを上書きしてしまう。消しておけばファームウェア（system/vendor/boot/ブートローダー等）だけが書き換わり、**TAパーティションはそのまま残る**。

#### 3. S1モードでフラッシュ

```bash
# 端末をS1モードにする（電源OFF → ボリュームDOWN押しながらUSB接続 → 緑LED）
./newflasher
```

newflasherの質問には基本的にデフォルトで回答すればOK。

#### ブートローダーもGlobal版になる？ → なる

「ファーム焼いてもブートローダーはAU版のままなんじゃ？」と思うかもしれないが、newflasherはフォルダ内の**全 `.sin` ファイル**をフラッシュする。ブートローダーも `.sin` に含まれているので、Global版に置き換わる。

```
Global FWフラッシュで書き換わるもの:
├── boot.sin          → カーネル
├── system.sin        → Android OS
├── vendor.sin        → ドライバ等
├── oem.sin           → OEMデータ
├── modem.sin         → モデム
└── abl.sin 等        → ★ ブートローダーもGlobal版になる

書き換わらないもの（.taを削除したため）:
└── TAパーティション   → CDA_NR、DRMキー等はAU版のまま残る
```

これがこの方法のポイント。ブートローダーはGlobal版になるからxperableがデフォルト設定で通るようになり、TAは元のまま残るから文鎮化のリスクがない。

:::tip BLロック状態でもフラッシュできる
「BLアンロック前にファーム焼けるの？」と思うかもしれないが、S1モードでのファームウェアフラッシュはBLの状態に関係なく動く。S1フラッシュとfastbootのBLアンロックは全く別の仕組み。**BLロックのまま先にGlobalファームを入れて、その後xperableでBLアンロック**という順番が可能。
:::

#### 4. 起動確認

フラッシュ完了後、端末が自動で再起動するので、Androidが正常に起動することを確認。

### おすすめの作業順序

今から国内版XZ2 Premiumを改造するなら、この順番が最短：

```
1. TAバックアップを取る（万が一に備えて）
2. Global FWをフラッシュ（上の手順）
3. xperableをデフォルト設定で実行 → BLアンロック
4. Magisk root化
```

TAを触る必要は一切ないし、xperableのサイズ修正やhitcodeパッチも不要。

## Sony fastboot の2つのモード

:::info
Sony端末には2種類のfastbootモードがある：

| モード | 入り方 | `fastboot boot` | 用途 |
|--------|--------|-----------------|------|
| **正規fastboot** | `adb reboot bootloader` | ✅ 使える | TWRP起動、boot書き換え等 |
| **S1/XFL fastboot** | クラッシュ/電源ボタン長押し | ❌ Command not supported | ファームウェアフラッシュのみ |

S1モードで `fastboot boot` を試しても "Command not supported" となる。正規fastbootに入るにはAndroidが起動している必要がある。
:::
