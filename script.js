const whaleSounds = [
    'sounds/whale1.mp3',
    'sounds/whale2.mp3',
    'sounds/whale3.mp3'
    // Add more whale sound files as needed
];

function handleWhaleClick() {
    const randomIndex = Math.floor(Math.random() * whaleSounds.length);
    const whaleAudio = new Audio(whaleSounds[randomIndex]);
    whaleAudio.play();
} 