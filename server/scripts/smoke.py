"""PhantomMirror 端到端冒烟测试（打真实运行中的 API）。

走完整闭环：
  取上传地址 -> 直传对象存储 -> 上报完成 -> 外貌分析 -> 发型试戴 -> 提交反馈

与 `npm run test:e2e` 的区别：那个是在进程内起 Nest 应用、只覆盖健康检查；
这个是**打真实 HTTP 服务**的黑盒测试，覆盖全部业务路由，因此能验证
预签名 URL、Worker 异步任务、以及结果图是否真的能从对象存储下载下来。

前置：SSH 隧道已建立 + 存储层容器在跑 + API 已启动（见 README）。
用法：
  python server/scripts/smoke.py                       # 打本机
  PM_BASE=http://101.35.163.174:3000/api/v1 \
    python server/scripts/smoke.py                     # 打公网部署（真机同一条路）

打公网时，脚本里 [2] 直传走的是服务端签发的预签名 URL —— 它的 Host 来自
S3_PUBLIC_ENDPOINT。若那一步连不上，说明该变量还指着内网地址（如 minio:9000），
而不是公网 IP。
"""
import json
import os
import secrets
import struct
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import zlib

BASE = os.environ.get("PM_BASE", "http://127.0.0.1:3000/api/v1")
ANON_ID = "anon_" + secrets.token_hex(16)


def call(method, path, body=None, headers=None, raw=False, timeout=60):
    url = path if path.startswith("http") else BASE + path
    data = None
    hdrs = {"X-Anonymous-Id": ANON_ID}
    if headers:
        hdrs.update(headers)
    if body is not None:
        if raw:
            data = body
        else:
            data = json.dumps(body).encode()
            hdrs["Content-Type"] = "application/json"

    req = urllib.request.Request(url, data=data, headers=hdrs, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            payload = resp.read()
            try:
                return resp.status, json.loads(payload)
            except Exception:
                return resp.status, payload
    except urllib.error.HTTPError as e:
        payload = e.read()
        try:
            return e.code, json.loads(payload)
        except Exception:
            return e.code, payload
    except urllib.error.URLError as e:
        # 连不上（超时 / 端口没放行 / DNS 不通）—— 返回 0 让调用方给出人话提示，
        # 而不是甩一个 traceback 出来。
        return 0, f"连接失败: {e.reason}"


def make_png(width=8, height=8, rgb=(90, 140, 200)):
    """手搓一张最小合法 PNG —— 不依赖 Pillow。"""
    raw = b""
    for _ in range(height):
        raw += b"\x00" + bytes(rgb) * width

    def chunk(tag, data):
        body = tag + data
        return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body))

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", zlib.compress(raw))
        + chunk(b"IEND", b"")
    )


def poll(path_fn, label, max_wait=180):
    """轮询异步任务直到终态。"""
    deadline = time.time() + max_wait
    last = None
    while time.time() < deadline:
        status, body = call("GET", path_fn())
        if status >= 400:
            print(f"  [!] {label} 查询失败 {status}: {body}")
            return None
        state = body.get("status")
        if state != last:
            print(f"  {label} 状态: {state}")
            last = state
        if state in ("SUCCESS", "FAILED", "CANCELLED"):
            return body
        time.sleep(2)
    print(f"  [!] {label} 超时")
    return None


def main():
    print(f"匿名身份: {ANON_ID}\n")

    # ---- 1. 取上传地址 ----
    print("[1] 取预签名上传地址")
    png = make_png()
    status, body = call(
        "POST", "/photos/upload-url",
        {"contentType": "image/png", "sizeBytes": len(png), "width": 8, "height": 8},
    )
    if status == 0 or status >= 400:
        print(f"  失败 {status}: {body}")
        if status == 0:
            print(f"      API {BASE} 连不上。")
        return 1
    photo_id = body["photoId"]
    upload_url = body["uploadUrl"]
    print(f"  photoId={photo_id}")
    print(f"  uploadUrl={upload_url[:90]}...")

    # ---- 2. 直传对象存储 ----
    host = urllib.parse.urlsplit(upload_url).netloc
    print(f"[2] 直传图片到 MinIO: {host}（不经过后端）")
    if "minio:" in host or host.startswith("127.0.0.1"):
        print(f"  [!] 预签名 URL 指向内网地址 {host} —— 外网客户端用不了。")
        print("      服务器上 .env 的 S3_PUBLIC_ENDPOINT 要设成公网地址。")
    status, body = call("PUT", upload_url, png, {"Content-Type": "image/png"}, raw=True)
    print(f"  HTTP {status}")
    if status >= 400 or status == 0:
        print(f"  失败: {body}")
        if status == 0:
            print("      若是公网地址：确认腾讯云安全组已放行 TCP:9000，且 MINIO_BIND=0.0.0.0。")
        return 1

    # ---- 3. 上报完成 ----
    print("[3] 上报上传完成")
    status, body = call("POST", f"/photos/{photo_id}/complete")
    print(f"  {status} {body}")
    if status >= 400:
        return 1

    # ---- 4. 外貌分析 ----
    print("[4] 发起外貌分析")
    status, body = call("POST", "/analysis", {"photoId": photo_id})
    print(f"  {status} {body}")
    if status >= 400:
        return 1
    task_id = body["taskId"]
    result = poll(lambda: f"/analysis/{task_id}", "分析")
    if not result or result.get("status") != "SUCCESS":
        print(f"  分析未成功: {result}")
        return 1
    print(f"  画像: {json.dumps(result.get('profile'), ensure_ascii=False)}")

    # ---- 5. 发型试戴 ----
    print("[5] 取发型目录并试戴第一个")
    status, list_body = call("GET", "/hairstyles")
    hairstyle = list_body[0]
    print(f"  选中: {hairstyle['name']} ({hairstyle['code']})")

    status, body = call(
        "POST", "/simulations",
        {"photoId": photo_id, "hairstyleId": hairstyle["id"]},
    )
    print(f"  {status} {body}")
    if status >= 400:
        return 1
    sim_id = body["simulationId"]

    sim = poll(lambda: f"/simulations/{sim_id}", "试戴")
    if not sim or sim.get("status") != "SUCCESS":
        print(f"  试戴未成功: {sim}")
        return 1
    out_url = sim.get("outputImageUrl")
    print(f"  结果图: {out_url[:90] if out_url else None}...")

    # ---- 6. 结果图真的能下载 ----
    print("[6] 下载结果图验证")
    status, data = call("GET", out_url, raw=True)
    is_png = data[:4] == b"\x89PNG"
    print(f"  HTTP {status}，{len(data)} 字节，PNG 魔数={is_png}")
    if not is_png:
        print("  [!] 结果图不是合法 PNG")
        return 1

    # ---- 7. 提交反馈 ----
    print("[7] 提交反馈")
    status, body = call(
        "POST", "/feedback",
        {"simulationId": sim_id, "rating": 5, "reason": "UNNATURAL", "comment": "冒烟测试"},
    )
    print(f"  {status} {body}")
    if status >= 400:
        return 1

    print("\n✅ 全链路通过")
    return 0


if __name__ == "__main__":
    sys.exit(main())