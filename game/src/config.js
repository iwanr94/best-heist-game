// The Aurum Job — configuration: one gallery floor, one clear target.
// Palette: gallery-night. Ink floor, warm stone walls, gold trim, amber guard
// cones, red camera cones, emerald exit beacon. Everything the judge needs to
// read at a glance is a colour before it is a word.
export const CONFIG = {
  worldWidth: 1280,
  worldHeight: 800,
  parSeconds: 120,
  ghostBonus: 500,

  colors: {
    floor: '#0d1226',
    floorAlt: '#111832',
    wall: '#2a2f45',
    wallTrim: '#c9a227',
    paintingFrame: '#8a6d1f',
    paintingArt: '#3b5b7a',
    gemCyan: '#7ee0ff',
    gemPink: '#ff7ad9',
    dialGold: '#ffd75e',
    guardCone: '245,166,35',
    cameraCone: '229,72,77',
    exitBeacon: '#2fd47a',
    player: '#f2ead8',
    playerCloak: '#232a4a',
    text: '#f5efe0',
    muted: '#9aa3c0',
    danger: '#e5484d',
    alarmLow: '#2fd47a',
    alarmMid: '#f5a623',
    alarmHigh: '#e5484d',
  },

  player: { speed: 165, radius: 13 },
  guard: {
    patrolSpeed: 65,
    chaseSpeed: 112,
    radius: 14,
    coneRange: 175,
    coneHalfAngle: 0.57,
    suspicionTime: 0.7,
    loseSightTime: 2.0,
    searchTime: 3.0,
    touchRadius: 30,
  },
  camera: { range: 260, halfAngle: 0.5, sweep: 0.9, sweepSpeed: 0.45 },
  alarm: { risePerSecond: 12, fallPerSecond: 8, dialPickup: 15, touchPerSecond: 50 },
  tools: { smokeCount: 2, smokeSeconds: 4, smokeRadius: 95, jammerCount: 1, jammerSeconds: 6 },

  // Walls and pillars block movement and line of sight. Gaps are the doors.
  walls: [
    { x: 0, y: 0, w: 1280, h: 16 },
    { x: 0, y: 784, w: 1280, h: 16 },
    { x: 0, y: 0, w: 16, h: 800 },
    { x: 1264, y: 0, w: 16, h: 800 },
    { x: 800, y: 16, w: 16, h: 184 },
    { x: 800, y: 280, w: 16, h: 100 },
    { x: 800, y: 380, w: 16, h: 160 },
    { x: 800, y: 620, w: 16, h: 164 },
    { x: 800, y: 380, w: 464, h: 16 },
  ],
  pillars: [
    { x: 300, y: 300, w: 36, h: 36 },
    { x: 550, y: 300, w: 36, h: 36 },
    { x: 300, y: 560, w: 36, h: 36 },
    { x: 550, y: 560, w: 36, h: 36 },
  ],

  paintings: [
    { id: 'painting-a', x: 240, y: 48, value: 400, channel: 0.6, label: 'Moonlit Harbour' },
    { id: 'painting-b', x: 430, y: 48, value: 400, channel: 0.6, label: 'The Duchess' },
    { id: 'painting-c', x: 620, y: 48, value: 400, channel: 0.6, label: 'Harbour at Dusk' },
  ],
  gems: [
    { id: 'gem-a', x: 950, y: 140, value: 900, channel: 1.2, label: 'Aurum Sapphire', color: '#7ee0ff' },
    { id: 'gem-b', x: 1130, y: 140, value: 900, channel: 1.2, label: 'Aurum Ruby', color: '#ff7ad9' },
  ],
  dial: { id: 'sun-dial', x: 1120, y: 600, value: 2500, channel: 3.0, label: 'The Sun Dial' },
  exitZone: { x: 40, y: 748, w: 110, h: 36, label: 'EXIT' },
  playerStart: { x: 90, y: 130 },

  guards: [
    {
      name: 'Hall North',
      waypoints: [
        { x: 180, y: 150 },
        { x: 700, y: 150 },
        { x: 700, y: 330 },
        { x: 180, y: 330 },
      ],
    },
    {
      name: 'Vault',
      waypoints: [
        { x: 860, y: 450 },
        { x: 1210, y: 450 },
        { x: 1210, y: 720 },
        { x: 860, y: 720 },
      ],
    },
    {
      name: 'Hall South',
      waypoints: [
        { x: 120, y: 700 },
        { x: 700, y: 700 },
        { x: 700, y: 470 },
        { x: 120, y: 470 },
      ],
    },
  ],
  cameras: [
    { x: 480, y: 18, baseAngle: Math.PI / 2, label: 'CAM 1' },
    { x: 1030, y: 398, baseAngle: Math.PI / 2, label: 'CAM 2' },
  ],
};
