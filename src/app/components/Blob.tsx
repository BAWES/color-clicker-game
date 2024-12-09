'use client';

import { useEffect, useRef } from 'react';
import styles from './Blob.module.css';

export default function Blob() {
  const blobRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (blobRef.current) {
        blobRef.current.style.transform = `translate(${e.clientX - 100}px, ${e.clientY - 100}px)`;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return <div className={styles.blob} ref={blobRef} />;
} 