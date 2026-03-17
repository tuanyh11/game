# 🏰 GAME DESIGN DOCUMENT (GDD)
## **Pixel Empires** — 2D Pixel Art RTS
> *Lấy cảm hứng từ Age of Empires*

---

## 1. Tổng Quan (Overview)

| Hạng mục | Chi tiết |
|---|---|
| **Tên game** | Pixel Empires |
| **Thể loại** | Real-Time Strategy (RTS) |
| **Phong cách đồ họa** | 2D Pixel Art, góc nhìn isometric/top-down |
| **Nền tảng** | PC (Windows, macOS, Linux) |
| **Số người chơi** | 1-4 (Singleplayer + Multiplayer LAN/Online) |
| **Đối tượng** | Fan RTS cổ điển, yêu thích pixel art |
| **Thời gian một ván** | 20-60 phút |

### Concept
Pixel Empires là tựa game chiến thuật thời gian thực 2D phong cách pixel art. Người chơi bắt đầu với một Nhà Chính và một nhóm Dân nhỏ, khai thác tài nguyên, xây dựng cơ sở hạ tầng, nghiên cứu công nghệ, huấn luyện quân đội và tiêu diệt đối thủ để giành chiến thắng.

---

## 2. Hệ Thống Tài Nguyên (Resources)

### 4 Loại Tài Nguyên

| Icon | Tài nguyên | Nguồn khai thác | Vai trò chính |
|---|---|---|---|
| 🌾 | **Thực phẩm (Food)** | Quả mọng, Trang trại, Cá, Động vật | Tuyển Dân, lính cơ bản, lên đời |
| 🪵 | **Gỗ (Wood)** | Rừng cây | Xây công trình, tuyển cung thủ, máy công thành |
| 🪙 | **Vàng (Gold)** | Mỏ vàng, Giao thương tại Chợ | Lính cao cấp, nghiên cứu công nghệ, lên đời |
| 🪨 | **Đá (Stone)** | Mỏ đá | Tường thành, tháp phòng thủ, lâu đài |

### Cơ chế khai thác
- **Dân (Villager)** là đơn vị duy nhất có thể khai thác tài nguyên.
- Dân mang tài nguyên về **điểm trả hàng** gần nhất (Nhà Chính, Kho gỗ, Kho đá, Chợ).
- Mỗi chuyến mang tối đa **10 đơn vị** tài nguyên (có thể nâng cấp).
- Tài nguyên trên bản đồ là **có hạn**, buộc người chơi phải mở rộng lãnh thổ.

---

## 3. Hệ Thống Thời Kỳ (Ages)

Người chơi tiến hóa qua **4 thời kỳ**. Mỗi lần lên đời yêu cầu tài nguyên và mở khóa công trình, đơn vị, công nghệ mới.

### Thời Kỳ I — Thời Đồ Đá (Stone Age)
- **Chi phí lên đời:** Miễn phí (bắt đầu tại đây)
- **Công trình:** Nhà Chính, Nhà Ở, Kho Gỗ, Kho Đá, Trại Lính cấp 1
- **Đơn vị:** Dân, Lính giáo (Spearman), Trinh sát (Scout)
- **Đặc điểm:** Tập trung khai thác, xây dựng nền kinh tế ban đầu

### Thời Kỳ II — Thời Phong Kiến (Feudal Age)
- **Chi phí:** 500 Thực phẩm + 200 Vàng
- **Mở khóa:** Trại Bắn Cung, Chuồng Ngựa, Chợ, Tường gỗ
- **Đơn vị mới:** Cung thủ (Archer), Kỵ binh nhẹ (Light Cavalry)
- **Đặc điểm:** Bắt đầu quấy rối đối thủ, mở giao thương

### Thời Kỳ III — Thời Lâu Đài (Castle Age)
- **Chi phí:** 800 Thực phẩm + 500 Vàng + 200 Đá
- **Mở khóa:** Lâu Đài, Xưởng Máy Công Thành, Tháp canh đá, Tường đá
- **Đơn vị mới:** Hiệp sĩ (Knight), Lính đặc biệt (Unique Unit), Máy bắn đá (Mangonel)
- **Đặc điểm:** Quân đội mạnh, phòng thủ kiên cố, chiến thuật đa dạng

### Thời Kỳ IV — Thời Đế Chế (Imperial Age)
- **Chi phí:** 1000 Thực phẩm + 800 Vàng + 400 Đá
- **Mở khóa:** Trường Đại Học, Kỳ Quan, nâng cấp tối thượng
- **Đơn vị mới:** Pháo thần công (Cannon), Kỵ sĩ bọc thép (Paladin), Lính cận vệ hoàng gia
- **Đặc điểm:** Đỉnh cao sức mạnh, quyết định trận chiến cuối cùng

---

## 4. Hệ Thống Công Trình (Buildings)

### Công trình Kinh tế

