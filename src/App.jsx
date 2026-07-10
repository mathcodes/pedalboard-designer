import { useState, useRef, useCallback, useLayoutEffect, useEffect } from "react";
import Knob from "./components/Knob.jsx";
import JackButton from "./components/JackButton.jsx";
import GuitarGlyph from "./components/GuitarGlyph.jsx";
import {
  PEDAL_TYPES,
  NUM_COLS,
  NUM_ROWS,
  COL_GAP,
  ROW_GAP,
  CELL_H,
  HEADER_GAP,
  CABLE_COLORS,
  LANE_STEP,
  jackKey,
  typeById,
  footprintSize,
  uid,
  SUPPLY_VOLTAGE,
  BASIC_SUPPLY_MA,
} from "./constants.js";

export default function App() {
  const [placed, setPlaced] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selected, setSelected] = useState(null);
  const [errorKey, setErrorKey] = useState(null);
  const [popup, setPopup] = useState(null);
  const [drag, setDrag] = useState(null);
  const [positions, setPositions] = useState({});
  const [corridors, setCorridors] = useState({ colX: [], rowY: [] });
  const [cellW, setCellW] = useState(90);

  const stageRef = useRef(null);
  const boardRef = useRef(null);
  const jackRefs = useRef({});
  const colorCounter = useRef(0);
  const dragRef = useRef(null);

  const setJackRef = useCallback((key, el) => {
    jackRefs.current[key] = el;
  }, []);

  const deviceInfo = useCallback(
    (id) => {
      if (id === "guitar" || id === "amp") return { row: -1, col: null };
      const p = placed.find((x) => x.id === id);
      return p ? { row: p.row, col: p.col } : null;
    },
    [placed]
  );

  const deviceName = useCallback(
    (id) => {
      if (id === "guitar") return "GUITAR";
      if (id === "amp") return "AMPLIFIER";
      const p = placed.find((x) => x.id === id);
      return p ? typeById(p.typeId).name : id;
    },
    [placed]
  );

  const measure = useCallback(() => {
    const stage = stageRef.current;
    const board = boardRef.current;
    if (!stage || !board) return;
    const stageRect = stage.getBoundingClientRect();
    const boardRect = board.getBoundingClientRect();

    const nextPositions = {};
    Object.entries(jackRefs.current).forEach(([key, el]) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      nextPositions[key] = {
        x: r.left + r.width / 2 - stageRect.left,
        y: r.top + r.height / 2 - stageRect.top,
      };
    });
    setPositions(nextPositions);

    const boardLeft = boardRect.left - stageRect.left;
    const boardTop = boardRect.top - stageRect.top;
    const w = (boardRect.width - (NUM_COLS - 1) * COL_GAP) / NUM_COLS;
    setCellW(w);

    const colX = [];
    colX[0] = boardLeft - 24;
    for (let c = 1; c < NUM_COLS; c++) colX[c] = boardLeft + c * (w + COL_GAP) - COL_GAP / 2;
    colX[NUM_COLS] = boardLeft + NUM_COLS * w + (NUM_COLS - 1) * COL_GAP + 24;

    const rowY = [];
    rowY[0] = boardTop - HEADER_GAP / 2;
    for (let r = 1; r < NUM_ROWS; r++) rowY[r] = boardTop + r * (CELL_H + ROW_GAP) - ROW_GAP / 2;
    rowY[NUM_ROWS] = boardTop + NUM_ROWS * CELL_H + (NUM_ROWS - 1) * ROW_GAP + 24;

    setCorridors({ colX, rowY });
  }, []);

  useLayoutEffect(() => {
    measure();
    const t1 = setTimeout(measure, 150);
    const t2 = setTimeout(measure, 500);
    window.addEventListener("resize", measure);
    let ro;
    if (typeof ResizeObserver !== "undefined" && boardRef.current) {
      ro = new ResizeObserver(() => measure());
      ro.observe(boardRef.current);
    }
    return () => {
      window.removeEventListener("resize", measure);
      clearTimeout(t1);
      clearTimeout(t2);
      if (ro) ro.disconnect();
    };
  }, [measure]);

  useEffect(() => {
    measure();
  }, [placed, connections.length, measure]);

  const closePopup = () => setPopup(null);

  const cellFree = (col, row, ignoreId) => !placed.some((p) => p.col === col && p.row === row && p.id !== ignoreId);

  const removePedal = (id) => {
    setPlaced((prev) => prev.filter((p) => p.id !== id));
    setConnections((prev) => prev.filter((c) => !c.fromKey.startsWith(`${id}:`) && !c.toKey.startsWith(`${id}:`)));
  };

  // --- drag handling ---
  const beginDrag = (info) => (e) => {
    e.stopPropagation();
    e.preventDefault();
    setSelected(null);
    closePopup();
    const next = { ...info, x: e.clientX, y: e.clientY, overCell: null, valid: false };
    dragRef.current = next;
    setDrag(next);
  };

  useEffect(() => {
    if (!drag) return;
    const onMove = (e) => {
      const board = boardRef.current;
      const boardRect = board.getBoundingClientRect();
      const col = Math.floor((e.clientX - boardRect.left) / (cellW + COL_GAP));
      const row = Math.floor((e.clientY - boardRect.top) / (CELL_H + ROW_GAP));
      const inBounds =
        e.clientX >= boardRect.left && e.clientX <= boardRect.right && e.clientY >= boardRect.top && e.clientY <= boardRect.bottom;
      const validCell =
        inBounds && col >= 0 && col < NUM_COLS && row >= 0 && row < NUM_ROWS && cellFree(col, row, dragRef.current.instanceId);
      const next = { ...dragRef.current, x: e.clientX, y: e.clientY, overCell: inBounds ? { col, row } : null, valid: validCell };
      dragRef.current = next;
      setDrag(next);
    };
    const onUp = () => {
      const d = dragRef.current;
      if (d) {
        if (d.mode === "new" && d.valid) {
          setPlaced((prev) => [...prev, { id: uid(), typeId: d.typeId, col: d.overCell.col, row: d.overCell.row }]);
        } else if (d.mode === "move") {
          if (d.valid) {
            setPlaced((prev) => prev.map((p) => (p.id === d.instanceId ? { ...p, col: d.overCell.col, row: d.overCell.row } : p)));
          } else if (!d.overCell) {
            removePedal(d.instanceId);
          }
        }
      }
      dragRef.current = null;
      setDrag(null);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag !== null, cellW, placed]);

  // --- jack wiring ---
  const jackState = (key) => {
    if (errorKey === key) return "error";
    if (selected && selected.key === key) return "selected";
    if (connections.some((c) => c.fromKey === key || c.toKey === key)) return "connected";
    return "idle";
  };

  const onJackClick = (deviceId, type) => (e) => {
    e.stopPropagation();
    closePopup();
    const key = jackKey(deviceId, type);
    if (!selected) {
      setSelected({ key, deviceId, type });
      return;
    }
    if (selected.key === key) {
      setSelected(null);
      return;
    }
    if (selected.deviceId === deviceId || selected.type === type) {
      setSelected({ key, deviceId, type });
      return;
    }
    const outKey = type === "out" ? key : selected.key;
    const inKey = type === "in" ? key : selected.key;
    const occupied = connections.some((c) => c.toKey === inKey);
    if (occupied) {
      setErrorKey(inKey);
      setTimeout(() => setErrorKey(null), 450);
      setSelected(null);
      return;
    }
    const color = CABLE_COLORS[colorCounter.current % CABLE_COLORS.length];
    colorCounter.current += 1;
    setConnections((prev) => [
      ...prev,
      { id: `c-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`, fromKey: outKey, toKey: inKey, color },
    ]);
    setSelected(null);
  };

  const onWireClick = (conn) => (e) => {
    e.stopPropagation();
    setSelected(null);
    const stageRect = stageRef.current.getBoundingClientRect();
    setPopup({ connId: conn.id, x: e.clientX - stageRect.left, y: e.clientY - stageRect.top });
  };

  const deleteConnection = (id) => {
    setConnections((prev) => prev.filter((c) => c.id !== id));
    closePopup();
  };

  const popupConn = popup ? connections.find((c) => c.id === popup.connId) : null;

  const totalMA = placed.reduce((sum, p) => sum + (typeById(p.typeId)?.mA ?? 0), 0);
  const totalWatts = (totalMA / 1000) * SUPPLY_VOLTAGE;
  const powerLevel = totalMA >= BASIC_SUPPLY_MA ? "over" : totalMA >= BASIC_SUPPLY_MA * 0.7 ? "caution" : "ok";

  const pathString = (conn, i) => {
    const centered = i - (connections.length - 1) / 2;
    const laneOffset = centered * LANE_STEP;
    const p1 = positions[conn.fromKey];
    const p2 = positions[conn.toKey];
    if (!p1 || !p2 || !corridors.colX.length) return null;

    const src = deviceInfo(conn.fromKey.split(":")[0]);
    const tgt = deviceInfo(conn.toKey.split(":")[0]);
    if (!src || !tgt) return null;
    const { colX, rowY } = corridors;

    if (src.row >= 0 && tgt.row >= 0 && tgt.col === src.col + 1 && src.row === tgt.row) {
      return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
    }

    const exitX = src.row === -1 ? p1.x : colX[src.col + 1] + laneOffset;
    const entryX = tgt.row === -1 ? p2.x : colX[tgt.col] + laneOffset;
    const rowCorridorIdx = src.row === tgt.row ? src.row + 1 : Math.min(src.row, tgt.row) + 1;
    const travelY = rowY[rowCorridorIdx] + laneOffset;

    if (src.row >= 0 && tgt.row >= 0 && src.col === tgt.col && exitX === entryX) {
      return `M ${p1.x} ${p1.y} L ${exitX} ${p1.y} L ${exitX} ${p2.y} L ${p2.x} ${p2.y}`;
    }

    return `M ${p1.x} ${p1.y} L ${exitX} ${p1.y} L ${exitX} ${travelY} L ${entryX} ${travelY} L ${entryX} ${p2.y} L ${p2.x} ${p2.y}`;
  };

  const ghostType = drag
    ? drag.mode === "new"
      ? typeById(drag.typeId)
      : typeById(placed.find((p) => p.id === drag.instanceId)?.typeId)
    : null;

  return (
    <div
      className="app-root"
      onClick={() => {
        setSelected(null);
        closePopup();
      }}
    >
      <div className="header">
        <div className="eyebrow">SIGNAL CHAIN LAB</div>
        <h1 className="title">Pedalboard Designer</h1>
        <p className="instructions">
          <b>Drag</b> a pedal from the locker onto the board — it snaps to the grid. Drag a placed pedal off the
          board (or tap its ×) to remove it. Tap an <b>OUT</b> jack, then an <b>IN</b> jack to run a cable. Tap a
          cable to disconnect it.
        </p>
      </div>

      <div className="palette-panel">
        <div className="palette-title">PEDAL LOCKER</div>
        <div className="palette-grid">
          {PEDAL_TYPES.map((t) => (
            <div key={t.id} className="palette-card" onPointerDown={beginDrag({ mode: "new", typeId: t.id })}>
              <div className="palette-bar" style={{ background: t.accent }} />
              <div className="palette-name">{t.name}</div>
              <div className="palette-sub">{t.sub}</div>
              <div className="palette-ma">~{t.mA} mA</div>
            </div>
          ))}
        </div>
      </div>

      <div className="stage" ref={stageRef}>
        <div className="rig-header">
          <div className="anchor-box guitar">
            <div className="guitar-glyph-wrap">
              <GuitarGlyph />
            </div>
            <div className="anchor-name">GUITAR</div>
            <div className="anchor-sub">FLAME MAPLE</div>
            <div className="anchor-jack" ref={(el) => setJackRef(jackKey("guitar", "out"), el)}>
              <JackButton label="OUT" state={jackState(jackKey("guitar", "out"))} onClick={onJackClick("guitar", "out")} />
              <span className="jack-label">OUT</span>
            </div>
          </div>
          <div className="anchor-box amp">
            <div className="amp-panel">
              <div className="amp-jewel" />
            </div>
            <div className="amp-grille" />
            <div className="anchor-name">AMPLIFIER</div>
            <div className="anchor-sub">BLACKFACE COMBO</div>
            <div className="anchor-jack" ref={(el) => setJackRef(jackKey("amp", "in"), el)}>
              <JackButton label="IN" state={jackState(jackKey("amp", "in"))} onClick={onJackClick("amp", "in")} />
              <span className="jack-label">IN</span>
            </div>
          </div>
        </div>

        <div className="board" ref={boardRef} style={{ height: NUM_ROWS * CELL_H + (NUM_ROWS - 1) * ROW_GAP }}>
          {Array.from({ length: NUM_COLS * NUM_ROWS }).map((_, idx) => {
            const col = idx % NUM_COLS;
            const row = Math.floor(idx / NUM_COLS);
            const isHover = drag && drag.overCell && drag.overCell.col === col && drag.overCell.row === row;
            const hoverClass = isHover ? (drag.valid ? "hover-valid" : "hover-invalid") : "";
            return (
              <div
                key={idx}
                className={`board-cell ${hoverClass}`}
                style={{ left: col * (cellW + COL_GAP), top: row * (CELL_H + ROW_GAP), width: cellW, height: CELL_H }}
              />
            );
          })}

          {placed.map((p) => {
            const type = typeById(p.typeId);
            const isDragging = drag && drag.mode === "move" && drag.instanceId === p.id;
            const { w: boxW, h: boxH } = footprintSize(type, cellW, CELL_H);
            return (
              <div
                key={p.id}
                className={`placed-pedal ${isDragging ? "dragging" : ""}`}
                style={{ left: p.col * (cellW + COL_GAP), top: p.row * (CELL_H + ROW_GAP), width: cellW, height: CELL_H }}
                onPointerDown={beginDrag({ mode: "move", instanceId: p.id })}
              >
                <div className="pedal-box" style={{ width: boxW, height: boxH }}>
                  <button
                    className="pedal-remove"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => removePedal(p.id)}
                    aria-label="Remove pedal"
                  >
                    ×
                  </button>
                  <div className="pedal-accent" style={{ background: type.accent }} />
                  <div className="knob-row">
                    {Array.from({ length: type.knobs }).map((_, k) => (
                      <Knob key={k} accent={type.accent} />
                    ))}
                  </div>
                  <div className="pedal-name">{type.name}</div>
                  <div className="pedal-sub">{type.sub}</div>
                  <div className="pedal-ma">~{type.mA} mA</div>

                  <div className="jack-wrap jack-left" ref={(el) => setJackRef(jackKey(p.id, "in"), el)}>
                    <JackButton label="IN" state={jackState(jackKey(p.id, "in"))} onClick={onJackClick(p.id, "in")} />
                    <span className="jack-label">IN</span>
                  </div>
                  <div className="jack-wrap jack-right" ref={(el) => setJackRef(jackKey(p.id, "out"), el)}>
                    <JackButton label="OUT" state={jackState(jackKey(p.id, "out"))} onClick={onJackClick(p.id, "out")} />
                    <span className="jack-label">OUT</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <svg className="wire-svg">
          {connections.map((conn, i) => {
            const d = pathString(conn, i);
            if (!d) return null;
            return (
              <g key={conn.id}>
                <path
                  d={d}
                  stroke="transparent"
                  strokeWidth="20"
                  fill="none"
                  strokeLinejoin="round"
                  style={{ pointerEvents: "auto", cursor: "pointer" }}
                  onClick={onWireClick(conn)}
                />
                <path d={d} stroke="#0b0c09" strokeWidth="7" fill="none" strokeLinejoin="miter" />
                <path
                  d={d}
                  stroke={conn.color}
                  strokeWidth="3.5"
                  fill="none"
                  strokeLinejoin="miter"
                  style={{ pointerEvents: "none" }}
                />
                <circle
                  cx={positions[conn.fromKey]?.x}
                  cy={positions[conn.fromKey]?.y}
                  r="5"
                  fill={conn.color}
                  stroke="#0b0c09"
                  strokeWidth="1.5"
                />
                <circle
                  cx={positions[conn.toKey]?.x}
                  cy={positions[conn.toKey]?.y}
                  r="5"
                  fill={conn.color}
                  stroke="#0b0c09"
                  strokeWidth="1.5"
                />
              </g>
            );
          })}
        </svg>

        {popup && popupConn && (
          <div className="wire-popup" style={{ left: popup.x, top: popup.y }} onClick={(e) => e.stopPropagation()}>
            <div className="wire-popup-title">
              {deviceName(popupConn.fromKey.split(":")[0])} → {deviceName(popupConn.toKey.split(":")[0])}
            </div>
            <button className="wire-popup-btn" onClick={() => deleteConnection(popupConn.id)}>
              Disconnect cable
            </button>
            <button className="wire-popup-cancel" onClick={closePopup}>
              Cancel
            </button>
          </div>
        )}
      </div>

      {drag && ghostType && (
        <div className="drag-ghost" style={{ left: drag.x, top: drag.y }}>
          <div className="palette-card" style={{ cursor: "grabbing" }}>
            <div className="palette-bar" style={{ background: ghostType.accent }} />
            <div className="palette-name">{ghostType.name}</div>
            <div className="palette-sub">{ghostType.sub}</div>
          </div>
        </div>
      )}

      {placed.length > 0 && (
        <div className="power-panel">
          <div className="patch-title">POWER BUDGET (9V DAISY CHAIN ESTIMATE)</div>
          <div className="power-total">
            <span className="power-total-value">
              {totalMA} mA <span className="power-total-w">(~{totalWatts.toFixed(2)} W at {SUPPLY_VOLTAGE}V)</span>
            </span>
            <span className={`power-badge power-${powerLevel}`}>
              {powerLevel === "ok" && "OK on a basic daisy chain"}
              {powerLevel === "caution" && "Near a basic supply's limit"}
              {powerLevel === "over" && "Too much for a basic daisy chain"}
            </span>
          </div>
          <div className="power-bar-track">
            <div
              className={`power-bar-fill power-${powerLevel}`}
              style={{ width: `${Math.min(100, (totalMA / BASIC_SUPPLY_MA) * 100)}%` }}
            />
          </div>
          <p className="power-note">
            Estimated from typical published current draw per pedal category — analog pedals (overdrive, fuzz,
            compressor) sip very little, while digital time-based effects (delay, reverb) draw much more. A basic
            single-output 9V "daisy chain" supply is usually rated around {BASIC_SUPPLY_MA} mA total; once you're
            near or over that, or mixing analog with digital, an isolated multi-output supply avoids sag and noise.
            Always check the rating printed on your actual pedal before powering it for real.
          </p>
        </div>
      )}

      <div className="patch-panel">
        <div className="patch-title">
          PATCH LIST — {connections.length} CABLE{connections.length === 1 ? "" : "S"}
        </div>
        {connections.length === 0 && (
          <div className="patch-empty">No cables connected yet. Drag a pedal onto the board to begin.</div>
        )}
        {connections.map((conn) => (
          <div className="patch-row" key={conn.id}>
            <span className="patch-dot" style={{ background: conn.color }} />
            <span>
              {deviceName(conn.fromKey.split(":")[0])} OUT → {deviceName(conn.toKey.split(":")[0])} IN
            </span>
            <button className="patch-remove" aria-label="Remove cable" onClick={() => deleteConnection(conn.id)}>
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
