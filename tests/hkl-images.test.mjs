import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

const source = fs.readFileSync(new URL("../lib/hkl-links.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const { imageSrc, mapForImage } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);

test("local image URLs resolve from the site root on every page", () => {
  for (const value of ["home/Group.webp", "images/home/Group.webp", "/images/home/Group.webp", "public/images/home/Group.webp", String.raw`public\images\home\Group.webp`]) {
    for (const page of ["https://hkl.example/", "https://hkl.example/about", "https://hkl.example/practices/example"]) {
      assert.equal(new URL(imageSrc(value), page).href, "https://hkl.example/images/home/Group.webp");
    }
  }
});

test("duplicate separators do not create a different asset URL", () => {
  assert.equal(imageSrc("/images//home/photo.webp"), "/images/home/photo.webp");
});

test("external and embedded image URLs are preserved", () => {
  for (const value of ["https://images.example/photo.webp?width=800", "//images.example/photo.webp", "data:image/png;base64,abc"]) {
    assert.equal(imageSrc(value), value);
  }
});

test("the replacement venue map preserves the original coordinates", () => {
  const map = mapForImage("https://api.mapbox.com/styles/v1/mapbox/light-v11/static/pin-l+002a74(75.4221896,31.0410081)/75.4221896,31.0410081,13,0/640x400@2x");
  assert.ok(map);
  const embed = new URL(map.embed);
  assert.equal(embed.origin, "https://www.openstreetmap.org");
  assert.equal(embed.searchParams.get("marker"), "31.0410081,75.4221896");
  assert.equal(mapForImage("https://images.example/photo.webp"), null);
  assert.equal(mapForImage("https://api.mapbox.com/styles/v1/mapbox/light-v11/static/pin-l+002a74(999,31)/image"), null);
});
