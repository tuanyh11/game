# 🏰 YẾU TỐ KỸ THUẬT & KIẾN TRÚC CODEBASE - PIXEL EMPIRES

Tài liệu này cung cấp cái nhìn tổng quan về kiến trúc mã nguồn của dự án game thời gian thực (RTS) **Pixel Empires**, giúp cho các lập trình viên dễ dàng điều hướng, bảo trì và phát triển thêm các tính năng mới vòng quanh source code.

---

## 📂 1. Cấu Trúc Thư Mục (Directory Structure)

Dự án tuân theo mô hình Client-Server, viết hoàn toàn bằng TypeScript và được gói bằng Vite (Client) + Bun (Server).

```text
/Users/tuan/Learn/game/
├── src/                # Toàn bộ mã nguồn Client-side của game
│   ├── config/         # Cấu hình game (chỉ số, data của unit/building, văn minh)
│   ├── core/           # Khởi tạo game, vòng lặp chính (Game loop), Camera
│   ├── entities/       # Quản lý các đối tượng trong game (Unit, Building, Resource)
│   ├── systems/        # Các hệ thống quản lý logic lớn (AI, Selection, Fog of War)
│   ├── map/            # Sinh bản đồ sinh thái, bộ tìm đường (Pathfinder A*)
│   ├── network/        # Logic kết nối mạng (WebSocket client, Lobby)
│   ├── ui/             # Giao diện người dùng (HTML DOM overlays, React-like logic)
│   ├── i18n/           # Hệ thống đa ngôn ngữ (Tiếng Việt / English)
│   └── utils/          # Các hàm hỗ trợ dùng chung
├── server/             # Mã nguồn Backend Server (Bun + Elysia) cho chế độ Multiplayer
├── public/             # Tài nguyên tĩnh (Hình ảnh, Âm thanh)
├── index.html          # File entry point của DOM
└── index.ts            # Entry point chính của Client (Main Menu router)
```

---

## 🏛 2. Kiến Trúc Client (Game Engine)

Engine của game được tự xây dựng dựa trên HTML5 `<canvas>` để render 2D và Vanilla TypeScript. Không sử dụng game engine nặng (như Unity/Godot), tối ưu cho Web. Kiến trúc của game lấy cảm hứng từ mô hình **ECS (Entity-Component-System)** linh hoạt.

### Core (Lõi Game)
- `src/core/Game.ts`: Trái tim của ứng dụng. Khởi tạo `Canvas`, `GameLoop`, liên kết các `Systems` lại với nhau và tiếp nhận input của người chơi.
- `src/core/GameLoop.ts`: Vòng lặp `requestAnimationFrame`, quản lý thời gian delta (dt) cho physics và rendering.
- `src/core/Camera.ts`: Quản lý góc nhìn của người chơi, hỗ trợ pan, zoom và lưới isometric/top-down tọa độ.

### Entities (Thực Thể)
Các đối tượng trong game được chia nhỏ logic behavior thay vì kế thừa gắt gao.
- **Unit (Lính/Dân):** Logic được tách vào `unit-movement/` (di chuyển), `combat/` (tấn công), `unit-economy/` (khai thác), và `unit-rendering/` (vẽ sprite, tạo hạt).
- **Building (Công trình):** Xử lý đặt nền móng, huấn luyện quân, nâng cấp công nghệ.
- **ResourceNode (Tài nguyên):** Các mỏ vàng, đá, cây gỗ cung cấp nguyên liệu.

### Systems (Hệ Thống Phạt/Logic Trọng Tâm)
Hệ thống là những Manager tổng đứng ra lặp qua tất cả hoặc một nhóm thực thể để update logic mỗi frame:
- `EntityManager.ts`: Quản lý (thêm/xóa/vòng lặp) tất cả các thực thể hiện có trên bản đồ, tối ưu QuadTree để tra cứu va chạm.
- `SelectionSystem.ts`: Xử lý logic click/kéo thả chuột để chọn 1 hoặc nhiều đơn vị bộ đội.
- `PlayerState.ts`: Quản lý khối tài nguyên (Food, Wood, Gold, Stone) và Tech Tree thời kỳ (Stone, Feudal...) của người chơi.
- `FogOfWar.ts`: Quản lý sương mù chiến tranh và tầm nhìn (Sight) của lính/nhà. Vùng chưa khám phá sẽ màu đen, vùng đã khám phá nhưng không có tầm nhìn sẽ mờ đi.
- `ai/AIController.ts`: Bộ não của máy (Bot). Cỗ máy trạng thái giúp AI biết tự động điều dân đi khai thác, xây nhà lính và tổ chức đánh người chơi.