| Công trình | Thời kỳ | Chi phí | Chức năng |
|---|---|---|---|
| **Nhà Chính (Town Center)** | I | Có sẵn | Tuyển Dân, điểm trả hàng, nghiên cứu kinh tế, lên đời |
| **Nhà Ở (House)** | I | 30 Gỗ | Tăng giới hạn dân số (+5/nhà) |
| **Kho Gỗ (Lumber Camp)** | I | 100 Gỗ | Điểm trả gỗ, nghiên cứu khai thác gỗ |
| **Kho Đá (Mining Camp)** | I | 100 Gỗ | Điểm trả vàng/đá, nghiên cứu khai thác khoáng |
| **Trang Trại (Farm)** | I | 60 Gỗ | Nguồn thực phẩm vô hạn (năng suất thấp) |
| **Chợ (Market)** | II | 175 Gỗ | Mua/bán tài nguyên, giao thương với đồng minh |

### Công trình Quân sự

| Công trình | Thời kỳ | Chi phí | Chức năng |
|---|---|---|---|
| **Trại Lính (Barracks)** | I | 175 Gỗ | Tuyển bộ binh (Lính giáo, Kiếm sĩ) |
| **Trại Bắn Cung (Archery Range)** | II | 175 Gỗ | Tuyển cung thủ, nỏ thủ |
| **Chuồng Ngựa (Stable)** | II | 175 Gỗ | Tuyển kỵ binh |
| **Lâu Đài (Castle)** | III | 650 Đá | Tuyển lính đặc biệt, nghiên cứu công nghệ đặc biệt |
| **Xưởng Công Thành (Siege Workshop)** | III | 200 Gỗ | Tuyển máy công thành (Mangonel, Ram, Trebuchet) |

### Công trình Phòng thủ

| Công trình | Thời kỳ | Chi phí | Chức năng |
|---|---|---|---|
| **Tường Gỗ (Palisade)** | II | 2 Gỗ/ô | Rào chắn cơ bản |
| **Tường Đá (Stone Wall)** | III | 5 Đá/ô | Tường thành kiên cố |
| **Tháp Canh (Watch Tower)** | II | 100 Đá, 50 Gỗ | Tháp bắn tự động, tầm nhìn xa |
| **Cổng Thành (Gate)** | II | 30 Đá | Cho phép quân ta đi qua tường |

### Công trình Nghiên cứu

| Công trình | Thời kỳ | Chi phí | Chức năng |
|---|---|---|---|
| **Lò Rèn (Blacksmith)** | II | 150 Gỗ | Nâng cấp tấn công/phòng thủ cho quân |
| **Trường Đại Học (University)** | IV | 200 Gỗ, 100 Vàng | Nghiên cứu công nghệ cuối game |
| **Kỳ Quan (Wonder)** | IV | 1000 mỗi loại | Chiến thắng nếu giữ được 200 giây |

---

## 5. Hệ Thống Đơn Vị (Units) — Tóm tắt

| Đơn vị | Loại | Thời kỳ | Mạnh vs | Yếu vs |
|---|---|---|---|---|
| Dân (Villager) | Kinh tế | I | — | Mọi thứ |
| Lính Giáo (Spearman) | Bộ binh | I | Kỵ binh | Cung thủ |
| Trinh Sát (Scout) | Kỵ binh | I | Trinh sát | Lính giáo |
| Cung Thủ (Archer) | Tầm xa | II | Bộ binh | Kỵ binh |
| Kỵ Binh Nhẹ (Light Cav) | Kỵ binh | II | Cung thủ | Lính giáo |
| Kiếm Sĩ (Swordsman) | Bộ binh | II | Bộ binh | Cung thủ |
| Hiệp Sĩ (Knight) | Kỵ binh | III | Cung thủ, Bộ binh | Lính giáo |
| Lính Đặc Biệt | Đặc biệt | III | Tùy loại | Tùy loại |
| Máy Công Thành | Công thành | III | Công trình | Kỵ binh |
| Pháo Thần Công | Công thành | IV | Mọi thứ | Kỵ binh |

> **Tam giác tương khắc:** Bộ binh > Kỵ binh > Cung thủ > Bộ binh

---

## 6. Core Gameplay Loop (Vòng Lặp Gameplay Cốt Lõi)

