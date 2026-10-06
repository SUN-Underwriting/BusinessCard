// Headless Chromium renders: card PNGs, app icons and the vCard photo.
// Pages are served over a throwaway local HTTP server so fonts and images load
// exactly as they do on the live site.
import { createServer, type Server } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { AddressInfo } from "node:net";
import { chromium, type Browser } from "playwright";

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

export class Renderer {
  private constructor(private browser: Browser, private server: Server, readonly origin: string) {}

  /** `root` is served at the origin root; `pages` are extra in-memory HTML files. */
  static async start(root: string, pages: Map<string, string>): Promise<Renderer> {
    const server = createServer(async (req, res) => {
      const urlPath = decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname);
      const page = pages.get(urlPath);
      if (page !== undefined) {
        res.writeHead(200, { "content-type": TYPES[".html"] }).end(page);
        return;
      }
      const file = path.join(root, path.normalize(urlPath).replace(/^([/\\])+/, ""));
      if (!file.startsWith(root)) return void res.writeHead(403).end();
      try {
        const body = await readFile(file);
        res.writeHead(200, { "content-type": TYPES[path.extname(file)] ?? "application/octet-stream" }).end(body);
      } catch {
        res.writeHead(404).end();
      }
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address() as AddressInfo;
    const browser = await chromium.launch();
    return new Renderer(browser, server, `http://127.0.0.1:${port}`);
  }

  /** Screenshot one element. `omitBackground` keeps everything outside it transparent. */
  async element(
    urlPath: string,
    selector: string,
    opts: { scale: number; type?: "png" | "jpeg"; quality?: number; viewport?: { width: number; height: number } },
  ): Promise<Buffer> {
    const ctx = await this.browser.newContext({
      deviceScaleFactor: opts.scale,
      viewport: opts.viewport ?? { width: 600, height: 400 },
    });
    try {
      const page = await ctx.newPage();
      await page.goto(this.origin + urlPath, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      return await page.locator(selector).screenshot({
        type: opts.type ?? "png",
        quality: opts.type === "jpeg" ? opts.quality : undefined,
        omitBackground: opts.type !== "jpeg",
        animations: "disabled",
      });
    } finally {
      await ctx.close();
    }
  }

  async close(): Promise<void> {
    await this.browser.close();
    await new Promise((resolve) => this.server.close(resolve));
  }
}