### Map & Tọa độ
- `map/TileMap.ts`: Bản đồ chia thành ma trận ô lưới (Grid). Lưu trữ loại địa hình (Cỏ, Cát, Nước,...).
- `map/MapGenerator.ts`: Thuật toán sinh bản đồ ngẫu nhiên dựa trên các bộ preset và Perlin Noise.
- `map/Pathfinder.ts`: Tìm đường A* chuẩn xác, xử lý tránh vật cản động và né nhau của lính.

---

## 🌐 3. Kiến trúc Multiplayer (Server - Client)

Tính năng Multiplayer hoạt động theo mô hình **Mạng dạng lưới lai (Hybrid Lockstep / State-sync)** thông qua WebSocket.

### Client-Side (`src/network/`)
- Giao tiếp thời gian thực khi chơi mạng nhiều người (Online mode).
- Trọng tâm đồng bộ `Command` (Lệnh tay từ người chơi: "Click đi đến A", "Tấn công B", "Xây nhà C") thay vì đồng bộ toàn bộ vị trí x, y liên tục (giảm băng thông rất lớn).
- Thuật toán Deterministic (Tính toán tất định đảm bảo Physics trên cả 2 máy ra kết quả y hệt nếu cùng chung 1 hạt giống - Seed map).

### Server-Side (`server/`)
- Môi trường chạy ảo rất nhẹ: **Bun + ElysiaJS / WebSockets**.
- `server/index.ts`: Trung tâm tạo Room, quản lý danh sách thiết bị. Phục vụ ghép trận (Matchmaking) và broadcast lệnh tới các người chơi khác trong cùng phòng.

---

## 🎨 4. Bố cục UI (User Interface)

Thay vì vẽ UI bằng Canvas (khó làm animation responsive), game sử dụng **HTML/CSS Overlay** đè lên trên Canvas.

- Nằm ở đường dẫn `src/ui/`.
- `GameUI.ts`: File lớn nhất vẽ thanh tài nguyên, minimap ở dưới đuôi màn hình tĩnh, đồng thời render các action box (như bấm vào Dân thì hiện bảng xây nhà).
- `MainMenu.ts` & `SettingsMenu.ts`: Flow màn hình chờ, tạo phòng chơi mạng, tùy chỉnh âm lượng / góc ngắm.
- **Ngôn Nữ (`src/i18n/`):** Reactivity ảo dựa trên getters của JavaScript (`Object.defineProperty`). Trợ giúp đổi ngôn ngữ game ngay lặp tức lúc run-time giữa hai tập tin `vi.ts` và `en.ts`.

---

## 🚀 5. Quy trình thêm 1 loại quân (Unit) mới

Nếu bạn muốn tạo 1 lính mới, hãy làm theo các bước:
1. **Thêm ID cho Unit**: Nằm tại `GameConfig.ts` - `enum UnitType`.
2. **Khai báo chỉ số & Dịch thuật**: Tại thư mục `GameConfig.ts` (`UNIT_DATA`) nhập giá tiền, HP, Dame. Thay đổi phần dịch tại thư mục `src/i18n/vi.ts`.
3. **Quy định việc vẽ hình (Rendering)**: Tạo một file mới tại `src/entities/unit-rendering/` (hoặc chèn chung file nền văn minh đó). Hàm render lính có dùng thư viện `UnitRenderer`.
4. **Cài đặt kỹ năng / Buff riêng biệt**: Tùy chọn chèn logic tại `Unit.ts` -> hàm `update()`.

---

*Tài liệu tự sinh v1.0 — Phục Vụ Quy Trình Phát Triển Dài Hạn*
