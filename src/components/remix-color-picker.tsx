"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";

type Hsv = { h: number; s: number; v: number };

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function hexToHsv(hex: string): Hsv {
  const value = hex.replace("#", "");
  const red = parseInt(value.slice(0, 2), 16) / 255;
  const green = parseInt(value.slice(2, 4), 16) / 255;
  const blue = parseInt(value.slice(4, 6), 16) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let hue = 0;
  if (delta) {
    if (max === red) hue = ((green - blue) / delta) % 6;
    else if (max === green) hue = (blue - red) / delta + 2;
    else hue = (red - green) / delta + 4;
  }
  return { h: (hue * 60 + 360) % 360, s: max ? delta / max : 0, v: max };
}

function hsvToHex({ h, s, v }: Hsv) {
  const chroma = v * s;
  const section = h / 60;
  const x = chroma * (1 - Math.abs((section % 2) - 1));
  const match = v - chroma;
  let [red, green, blue] = [0, 0, 0];
  if (section < 1) [red, green] = [chroma, x];
  else if (section < 2) [red, green] = [x, chroma];
  else if (section < 3) [green, blue] = [chroma, x];
  else if (section < 4) [green, blue] = [x, chroma];
  else if (section < 5) [red, blue] = [x, chroma];
  else [red, blue] = [chroma, x];
  return `#${[red, green, blue]
    .map((channel) => Math.round((channel + match) * 255).toString(16).padStart(2, "0"))
    .join("")}`.toUpperCase();
}

export function RemixColorPicker({
  value,
  label,
  onChange,
  onClose,
}: {
  value: string;
  label: string;
  onChange: (color: string) => void;
  onClose: () => void;
}) {
  const [hsv, setHsv] = useState(() => hexToHsv(value));
  const [hexInput, setHexInput] = useState(value.toUpperCase());
  const saturationRef = useRef<HTMLDivElement>(null);

  function emit(next: Hsv) {
    setHsv(next);
    const hex = hsvToHex(next);
    setHexInput(hex);
    onChange(hex);
  }

  function pickSaturation(event: ReactPointerEvent<HTMLDivElement>) {
    const target = saturationRef.current;
    if (!target) return;
    target.setPointerCapture(event.pointerId);
    const rect = target.getBoundingClientRect();
    emit({
      ...hsv,
      s: clamp((event.clientX - rect.left) / rect.width),
      v: clamp(1 - (event.clientY - rect.top) / rect.height),
    });
  }

  function commitHex() {
    const normalized = hexInput.startsWith("#") ? hexInput : `#${hexInput}`;
    if (/^#[0-9a-f]{6}$/i.test(normalized)) {
      const upper = normalized.toUpperCase();
      setHexInput(upper);
      setHsv(hexToHsv(upper));
      onChange(upper);
    } else {
      setHexInput(value.toUpperCase());
    }
  }

  function moveSaturation(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 0.1 : 0.02;
    const movement = {
      ArrowLeft: { s: -step, v: 0 },
      ArrowRight: { s: step, v: 0 },
      ArrowUp: { s: 0, v: step },
      ArrowDown: { s: 0, v: -step },
    }[event.key];
    if (!movement) return;
    event.preventDefault();
    emit({ ...hsv, s: clamp(hsv.s + movement.s), v: clamp(hsv.v + movement.v) });
  }

  useEffect(() => {
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="color-popover" role="dialog" aria-label={`${label} color picker`}>
      <div className="color-popover-head">
        <span>Color picker</span>
        <button type="button" onClick={onClose} aria-label="Close color picker">×</button>
      </div>
      <div
        ref={saturationRef}
        className="color-saturation"
        role="slider"
        tabIndex={0}
        aria-label={`${label} saturation and brightness`}
        aria-valuetext={`${Math.round(hsv.s * 100)}% saturation, ${Math.round(hsv.v * 100)}% brightness`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(hsv.v * 100)}
        style={{ backgroundColor: `hsl(${hsv.h} 100% 50%)` }}
        onPointerDown={pickSaturation}
        onKeyDown={moveSaturation}
        onPointerMove={(event) => {
          if (event.buttons === 1) pickSaturation(event);
        }}
      >
        <span className="color-cursor" style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }} />
      </div>
      <label className="hue-control">
        <span>Hue</span>
        <input
          type="range"
          min="0"
          max="360"
          value={Math.round(hsv.h)}
          onChange={(event) => emit({ ...hsv, h: Number(event.target.value) })}
        />
      </label>
      <div className="hex-control">
        <span className="hex-label">Hex</span>
        <span className="hex-swatch" style={{ background: value }} aria-hidden="true" />
        <input
          aria-label={`${label} hex color`}
          value={hexInput}
          maxLength={7}
          spellCheck={false}
          onChange={(event) => setHexInput(event.target.value)}
          onBlur={commitHex}
          onKeyDown={(event) => {
            if (event.key === "Enter") commitHex();
          }}
        />
      </div>
    </div>,
    document.body,
  );
}
