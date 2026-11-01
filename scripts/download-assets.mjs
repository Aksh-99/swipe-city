import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import assets from './github-assets.json' with { type: 'json' };
const origin = process.env.SWIPE_CITY_ASSET_ORIGIN || 'https://swipecity.agopakum1.chatgpt.site';
for (const asset of assets) {
  const url = new URL(asset.path.replace(/^public/, ''), origin);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status}: ${url}`);
  const data = Buffer.from(await response.arrayBuffer());
  if (data.length !== asset.size) throw new Error(`Asset size changed: ${asset.path}`);
  await mkdir(dirname(asset.path), { recursive: true });
  await writeFile(asset.path, data);
  console.log(asset.path);
}
