import * as Mp4Muxer from 'mp4-muxer';

const ORIENTATIONS = {
  vertical: { width: 720, height: 1280 },
  horizontal: { width: 1280, height: 720 },
};
const FPS = 24;
const VIDEO_BITRATE = 2_500_000;

async function downloadImage(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.blob();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

function drawFrameToCanvas(ctx, img, progress, type, canvasWidth, canvasHeight) {
  const { width: imgW, height: imgH } = img;

  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const contentWidth = Math.floor(canvasWidth * 1.0);
  const destX = (canvasWidth - contentWidth) / 2;

  if (type === 'pan_down') {
    const scale = contentWidth / imgW;
    const scaledH = imgH * scale;
    const destH = canvasHeight;
    const hiddenHeight = scaledH - destH;

    let drawY = 0 - (hiddenHeight * progress);
    if (hiddenHeight <= 0) drawY = (canvasHeight - scaledH) / 2;

    ctx.drawImage(img, destX, drawY, contentWidth, scaledH);
  }
  else {
    const zoomLevel = 1.0 + (0.15 * progress);
    const srcW = imgW / zoomLevel;
    const srcH = imgH / zoomLevel;
    const srcX = (imgW - srcW) / 2;
    const srcY = (imgH - srcH) / 2;

    const imgAspect = imgW / imgH;
    let drawW = contentWidth;
    let drawH = contentWidth / imgAspect;
    const drawY = (canvasHeight - drawH) / 2;

    ctx.drawImage(img, srcX, srcY, srcW, srcH, destX, drawY, drawW, drawH);
  }
}

function determineEffectType(img, canvasWidth, canvasHeight) {
  const imageAspect = img.height / img.width;
  const contentAspect = canvasHeight / canvasWidth;
  return (imageAspect > contentAspect * 1.5) ? 'pan_down' : 'zoom';
}

async function processAudio(audioUrl, muxer) {
  const response = await fetch(audioUrl);
  const arrayBuffer = await response.arrayBuffer();
  const audioCtx = new AudioContext();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  const audioEncoder = new AudioEncoder({
    output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
    error: (e) => console.error(e)
  });

  audioEncoder.configure({
    codec: 'mp4a.40.2',
    numberOfChannels: audioBuffer.numberOfChannels,
    sampleRate: audioBuffer.sampleRate,
    bitrate: 128000
  });

  const numberOfChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  const sampleRate = audioBuffer.sampleRate;
  const chunkSize = sampleRate * 1;

  for (let frame = 0; frame < length; frame += chunkSize) {
    const size = Math.min(chunkSize, length - frame);
    const data = new Float32Array(size * numberOfChannels);

    for (let ch = 0; ch < numberOfChannels; ch++) {
      const channelData = audioBuffer.getChannelData(ch);
      for (let i = 0; i < size; i++) {
        data[i * numberOfChannels + ch] = channelData[frame + i];
      }
    }

    const audioData = new AudioData({
      format: 'f32',
      sampleRate: sampleRate,
      numberOfChannels: numberOfChannels,
      numberOfFrames: size,
      timestamp: (frame / sampleRate) * 1_000_000,
      data: data
    });

    audioEncoder.encode(audioData);
    audioData.close();

    await new Promise(r => setTimeout(r, 0));
  }

  await audioEncoder.flush();
  audioCtx.close();
}

export async function generateVideoFromScenes({
  imageUrls,
  audioUrl,
  scenes,
  removedPanels,
  onProgress,
  onLog,
  orientation = 'vertical',
}) {
  const log = (msg) => { console.log(msg); if (onLog) onLog(msg); };
  const { width: CANVAS_WIDTH, height: CANVAS_HEIGHT } = ORIENTATIONS[orientation] || ORIENTATIONS.vertical;

  try {
    log(`[WebCodecs] Starting (${orientation}, ${CANVAS_WIDTH}x${CANVAS_HEIGHT})...`);

    const muxer = new Mp4Muxer.Muxer({
      target: new Mp4Muxer.ArrayBufferTarget(),
      video: { codec: 'avc', width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
      audio: { codec: 'aac', numberOfChannels: 2, sampleRate: 44100 },
      fastStart: 'in-memory',
    });

    const videoEncoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (e) => console.error('[VideoEncoder]', e)
    });

    videoEncoder.configure({
      codec: 'avc1.42001f',
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      bitrate: VIDEO_BITRATE,
      framerate: FPS
    });

    const canvas = new OffscreenCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    const ctx = canvas.getContext('2d');

    // 1. Preload Images
    log('[Download] Fetching assets...');
    const imageBitmaps = [];
    for (let i = 0; i < imageUrls.length; i++) {
      const blob = await downloadImage(imageUrls[i]);
      const bmp = await createImageBitmap(blob);
      imageBitmaps.push(bmp);
    }

    // 2. Calculate total timeline from full scene list
    const lastScene = scenes[scenes.length - 1];
    const totalDuration = lastScene ? lastScene.start_time + lastScene.duration : 0;
    const totalFrames = Math.round(totalDuration * FPS);
    const totalDurationMicro = totalDuration * 1_000_000;

    log(`[Render] Total: ${totalDuration.toFixed(2)}s, ${totalFrames} frames @ ${FPS}fps`);

    // 3. Render loop — scene switching driven by start_time
    for (let frame = 0; frame < totalFrames; frame++) {
      const frameTime = frame / FPS;

      // Find active scene by timestamp (binary search for speed)
      let lo = 0, hi = scenes.length - 1;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (scenes[mid].start_time <= frameTime) lo = mid;
        else hi = mid - 1;
      }
      const scene = scenes[lo];
      const isRemoved = removedPanels?.has(scene.image_page_index);

      if (isRemoved || !imageBitmaps[scene.image_page_index]) {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      } else {
        const img = imageBitmaps[scene.image_page_index];
        const effectType = determineEffectType(img, CANVAS_WIDTH, CANVAS_HEIGHT);
        const progress = scene.duration > 0
          ? Math.min((frameTime - scene.start_time) / scene.duration, 1.0)
          : 0;
        drawFrameToCanvas(ctx, img, progress, effectType, CANVAS_WIDTH, CANVAS_HEIGHT);
      }

      const timestamp = Math.round(frameTime * 1_000_000);
      const videoFrame = new VideoFrame(canvas, {
        timestamp,
        duration: Math.round(1_000_000 / FPS),
      });

      if (videoEncoder.encodeQueueSize > 5) {
        await new Promise(r => setTimeout(r, 5));
      }

      videoEncoder.encode(videoFrame, { keyFrame: frame % 60 === 0 });
      videoFrame.close();

      if (frame % 10 === 0) {
        await new Promise(r => setTimeout(r, 0));
      }

      // Progress: 0-80% during render
      if (frame % Math.max(1, Math.floor(totalFrames / 40)) === 0) {
        const pct = totalDurationMicro > 0 ? (timestamp / totalDurationMicro) * 80 : 0;
        if (onProgress) onProgress(Math.min(pct, 80));
      }
    }

    // 4. Audio
    if (audioUrl) {
      log('[Audio] Mixing audio...');
      try {
        await processAudio(audioUrl, muxer);
      } catch (e) {
        log('[Audio] Error: ' + e.message);
      }
    }

    log('[Finalize] Saving video...');
    await videoEncoder.flush();
    muxer.finalize();

    const { buffer } = muxer.target;
    const blob = new Blob([buffer], { type: 'video/mp4' });
    const videoUrl = URL.createObjectURL(blob);

    imageBitmaps.forEach(bmp => bmp.close());

    if (onProgress) onProgress(100);
    log('[Done] Video created!');

    return { videoUrl, blob, duration: totalDuration };

  } catch (error) {
    console.error(error);
    throw error;
  }
}

export function downloadVideo(blob, filename = 'manhwa_video.mp4') {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
