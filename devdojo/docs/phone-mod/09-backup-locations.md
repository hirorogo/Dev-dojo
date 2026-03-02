---
sidebar_position: 9
title: バックアップ一覧
---

# バックアップファイルの保存場所

今回の改造で作成・取得した全バックアップの場所と内容。

:::danger 最重要
`TA_original_with_drm.img` を紛失すると、文鎮化時に復旧不可能になる。複数箇所にコピーを保存すること。
:::

## ディレクトリ構成

```
/Users/hiro/Documents/phone/
├── backup/
│   ├── ta/                          # TAパーティション関連
│   ├── partitions/                  # その他パーティション
│   ├── drm_keys/                    # DRMキー・証明書
│   └── drm_fix_backup/             # DRM修正前のバックアップ
├── firmware/sin/                    # ファームウェア (.sin)
├── recovery/
│   ├── scripts/                     # 復旧スクリプト
│   └── logs/                        # sxflasherログ
├── tools/
│   ├── sxflasher/                   # sxflasherツール
│   ├── xperable-src/                # xperableソース + バイナリ
│   ├── twrp-aurora.img              # TWRPイメージ
│   └── secd_patch_module/           # Magiskモジュール
└── docs/                            # ドキュメント
```

## TAパーティション バックアップ

### 最重要ファイル

| ファイル | パス | サイズ | 内容 |
|---------|------|--------|------|
| **TA_original_with_drm.img** | `backup/drm_keys/` | 2MB | xperableが作成した**オリジナルTA**。DRMキー含む。復旧の生命線 |
| **TA_before_drm_fix.img** | `backup/drm_fix_backup/` | 2MB | DRM修正試行前の現在のTA |

### TAの状態の違い

| 項目 | TA_original_with_drm.img | TA_before_drm_fix.img |
|------|--------------------------|----------------------|
| 時点 | xperableによるBLアンロック前 | 復旧後・Magiskインストール後 |
| CDA_NR | 1314-0765 (KDDI) | 1314-0765 (KDDI) |
| rooting_status | 0 (ロック) | 2 (アンロック) |
| HW_CONF (2003) | ✅ 存在 | ✅ 復元済み |
| Suntoryブロブ (2024-2034) | 0x00 (未確認) | 0x00 (空) |
| DRMデータベース (2500) | ✅ 存在 | ✅ 存在 |

## DRMキー バックアップ

パス: `backup/drm_keys/`

| ファイル | サイズ | 内容 |
|---------|--------|------|
| `unit_2500_drm_db.raw` | 40,960 bytes | DRMデータベース（SQLite形式、247キー） |
| `drm_keys_247.json` | - | 全キーデータのJSON書き出し |
| `unit_2129.raw` | - | DRM証明書 |
| `unit_2130.raw` | - | DRM証明書 |
| `unit_2160.raw` | - | DRM証明書 |
| `blobs/` | 147ファイル | zlib圧縮されたDRMブロブユニット |

## boot イメージ

パス: `backup/drm_fix_backup/`

| ファイル | サイズ | 内容 |
|---------|--------|------|
| `boot_a_current.img` | 67MB | 復旧後のオリジナルbootイメージ |
| `magisk_patched-30600_FEBYZ.img` | - | Magisk v30.6でパッチ済みboot（現在フラッシュ済み） |

## secd バイナリ

パス: `backup/drm_fix_backup/`

| ファイル | サイズ | 内容 |
|---------|--------|------|
| `secd_backup` | 269,000 bytes | オリジナルのsecdバイナリ |
| `secd_patched` | 269,000 bytes | DRMバイパスパッチ適用済み |
| `secd_lib_backup` | 202,432 bytes | secdライブラリ |

### パッチの差分

```
オフセット  元          パッチ後      意味
0x87b4    60 00 00 54  1f 20 03 d5  B.EQ → NOP
0x87bc    c1 00 00 54  06 00 00 14  B.NE → B (無条件分岐)
```

## ファームウェア

パス: `firmware/sin/`

SOV38 (aurora_kddi) のストックファームウェア .sin ファイル一式。newflasherで使用。

## ツール

| ファイル | パス | 用途 |
|---------|------|------|
| `twrp-aurora.img` | `tools/` | TWRP カスタムリカバリ |
| `sxflasher/` | `tools/sxflasher/` | Sony S1通信ツール |
| `xperable-src/` | `tools/xperable-src/` | BLアンロックツール（ソース + バイナリ） |
| `secd_patch_module/` | `tools/secd_patch_module/` | Magiskモジュール（secdパッチ） |

## 復旧スクリプト

パス: `recovery/scripts/`

| スクリプト | 用途 |
|-----------|------|
| `restore_ta_cda.py` | CDA_NR調査・修復 |
| `fix_cda_unit2020.py` | CDA_NRパッチ |
| `fix_cda_clean.py` | CDA設定ブロック全体復元 |
| `restore_critical_ta_units.py` | 重要TAユニット6個の復元 |

## バックアップの推奨事項

1. **`TA_original_with_drm.img` は最低3箇所に保存**（ローカル、クラウド、外部ストレージ）
2. DRMキー関連ファイルも同様に複数箇所に保存
3. boot imageのバックアップはMagiskやカスタムROM導入前に必ず取得
4. 復旧スクリプトはgitで管理（このDocusaurusサイトと一緒に）
