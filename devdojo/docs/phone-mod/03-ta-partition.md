---
sidebar_position: 3
title: TAパーティション解説
---

# TAパーティション (Trim Area)

Sony Xperia端末の核心部分。ハードウェア設定、DRMキー、シリアル番号などデバイス固有の情報を格納する2MBのパーティション。

## バイナリ構造

各ユニットは以下のフォーマットで格納される：

```
┌─────────────┬─────────────┬─────────────────┬───────────┬──────────────┐
│ unit_num    │ data_size   │ magic           │ part_id   │ data         │
│ 4 bytes LE  │ 4 bytes LE  │ 0x3BF8E9C1      │ 4 bytes   │ variable     │
└─────────────┴─────────────┴─────────────────┴───────────┴──────────────┘
```

- **アラインメント**: 4バイト境界
- **ユニット総数**: 約798個（SOV38のオリジナルTA）
- **パーティションサイズ**: 2MB

## 重要なTAユニット一覧

### 起動に必須

| ユニット | 名前 | サイズ | 内容 |
|---------|------|--------|------|
| 2003 | HW_CONF | 1166 bytes | ハードウェア設定（X.509証明書）。**デバイス固有、復元不可** |
| 2020 | CDA/CUST設定 | ~1660 bytes | CDA_NR、OP_NAME等のカスタマイゼーション情報 |
| 2227 | STARTUP_SHUTDOWNRESULT | 4 bytes | 起動/シャットダウン結果 |
| 4900 | SERIAL_NO | 10 bytes | シリアル番号 |
| 4901 | PBA_ID | 9 bytes | 基板ID |
| 4902 | PBA_ID_REV | 1 byte | 基板リビジョン |
| 4990 | (unknown) | 1 byte | 値: 0x2A |

### DRM関連

| ユニット | 内容 |
|---------|------|
| 2022-2034 | Suntory DRMブロブ |
| 2129 | DRM証明書 |
| 2130 | DRM証明書 |
| 2160 | DRM証明書 |
| 2500 | DRMデータベース（SQLite、約40KB） |

### 暗号化/書き込み制限

| ユニット | 名前 | 備考 |
|---------|------|------|
| 2010 | SIMLOCK | 暗号化済み。Read/Write で error=-22 |

## S1/XFLプロトコルでのアクセス

```
USB VID: 0x0FCE
USB PID: 0xB00B

# 読み取り
Read-TA:{partition}:{unit}
例: Read-TA:2:2020

# 書き込み
upload(data) → Write-TA:{partition}:{unit}

# 再起動
Sync
```

### sxflasherがスキップする「特殊ユニット」

:::warning
newflasher/sxflasherでファームウェアを再フラッシュすると、以下のユニットがスキップされる。つまりこれらは復元されない：

- Unit 2003 (HW_CONF)
- Unit 2010 (SIMLOCK)
- Unit 2129, 2210
- Unit 4900 (SERIAL_NO)
- Unit 66667
:::

## TAバックアップの読み解き方

Pythonでの解析例：

```python
import struct

MAGIC = 0x3BF8E9C1

def parse_ta(ta_path):
    with open(ta_path, 'rb') as f:
        data = f.read()

    units = {}
    i = 0
    while i < len(data) - 16:
        magic_val = struct.unpack_from('<I', data, i + 8)[0]
        if magic_val == MAGIC:
            unit_num = struct.unpack_from('<I', data, i)[0]
            data_size = struct.unpack_from('<I', data, i + 4)[0]
            if data_size < 0x100000:  # sanity check
                unit_data = data[i + 16 : i + 16 + data_size]
                units[unit_num] = unit_data
                i += 16 + data_size
                # 4byte alignment
                i = (i + 3) & ~3
                continue
        i += 4

    return units

# 使用例
units = parse_ta('TA.img')
print(f"Total units: {len(units)}")
print(f"Serial: {units[4900]}")  # b'CB512FUK5D'
```

## ブートログの取得

起動失敗の原因を調べるには、TAユニット2050を読む：

```python
boot_log = sud.read_ta(2050)  # 最大16384 bytes
print(boot_log.decode('ascii', errors='ignore'))
```

出力例：
```
[ERROR @ hwconf.c:202]: No hardware config found
[ERROR @ xboot_glue.c:507]: failed to setup hwconfig (-1010)
MiscTA unit 2227 could not be read!
```

→ このログから欠損しているTAユニットを特定できる。
