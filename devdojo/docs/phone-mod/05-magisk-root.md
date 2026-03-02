---
sidebar_position: 5
title: "[Deep Dive] TAパーティション"
description: Sony端末のTAパーティションの構造と解析方法
---

# TAパーティション (Trim Area) 解説

:::info これは技術的な深掘りドキュメントです
Step 1〜2の手順を行うだけなら、このページは読まなくてOKです。TAの仕組みを理解したい人向け。
:::

Sony Xperia端末の核心部分。ハードウェア設定、DRMキー、シリアル番号などデバイス固有の情報を格納する **2MB** のパーティション。

## バイナリ構造

各ユニットは以下のフォーマットで格納される：

```
┌─────────────┬─────────────┬─────────────────┬───────────┬──────────────┐
│ unit_num    │ data_size   │ magic           │ part_id   │ data         │
│ 4 bytes LE  │ 4 bytes LE  │ 0x3BF8E9C1      │ 4 bytes   │ variable     │
└─────────────┴─────────────┴─────────────────┴───────────┴──────────────┘
```

- **エンディアン**: リトルエンディアン
- **アラインメント**: 4バイト境界
- **ユニット総数**: 約798個（SOV38のオリジナルTA）
- **パーティションサイズ**: 2MB

## 重要なTAユニット一覧

### 起動に必須

| ユニット | 名前 | サイズ | 内容 |
|---------|------|--------|------|
| 2003 | HW_CONF | 1166B | ハードウェア設定（X.509証明書）。**デバイス固有、復元不可** |
| 2020 | CDA/CUST設定 | ~1660B | CDA_NR、OP_NAME等のカスタマイゼーション情報 |
| 2227 | STARTUP_RESULT | 4B | 起動/シャットダウン結果 |
| 4900 | SERIAL_NO | 10B | シリアル番号 |
| 4901 | PBA_ID | 9B | 基板ID |
| 4902 | PBA_ID_REV | 1B | 基板リビジョン |

### DRM関連

| ユニット | 内容 |
|---------|------|
| 2022-2034 | Suntory DRMブロブ |
| 2129, 2130, 2160 | DRM証明書 |
| 2500 | DRMデータベース（SQLite、約40KB、247キー） |

### 暗号化・制限あり

| ユニット | 名前 | 備考 |
|---------|------|------|
| 2010 | SIMLOCK | 暗号化済み。Read/Writeで error=-22 |

## Pythonでの解析

```python
import struct

MAGIC = 0x3BF8E9C1

def parse_ta(ta_path):
    """TA.imgを解析して全ユニットを辞書で返す"""
    with open(ta_path, 'rb') as f:
        data = f.read()

    units = {}
    i = 0
    while i < len(data) - 16:
        magic_val = struct.unpack_from('<I', data, i + 8)[0]
        if magic_val == MAGIC:
            unit_num = struct.unpack_from('<I', data, i)[0]
            data_size = struct.unpack_from('<I', data, i + 4)[0]
            if data_size < 0x100000:
                unit_data = data[i + 16 : i + 16 + data_size]
                units[unit_num] = unit_data
                i += 16 + data_size
                i = (i + 3) & ~3  # 4byte alignment
                continue
        i += 4
    return units

# 使用例
units = parse_ta('TA.img')
print(f"Total units: {len(units)}")
print(f"Serial: {units[4900]}")  # b'CB512FUK5D'
```

## S1プロトコルでのアクセス

```
USB VID: 0x0FCE / PID: 0xB00B

Read-TA:{partition}:{unit}    # 読み取り
upload(data) → Write-TA:...   # 書き込み
Sync                          # 再起動
```

## ブートログの取得（unit 2050）

起動失敗の原因調査に使う：

```python
boot_log = sud.read_ta(2050)  # 最大 16384 bytes
print(boot_log.decode('ascii', errors='ignore'))
# → [ERROR @ hwconf.c:202]: No hardware config found
```

## sxflasherがスキップするユニット

:::warning
ファームウェア再フラッシュ時にスキップされるため、消えたら**手動で復元**が必要：
- Unit 2003 (HW_CONF), 2010 (SIMLOCK), 2129, 2210, 4900 (SERIAL_NO), 66667
:::
