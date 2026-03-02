---
sidebar_position: 1
title: 概要
---

# Sony Xperia XZ2 Premium 改造記録

AU版 Xperia XZ2 Premium (SOV38) をブートローダーアンロックし、文鎮化させ、そこから復旧するまでの全記録。

## 対象端末

| 項目 | 値 |
|------|-----|
| 機種名 | Sony Xperia XZ2 Premium |
| 型番 | SOV38 |
| コードネーム | aurora_kddi |
| キャリア | KDDI (au) |
| CDA_NR | 1314-0765 |
| PBA_ID | 1312-9715 |
| SoC | Qualcomm Snapdragon 845 |
| カメラ | IMX400 + IMX379 (デュアル) |

## やったこと（時系列）

```
xperable で BLアンロック
    ↓
CDA_NR を KDDI → Global に書き換え
    ↓
💀 文鎮化（S1モードでしか起動しない）
    ↓
ファームウェア再フラッシュ（3回）→ 起動せず
    ↓
TA ユニット解析 → 根本原因特定
    ↓
重要TAユニット6個を復元 → 復旧成功 🎉
    ↓
Magisk でroot化
    ↓
カメラDRM (Suntory/CKB) 解析
    ↓
secd バイナリパッチ作成・適用試行
```

## この記録で学べること

- Sony端末の **TAパーティション** の構造と役割
- **S1/XFLフラッシュモード** での低レベル通信
- ブートローダーアンロックによる **DRM消失** のメカニズム
- Sony独自の **Suntory DRMエンジン** とCKBカメラ処理
- ARM64バイナリの **逆アセンブルとパッチ** の手法
- **Magiskモジュール** による永続化の方法と落とし穴
