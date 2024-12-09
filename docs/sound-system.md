# Sound System Documentation

## Overview
The game uses Web Audio API to create dynamic, procedurally generated sounds that respond to player actions and game events. The sound system is designed to be both engaging and non-intrusive, with sounds that scale in complexity as the player progresses.

## Sound Types

### 1. Click Sounds (Whale Calls)
Basic interaction sounds that play when clicking the blob.

#### Components:
- **Main Note**: High A note (880Hz) with 0.1s duration
- **Harmony Note**: High E note (1318.5Hz) with 0.08s duration
- **Sparkle Notes**: Three high-frequency notes:
  - High A (1760Hz)
  - High C (2093Hz)
  - High E (2637Hz)

#### Trigger:
- Every successful blob click
- Scales in complexity with player level

### 2. Milestone Sounds
Special celebratory sounds for achievements.

#### Components:
- **Main Note**: A4 (440Hz) with 0.3s duration
- **Chord Notes**:
  - C#5 (554.37Hz)
  - E5 (659.25Hz)
  - A5 (880Hz)
- **Sparkle Notes**:
  - A6 (1760Hz)
  - C7 (2093Hz)
  - E7 (2637Hz)

#### Trigger Conditions:
- Points: [100, 1000, 10000, 100000]
- Combos: [10, 25, 50, 100]
- Levels: [5, 10, 25, 50]
- Colors: [10, 25, 50, 100]

## Technical Implementation

### Audio Context
- Uses Web Audio API's AudioContext
- Initialized on first user interaction
- Handles audio resumption on tab visibility changes

### Sound Processing
- **Compression**:
  - Threshold: -24dB
  - Knee: 30
  - Ratio: 12:1
  - Attack: 0.003s
  - Release: 0.25s

- **Effects**:
  - Master gain: 0.7
  - Reverb for milestones
  - Frequency modulation for organic feel

### Volume Levels
- Base sounds: 70%
- Harmony notes: 30%
- Sparkle effects: 20%

## Best Practices

### Performance
- On-demand sound generation
- Proper audio node cleanup
- Limited concurrent sounds

### User Experience
- Respects system volume
- Mutes on tab inactive
- Graceful fallback if audio unavailable

### Mobile
- Touch event handling
- Optimized audio buffers
- Power-efficient generation 