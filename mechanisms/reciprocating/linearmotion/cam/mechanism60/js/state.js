/**
 * Shared state/parameters for the linear walker mechanism
 */

// Motion parameters
export let stancePercent = 60;
export let liftDropPercent = 15;
export let overlapPercent = 50;
export let transitionType = 'quintic';
export let vxAmp = 1.0;
export let vyAmp = 2.0;

// Mechanism parameters
export let linkLength = 0.5;
export let bHeight = -0.3;
export let cOffsetX = 0.0;
export let cOffsetY = 0.0;
export let mechanismMode = 'gripper';
export let numSets = 2;
export let phaseOffset = 50;
export let mirrorSet2 = true;

// Cam parameters
export let camMinRadiusB1 = 1.0;
export let camMinRadiusC1 = 2.0;
export let camMinRadiusB2 = 1.0;
export let camMinRadiusC2 = 2.0;
export let rollerRadius = 0.15;
export let showGrooves = true;
export let discConfig = 'two';
export let oneDiscMinR = 1.0;
export let profileGap = 0.15;

// Animation state
export let progress = 0;
export let playing = false;
export let animationId = null;
export let animationSpeed = 0.5;
export let animationDirection = 1;
export let animationMode = 'forward';

// Cam animation state
export let camAngle = 0;
export let camPlaying = false;
export let camAnimationId = null;
export let camSpeed = 0.5;

// OpenSCAD parameters
export let camThickness = 10;
export let scadScale = 50;
export let centerHole = 8;

// Setters for mutable state
export function setStancePercent(v) { stancePercent = v; }
export function setLiftDropPercent(v) { liftDropPercent = v; }
export function setOverlapPercent(v) { overlapPercent = v; }
export function setTransitionType(v) { transitionType = v; }
export function setVxAmp(v) { vxAmp = v; }
export function setVyAmp(v) { vyAmp = v; }
export function setLinkLength(v) { linkLength = v; }
export function setBHeight(v) { bHeight = v; }
export function setCOffsetX(v) { cOffsetX = v; }
export function setCOffsetY(v) { cOffsetY = v; }
export function setMechanismMode(v) { mechanismMode = v; }
export function setNumSets(v) { numSets = v; }
export function setPhaseOffset(v) { phaseOffset = v; }
export function setMirrorSet2(v) { mirrorSet2 = v; }
export function setCamMinRadiusB1(v) { camMinRadiusB1 = v; }
export function setCamMinRadiusC1(v) { camMinRadiusC1 = v; }
export function setCamMinRadiusB2(v) { camMinRadiusB2 = v; }
export function setCamMinRadiusC2(v) { camMinRadiusC2 = v; }
export function setRollerRadius(v) { rollerRadius = v; }
export function setShowGrooves(v) { showGrooves = v; }
export function setDiscConfig(v) { discConfig = v; }
export function setOneDiscMinR(v) { oneDiscMinR = v; }
export function setProfileGap(v) { profileGap = v; }
export function setProgress(v) { progress = v; }
export function setPlaying(v) { playing = v; }
export function setAnimationId(v) { animationId = v; }
export function setAnimationSpeed(v) { animationSpeed = v; }
export function setAnimationDirection(v) { animationDirection = v; }
export function setAnimationMode(v) { animationMode = v; }
export function setCamAngle(v) { camAngle = v; }
export function setCamPlaying(v) { camPlaying = v; }
export function setCamAnimationId(v) { camAnimationId = v; }
export function setCamSpeed(v) { camSpeed = v; }
export function setCamThickness(v) { camThickness = v; }
export function setScadScale(v) { scadScale = v; }
export function setCenterHole(v) { centerHole = v; }