```
┌─────────────────────────────────────────────────────────┐
│                    🎮 BẮT ĐẦU VÁN                      │
│         Nhà Chính + 3 Dân + 1 Trinh sát                │
└──────────────────────┬──────────────────────────────────┘
                       ▼
┌──────────────────────────────────────────────────────────┐
│  PHASE 1: KHAI THÁC & XÂY DỰNG (0-5 phút)              │
│  • Tuyển thêm Dân (mục tiêu: 8-12 Dân)                 │
│  • Phân bổ Dân khai thác Thực phẩm & Gỗ                │
│  • Xây Nhà Ở, Kho Gỗ, Trại Lính                        │
│  • Trinh sát khám phá bản đồ                            │
└──────────────────────┬──────────────────────────────────┘
                       ▼
┌──────────────────────────────────────────────────────────┐
│  PHASE 2: LÊN ĐỜI FEUDAL + MỞ RỘNG (5-12 phút)        │
│  • Tích lũy 500 Food + 200 Gold → Lên đời Feudal       │
│  • Xây Trại Bắn Cung, Chuồng Ngựa, Lò Rèn             │
│  • Bắt đầu sản xuất quân, quấy rối đối thủ             │
│  • Mở Chợ, xây Trang Trại, phát triển kinh tế ổn định  │
└──────────────────────┬──────────────────────────────────┘
                       ▼
┌──────────────────────────────────────────────────────────┐
│  PHASE 3: CASTLE AGE + QUÂN SỰ HÓA (12-25 phút)        │
│  • Tích lũy tài nguyên → Lên đời Castle                 │
│  • Xây Lâu Đài, Xưởng Công Thành                        │
│  • Tuyển lính đặc biệt, Hiệp sĩ                        │
│  • Tấn công/phòng thủ chiến lược                        │
│  • Xây tường, tháp canh bảo vệ kinh tế                  │
└──────────────────────┬──────────────────────────────────┘
                       ▼
┌──────────────────────────────────────────────────────────┐
│  PHASE 4: IMPERIAL + QUYẾT CHIẾN (25-60 phút)           │
│  • Lên đời Imperial, mở khóa toàn bộ công nghệ         │
│  • Sản xuất đội quân tối thượng                          │
│  • Tổng tấn công hoặc xây Kỳ Quan                       │
│  • Kiểm soát tài nguyên còn lại trên bản đồ             │
└──────────────────────┬──────────────────────────────────┘
                       ▼
┌──────────────────────────────────────────────────────────┐
│                  🏆 ĐIỀU KIỆN CHIẾN THẮNG                │
│  1. Tiêu diệt: Phá hủy toàn bộ công trình đối thủ     │
│  2. Kỳ Quan: Xây xong Kỳ Quan và giữ 200 giây         │
│  3. Đầu hàng: Đối thủ đầu hàng                         │
└──────────────────────────────────────────────────────────┘
```

### Micro-Loop (Lặp liên tục trong game)

```
Khai thác tài nguyên → Xây dựng/Nâng cấp → Tuyển quân
        ↑                                        ↓
   Mở rộng lãnh thổ  ←←←  Chiến đấu / Phòng thủ
```

---

## 7. Điều Kiện Chiến Thắng

| Kiểu | Mô tả |
|---|---|
| **Conquest (Chinh phục)** | Phá hủy toàn bộ công trình & đơn vị quân sự của đối thủ |
| **Wonder (Kỳ Quan)** | Xây xong Kỳ Quan và bảo vệ nó trong 200 giây |
| **Surrender (Đầu hàng)** | Đối thủ chọn đầu hàng |

---

## 8. Yếu Tố Khác Biệt Của Pixel Empires

- **Pixel Art sống động**: Mỗi đơn vị có animation idle, walk, attack, die riêng biệt.
- **Hệ thống ngày/đêm**: Ảnh hưởng tầm nhìn, bonus tấn công ban đêm cho một số đơn vị.
- **Địa hình đa dạng**: Đồi (bonus phòng thủ), rừng (ẩn nấp), sông (cần cầu), biển (tàu).
- **Fog of War**: Sương mù chiến tranh, cần trinh sát để mở bản đồ.

---

## 9. Tech Tree Tóm Tắt

```
Thời Đồ Đá ──► Thời Phong Kiến ──► Thời Lâu Đài ──► Thời Đế Chế
    │                │                   │                  │
    ├─ Dân           ├─ Cung Thủ         ├─ Hiệp Sĩ        ├─ Pháo Thần Công
    ├─ Lính Giáo     ├─ Kỵ Binh Nhẹ     ├─ Lính Đặc Biệt  ├─ Kỵ Sĩ Bọc Thép
    ├─ Trinh Sát     ├─ Kiếm Sĩ         ├─ Máy Công Thành  ├─ Cận Vệ Hoàng Gia
    │                │                   │                  │
    ├─ Nhà Chính     ├─ Chợ              ├─ Lâu Đài        ├─ Trường Đại Học
    ├─ Nhà Ở         ├─ Trại Bắn Cung   ├─ Xưởng C.Thành  ├─ Kỳ Quan
    ├─ Trại Lính     ├─ Chuồng Ngựa     ├─ Tường Đá        │
    ├─ Kho Gỗ        ├─ Lò Rèn          ├─ Tháp Đá         │
    └─ Kho Đá        └─ Tường Gỗ        └─ Cổng Thành      │
```

---

## 10. Roadmap Phát Triển

| Phase | Nội dung | Thời gian ước tính |
|---|---|---|
| **Alpha** | Core mechanics: khai thác, xây dựng, 1 thời kỳ, AI cơ bản | 3-4 tháng |
| **Beta** | 4 thời kỳ, toàn bộ đơn vị/công trình, AI nâng cao | 3-4 tháng |
| **Release** | Multiplayer, balancing, polish, âm thanh/nhạc | 2-3 tháng |
| **Post-launch** | Thêm phe phái, chiến dịch, bản đồ mới | Liên tục |

---

*Tài liệu GDD v1.0 — Pixel Empires*
*Ngày tạo: 03/03/2026*
