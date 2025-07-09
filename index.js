const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const archiver = require('archiver');
const unzipper = require('unzipper');
const crypto = require('crypto');

require('./cleaner'); // เรียกตัวลบไฟล์อัตโนมัติ
const app = express(); const upload = multer({ dest: 'uploads/' }); app.use(express.static('public'));app.use('/zips', express.static('zips')); app.use(express.json());

function generateNamespace() { return [...Array(32)].map(() => Math.random().toString(36)[2]).join(''); }

app.post('/upload', upload.fields([ { name: 'video' }, { name: 'audio' }, { name: 'icon' }, { name: 'manifest' }, { name: 'sounds_zip' }, ]), async (req, res) => { try { const fps = parseFloat(req.body.fps); const quality = parseInt(req.body.quality); const textureName = req.body.textureName; const namespace = generateNamespace(); const outputDir = path.join('output', namespace); const frameDir = path.join(outputDir, 'subpacks/1080/betmc_background/betmc_background_frame');

fs.mkdirSync(frameDir, { recursive: true });

if (req.files.video) {
  const videoPath = req.files.video[0].path;
  execSync(`ffmpeg -i ${videoPath} -vf fps=${fps} ${frameDir}/betmc_img_%d_frame.png`);
}

const frames = fs.readdirSync(frameDir).filter(f => f.endsWith('.png'));

for (const file of frames) {
  const input = path.join(frameDir, file);
  const output = path.join(frameDir, `compressed_${file.replace('.png', '.jpg')}`);
  execSync(`magick "${input}" -strip -quality ${quality} "${output}"`);
  fs.unlinkSync(input);
}

fs.readdirSync(frameDir).forEach(file => {
  if (file.startsWith('compressed_')) {
    fs.renameSync(
      path.join(frameDir, file),
      path.join(frameDir, file.replace('compressed_', ''))
    );
  }
});

// Copy static patch
const frame60 = path.join(frameDir, 'betmc_img_60_frame.jpg');
const staticPatch = path.join(outputDir, 'subpacks/0/betmc_background/betmc_background_static_patch.jpg');
fs.mkdirSync(path.dirname(staticPatch), { recursive: true });
if (fs.existsSync(frame60)) fs.copyFileSync(frame60, staticPatch);

// manifest
const manifestPath = path.join(outputDir, 'manifest.json');
if (req.files.manifest) {
  const rawManifest = fs.readFileSync(req.files.manifest[0].path, 'utf8');
  const manifest = JSON.parse(rawManifest);
  manifest.header.name = textureName;
  manifest.header.uuid = crypto.randomUUID();
  manifest.modules[0].uuid = crypto.randomUUID();
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

// audio
if (req.files.audio) {
  const audioOutput = path.join(outputDir, 'sounds/music/menu');
  fs.mkdirSync(audioOutput, { recursive: true });
  execSync(`ffmpeg -i ${req.files.audio[0].path} -vn -c:a libvorbis ${audioOutput}/menu1.ogg`);
  for (let i = 2; i <= 4; i++) {
    fs.copyFileSync(`${audioOutput}/menu1.ogg`, `${audioOutput}/menu${i}.ogg`);
  }
}

// icon
if (req.files.icon) {
  fs.copyFileSync(req.files.icon[0].path, path.join(outputDir, 'pack_icon.png'));
}

// sounds zip
if (req.files.sounds_zip) {
  await fs.createReadStream(req.files.sounds_zip[0].path)
    .pipe(unzipper.Extract({ path: path.join(outputDir, 'sounds') }))
    .promise();
}

// betmc_config
const config0 = {
  namespace: 'betmc_config',
  betmc_main_config: {
    $betmc_scr_backround_path: 'betmc_background/betmc_background_static_patch'
  }
};
const config1080 = {
  namespace: 'betmc_config',
  betmc_main_config: {
    $use_background_static_customs: false,
    $use_setting_background_static_customs: false,
    $use_background_animation: true,
    $betmc_frame_duration: 1 / fps
  }
};
fs.mkdirSync(path.join(outputDir, 'subpacks/0/betmc_config'), { recursive: true });
fs.mkdirSync(path.join(outputDir, 'subpacks/1080/betmc_config'), { recursive: true });
fs.writeFileSync(path.join(outputDir, 'subpacks/0/betmc_config/config.json'), JSON.stringify(config0, null, 2));
fs.writeFileSync(path.join(outputDir, 'subpacks/1080/betmc_config/config.json'), JSON.stringify(config1080, null, 2));

// generate namespace-based UI files
const betmcCommonPath = path.join(outputDir, 'betmc_ui/betmc_common');
const uiPath = path.join(outputDir, 'ui');
fs.mkdirSync(betmcCommonPath, { recursive: true });
fs.mkdirSync(uiPath, { recursive: true });

let yBottom = 1500;
const animFrames = [];
while (animFrames.length < frames.length) {
  for (let y = 1500; y >= -1400 && animFrames.length < frames.length; y -= 100) {
    animFrames.push({ from: [`${y}%`, `${yBottom}%`] });
  }
  yBottom -= 100;
}

const animJson = { namespace };
animJson[`${namespace}.app-js:8:19`] = {
  from: animFrames[0].from,
  to: animFrames[0].from,
  next: `@${namespace}.app-js:8:19-1`,
  anim_type: 'offset',
  duration: 1 / fps
};
animFrames.forEach((f, i) => {
  if (i === 0) return;
  const key = `${namespace}.app-js:8:19-${i}`;
  animJson[key] = {
    from: f.from,
    to: f.from,
    next: i + 1 < animFrames.length ? `@${namespace}.app-js:8:19-${i + 1}` : `@${namespace}.app-js:8:19`,
    anim_type: 'offset',
    duration: 1 / fps
  };
});
fs.writeFileSync(path.join(betmcCommonPath, `${namespace}.json`), JSON.stringify(animJson, null, 2));

const bgCommon = {
  namespace: 'betmc_background',
  'betmc_animation_background_frame@betmc_common.empty_panel': {
    anims: [`@${namespace}.app-js:8:19`],
    controls: [],
    size: ['100%', '100%'],
    offset: `@${namespace}.app-js:8:19`,
    anchor_from: 'center',
    anchor_to: 'center'
  }
};
const controls = [];
const defs = {};
let x = -1500, y = -1500;
for (let i = 0; i < frames.length; i++) {
  const key = i > 0 ? `app-js:31:30[${i}]` : 'app-js:31:30';
  const id = crypto.randomUUID().replace(/-/g, '');
  controls.push({ [`${id}@betmc_background.${key}`]: {} });
  defs[key] = {
    type: 'image',
    texture: `betmc_background/betmc_background_frame/betmc_img_${i + 1}_frame`,
    fill: true,
    size: ['100%', '100%'],
    offset: [`${x}%`, `${y}%`]
  };
  x += 100;
  if (x > 1400) {
    x = -1500;
    y += 100;
  }
  if (y > 1400) y = -1500;
}
bgCommon['betmc_animation_background_frame@betmc_common.empty_panel'].controls = controls;
Object.assign(bgCommon, defs);
fs.writeFileSync(path.join(betmcCommonPath, 'betmc_bg_common.json'), JSON.stringify(bgCommon, null, 2));

const uiDefs = { ui_defs: [`betmc_ui/betmc_common/${namespace}.json`] };
fs.writeFileSync(path.join(uiPath, '_ui_defs.json'), JSON.stringify(uiDefs, null, 2));

const zipPath = path.join('zips', `${namespace}.zip`);
fs.mkdirSync('zips', { recursive: true });
const output = fs.createWriteStream(zipPath);
const archive = archiver('zip');
archive.pipe(output);
archive.directory(outputDir, false);
await archive.finalize();

res.json({ zip: `/${zipPath}` });

} catch (err) { console.error(err); res.status(500).send('Error processing files'); } });

app.listen(3000, () => { console.log('Server listening at http://localhost:3000'); });

