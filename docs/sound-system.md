# Sound System Documentation

## Overview
The game uses Web Audio API to create dynamic, procedurally generated sounds that respond to player actions and game events. The sound system includes both interactive sound effects and dynamic background music that adapts to player activity.

## Background Music System

### Dynamic Tempo Control
The Halo theme music adapts to player clicking speed:

- **Base Speed**: 
  - 0.4x playback rate (60% slower than normal)
  - Maintains this speed for 0-3 clicks per second
  - Creates a slow, ethereal ambient feel during normal play

- **Dynamic Scaling**:
  - Begins scaling at >3 clicks per second
  - Uses exponential scaling (square root curve)
  - Example speeds:
    - 3 clicks/sec: 0.4x (base rate)
    - 4 clicks/sec: ~0.52x
    - 6 clicks/sec: ~0.72x
    - 9 clicks/sec: ~0.96x
    - 12 clicks/sec: ~1.2x
  - Maximum speed: 3x base rate (1.2x normal speed)
  - Smooth transitions between speeds (0.1s interpolation)

### Auto-Fade System
- Starts fade out after 5 seconds of inactivity
- Gradual 3-second fade to silence
- Smoothly returns to base speed during fade
- Seamlessly resumes from last position when clicking resumes

### Technical Implementation
- Uses Web Audio API's AudioBufferSourceNode
- Maintains playback position during stops/starts
- Handles audio context suspension/resumption
- Memory-efficient click tracking (1.5s window)
- Proper cleanup of audio resources

## Sound Effects

### 1. Click Sounds (Whale Calls)
Basic interaction sounds that play when clicking the blob.

#### Components:
- **Main Note**: High A note (880Hz) with 0.1s duration
- **Type**: Square wave for 8-bit feel
- **Volume**: 20% of master volume

### 2. Milestone Sounds
Special celebratory sounds for achievements.

#### Components:
- **Main Note**: A4 (440Hz) with 0.3s duration
- **Harmony Notes**:
  - C#5 (554.37Hz)
  - E5 (659.25Hz)
- **Type**: Triangle wave
- **Volume**: 30% main, 20% harmony

#### Trigger Conditions:
- Points: [100, 1000, 10000, 100000]
- Combos: [10, 25, 50, 100]
- Levels: [5, 10, 25, 50]
- Colors: [10, 25, 50, 100]

### 3. Achievement Chimes
Distinct bell sounds for specific achievements.

#### Components:
- **Bell Note**: G5 (784Hz) with 0.5s duration
- **Harmony Notes**:
  - B5 (988Hz)
  - D6 (1175Hz)
- **Type**: Sine wave
- **Volume**: 30% bell, 20%/15% harmonies

#### Achievements:
- **Click Mastery**:
  - First Click
  - 100 Clicks
  - 1,000 Clicks
  - 10,000 Clicks
- **Color Collection**:
  - 10 Unique Colors
  - 25 Unique Colors
  - 50 Unique Colors
  - 100 Unique Colors
- **Combo Chains**:
  - 10x Combo
  - 25x Combo
  - 50x Combo
  - 100x Combo
- **Power Upgrades**:
  - First Power
  - Max Level Power
  - All Powers Level 10
  - All Powers Max Level

## Technical Implementation

### Audio Context
- Uses Web Audio API's AudioContext
- Initialized on first user interaction
- Handles audio resumption on tab visibility changes

### Sound Processing
- **Compression**:
  - Threshold: -20dB
  - Knee: 10
  - Ratio: 4:1
  - Attack: 0.001s
  - Release: 0.1s

- **Effects**:
  - Master gain: 0.7
  - Music gain: 0.3
  - Sound effect gain: 0.2-0.3
  - Dynamic playback rate control

### Volume Levels
- Master volume: 70%
- Background music: 30%
- Click sounds: 20%
- Milestone sounds: 30%
- Achievement sounds: 30%

## Best Practices

### Performance
- Memory-efficient click tracking
- Proper audio node cleanup
- Limited concurrent sounds
- Efficient buffer reuse

### User Experience
- Respects system volume
- Smooth transitions
- Responsive to player activity
- Graceful fade out/in

### Mobile
- Touch event handling
- Optimized audio buffers
- Power-efficient processing
- Proper cleanup on page hide 