import { readFile, writeFile } from 'node:fs/promises';
import { deflateSync, inflateSync } from 'node:zlib';

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const output = Buffer.alloc(data.length + 12);
  output.writeUInt32BE(data.length, 0);
  typeBuffer.copy(output, 4);
  data.copy(output, 8);
  output.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), data.length + 8);
  return output;
}

function paeth(a, b, c) {
  const estimate = a + b - c;
  const pa = Math.abs(estimate - a);
  const pb = Math.abs(estimate - b);
  const pc = Math.abs(estimate - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

function decodeRgbaPng(buffer) {
  if (!buffer.subarray(0, 8).equals(PNG_SIGNATURE)) throw new Error('Not a PNG file');
  let offset = 8;
  let width;
  let height;
  const compressed = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      if (data[8] !== 8 || data[9] !== 6 || data[12] !== 0) {
        throw new Error('Only 8-bit, non-interlaced RGBA PNGs are supported');
      }
    } else if (type === 'IDAT') compressed.push(data);
    else if (type === 'IEND') break;
    offset += length + 12;
  }

  const packed = inflateSync(Buffer.concat(compressed));
  const stride = width * 4;
  const pixels = Buffer.alloc(stride * height);
  let sourceOffset = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = packed[sourceOffset];
    sourceOffset += 1;
    for (let x = 0; x < stride; x += 1) {
      const raw = packed[sourceOffset + x];
      const left = x >= 4 ? pixels[y * stride + x - 4] : 0;
      const above = y > 0 ? pixels[(y - 1) * stride + x] : 0;
      const upperLeft = y > 0 && x >= 4 ? pixels[(y - 1) * stride + x - 4] : 0;
      let value = raw;
      if (filter === 1) value += left;
      else if (filter === 2) value += above;
      else if (filter === 3) value += Math.floor((left + above) / 2);
      else if (filter === 4) value += paeth(left, above, upperLeft);
      else if (filter !== 0) throw new Error(`Unsupported PNG filter ${filter}`);
      pixels[y * stride + x] = value & 0xff;
    }
    sourceOffset += stride;
  }
  return { width, height, pixels };
}

function encodeRgbaPng(width, height, pixels) {
  const stride = width * 4;
  const packed = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) pixels.copy(packed, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    PNG_SIGNATURE,
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(packed, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function resizeRgba(pixels, sourceWidth, sourceHeight, targetWidth, targetHeight) {
  const output = Buffer.alloc(targetWidth * targetHeight * 4);
  for (let y = 0; y < targetHeight; y += 1) {
    const sourceY = ((y + 0.5) * sourceHeight) / targetHeight - 0.5;
    const y0 = Math.max(0, Math.floor(sourceY));
    const y1 = Math.min(sourceHeight - 1, y0 + 1);
    const fy = Math.max(0, sourceY - y0);
    for (let x = 0; x < targetWidth; x += 1) {
      const sourceX = ((x + 0.5) * sourceWidth) / targetWidth - 0.5;
      const x0 = Math.max(0, Math.floor(sourceX));
      const x1 = Math.min(sourceWidth - 1, x0 + 1);
      const fx = Math.max(0, sourceX - x0);
      const samples = [
        [x0, y0, (1 - fx) * (1 - fy)],
        [x1, y0, fx * (1 - fy)],
        [x0, y1, (1 - fx) * fy],
        [x1, y1, fx * fy],
      ];
      let alpha = 0;
      let red = 0;
      let green = 0;
      let blue = 0;
      for (const [sampleX, sampleY, weight] of samples) {
        const offset = (sampleY * sourceWidth + sampleX) * 4;
        const sampleAlpha = pixels[offset + 3] / 255;
        alpha += sampleAlpha * weight;
        red += pixels[offset] * sampleAlpha * weight;
        green += pixels[offset + 1] * sampleAlpha * weight;
        blue += pixels[offset + 2] * sampleAlpha * weight;
      }
      const offset = (y * targetWidth + x) * 4;
      output[offset + 3] = Math.round(alpha * 255);
      if (alpha > 0) {
        output[offset] = Math.round(red / alpha);
        output[offset + 1] = Math.round(green / alpha);
        output[offset + 2] = Math.round(blue / alpha);
      }
    }
  }
  return output;
}

async function trim(file, padding = 18, maxDimension = 600) {
  const { width, height, pixels } = decodeRgbaPng(await readFile(file));
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (pixels[(y * width + x) * 4 + 3] <= 2) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  if (right < left) throw new Error(`${file} has no visible pixels`);
  left = Math.max(0, left - padding);
  top = Math.max(0, top - padding);
  right = Math.min(width - 1, right + padding);
  bottom = Math.min(height - 1, bottom + padding);
  const croppedWidth = right - left + 1;
  const croppedHeight = bottom - top + 1;
  const cropped = Buffer.alloc(croppedWidth * croppedHeight * 4);
  for (let y = 0; y < croppedHeight; y += 1) {
    pixels.copy(cropped, y * croppedWidth * 4, ((top + y) * width + left) * 4, ((top + y) * width + right + 1) * 4);
  }
  const scale = Math.min(1, maxDimension / Math.max(croppedWidth, croppedHeight));
  const outputWidth = Math.round(croppedWidth * scale);
  const outputHeight = Math.round(croppedHeight * scale);
  const output = scale < 1
    ? resizeRgba(cropped, croppedWidth, croppedHeight, outputWidth, outputHeight)
    : cropped;
  await writeFile(file, encodeRgbaPng(outputWidth, outputHeight, output));
  console.log(`${file}: ${width}x${height} -> ${outputWidth}x${outputHeight}`);
}

for (const file of process.argv.slice(2)) await trim(file);
