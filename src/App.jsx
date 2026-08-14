import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Package, RefreshCw, Check, MousePointer2, AlertCircle, Info, Home } from 'lucide-react';

// --- 定数・設定 ---
// 画面上のサイズ係数 (1cmあたりのピクセル数)
const SCALE = 20;

const COLOR_12CM = "#fbbf24"; // amber-400
const COLOR_10CM = "#a78bfa"; // violet-400
const COLOR_8CM = "#4ade80";  // green-400
const COLOR_6CM = "#60a5fa";  // blue-400
const COLOR_CLAY = "#f472b6"; // pink-400

// シェイプ設定
const SHAPES = {
  RECTANGULAR: {
    id: 'rectangular',
    name: '直方体（ちょくほうたい）',
    sizes: { x: 12 * SCALE, y: 8 * SCALE, z: 6 * SCALE },
    edgeConfig: {
      x: { id: '12cm', label: 'ひご 12cm', color: COLOR_12CM, count: 4 },
      y: { id: '8cm', label: 'ひご 8cm', color: COLOR_8CM, count: 4 },
      z: { id: '6cm', label: 'ひご 6cm', color: COLOR_6CM, count: 4 }
    },
    tools: [
      { id: 'clay', label: 'ねん土玉 (ちょう点)', icon: '🔴', color: COLOR_CLAY, max: 8 },
      { id: '6cm', label: 'ひご 6cm', color: COLOR_6CM, max: 4 },
      { id: '8cm', label: 'ひご 8cm', color: COLOR_8CM, max: 4 },
      { id: '12cm', label: 'ひご 12cm', color: COLOR_12CM, max: 4 }
    ],
    questions: [
      {
        id: 'q1',
        text: '① ひごは、何本ずついりますか。',
        items: ['6cm', '8cm', '12cm']
      },
      {
        id: 'q2',
        text: '② ねん土玉は、何こいりますか。',
        items: ['clay']
      }
    ]
  },
  CUBE: {
    id: 'cube',
    name: '立方体（りっぽうたい）',
    sizes: { x: 10 * SCALE, y: 10 * SCALE, z: 10 * SCALE },
    edgeConfig: {
      x: { id: '10cm', label: 'ひご 10cm', color: COLOR_10CM, count: 12 },
      y: { id: '10cm', label: 'ひご 10cm', color: COLOR_10CM, count: 12 },
      z: { id: '10cm', label: 'ひご 10cm', color: COLOR_10CM, count: 12 }
    },
    tools: [
      { id: 'clay', label: 'ねん土玉 (ちょう点)', icon: '🔴', color: COLOR_CLAY, max: 8 },
      { id: '10cm', label: 'ひご 10cm', color: COLOR_10CM, max: 12 }
    ],
    questions: [
      {
        id: 'q1',
        text: '① ひごは、何本いりますか。',
        items: ['10cm']
      },
      {
        id: 'q2',
        text: '② ねん土玉は、何こいりますか。',
        items: ['clay']
      }
    ]
  }
};

// --- データ生成ロジック ---

// 頂点座標の生成 (CSS 3D座標系: 中心0)
const getVertices = (sizes) => {
  const { x, y, z } = sizes;
  const dx = x / 2;
  const dy = y / 2;
  const dz = z / 2;
  return [
    { id: 0, x: -dx, y: -dy, z: -dz }, { id: 1, x: dx, y: -dy, z: -dz },
    { id: 2, x: dx, y: dy, z: -dz }, { id: 3, x: -dx, y: dy, z: -dz },
    { id: 4, x: -dx, y: -dy, z: dz }, { id: 5, x: dx, y: -dy, z: dz },
    { id: 6, x: dx, y: dy, z: dz }, { id: 7, x: -dx, y: dy, z: dz }
  ];
};

// 辺データの生成
const getEdges = (sizes, edgeConfig) => {
  // CSS 3Dでの配置用に、中心座標と回転軸、サイズを定義
  // sizes: {x, y, z}
  // edgeConfig: { x: {id, color...}, y: {...}, z: {...} }

  const { x, y, z } = sizes;
  const dx = x / 2;
  const dy = y / 2;
  const dz = z / 2;

  // X軸平行 (4本: 手前上下、奥上下)
  // id 0-3
  const xEdges = [
    { x: 0, y: -dy, z: -dz }, // 手前下
    { x: 0, y: dy, z: -dz },  // 手前上
    { x: 0, y: -dy, z: dz },  // 奥下
    { x: 0, y: dy, z: dz }    // 奥上
  ].map((pos, i) => ({
    id: i,
    type: edgeConfig.x.id,
    color: edgeConfig.x.color,
    axis: 'x',
    len: x,
    ...pos
  }));

  // Z軸平行 (4本: 左上下、右上下) -> CSSではY軸回転
  // id 4-7
  const zEdges = [
    { x: dx, y: -dy, z: 0 },  // 右下
    { x: -dx, y: -dy, z: 0 }, // 左下
    { x: dx, y: dy, z: 0 },   // 右上
    { x: -dx, y: dy, z: 0 }   // 左上
  ].map((pos, i) => ({
    id: i + 4,
    type: edgeConfig.z.id,
    color: edgeConfig.z.color,
    axis: 'z',
    len: z,
    ...pos
  }));

  // Y軸平行 (4本: 奥左右、手前左右)
  // id 8-11
  const yEdges = [
    { x: -dx, y: 0, z: -dz }, // 手前左
    { x: dx, y: 0, z: -dz },  // 手前右
    { x: dx, y: 0, z: dz },   // 奥右
    { x: -dx, y: 0, z: dz }   // 奥左
  ].map((pos, i) => ({
    id: i + 8,
    type: edgeConfig.y.id,
    color: edgeConfig.y.color,
    axis: 'y',
    len: y,
    ...pos
  }));

  return [...xEdges, ...zEdges, ...yEdges];
};

// --- 3Dコンポーネント (CSS 3D) ---

const Stick3D = ({ edge, isPlaced, activeTool, onClick }) => {
  const isHoverable = activeTool === edge.type && !isPlaced;

  // 軸に応じた回転とサイズ
  let transform = `translate3d(${edge.x}px, ${edge.y}px, ${edge.z}px)`;
  let width = 0;
  let height = 0;

  // 棒の太さ
  const thickness = 12;

  if (edge.axis === 'x') {
    width = edge.len;
    height = thickness;
  } else if (edge.axis === 'y') {
    width = thickness;
    height = edge.len;
  } else if (edge.axis === 'z') {
    width = edge.len;
    height = thickness;
    transform += ' rotateY(90deg)';
  }

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick(edge); }}
      className={`absolute top-0 left-0 transform-style-3d cursor-pointer transition-colors duration-200 group flex items-center justify-center`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        // 中心基準で配置するためのオフセット
        marginLeft: `-${width / 2}px`,
        marginTop: `-${height / 2}px`,
        transform: transform,
        backgroundColor: isPlaced ? edge.color : (isHoverable ? `${edge.color}66` : 'rgba(200,200,200,0.1)'),
        boxShadow: isPlaced ? 'inset 0 0 5px rgba(0,0,0,0.2)' : 'none',
        border: isPlaced ? 'none' : '1px dashed rgba(0,0,0,0.1)',
        borderRadius: '4px',
        zIndex: isPlaced ? 10 : 1,
      }}
    >
      {/* ホバー時のガイド（配置前のみ） */}
      {!isPlaced && (
        <div className="w-full h-full opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ backgroundColor: activeTool === edge.type ? edge.color : 'transparent' }} />
      )}
    </div>
  );
};

const Clay3D = ({ vertex, isPlaced, activeTool, onClick }) => {
  const size = 24; // 粘土のサイズ
  const isHoverable = activeTool === 'clay' && !isPlaced;

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick(vertex.id); }}
      className={`absolute top-0 left-0 rounded-full cursor-pointer transition-all duration-200 shadow-sm
                  flex items-center justify-center group`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        marginLeft: `-${size / 2}px`,
        marginTop: `-${size / 2}px`,
        transform: `translate3d(${vertex.x}px, ${vertex.y}px, ${vertex.z}px)`,
        backgroundColor: isPlaced ? COLOR_CLAY : (isHoverable ? `${COLOR_CLAY}66` : 'rgba(200,200,200,0.2)'),
        zIndex: 20, // 辺より手前
        border: isPlaced ? '2px solid rgba(0,0,0,0.1)' : '1px dashed rgba(0,0,0,0.2)',
      }}
    >
      {!isPlaced && (
        <div className="w-full h-full rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-pink-300" />
      )}
    </div>
  );
};

// 3Dシーン全体 (回転制御含む)
const CSS3DScene = ({ activeTool, boxState, setBoxState, showMessage, currentShape }) => {
  const [rotation, setRotation] = useState({ x: -20, y: 45 });
  const [isDragging, setIsDragging] = useState(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  // 形状データ生成
  // currentShapeが変わるたびに再計算
  const vertices = useMemo(() => getVertices(currentShape.sizes), [currentShape]);
  const edges = useMemo(() => getEdges(currentShape.sizes, currentShape.edgeConfig), [currentShape]);

  const handlePointerDown = (e) => {
    setIsDragging(true);
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - lastMouse.current.x;
    const deltaY = e.clientY - lastMouse.current.y;

    setRotation(prev => ({
      x: Math.max(-90, Math.min(90, prev.x - deltaY * 0.5)), // X回転は制限
      y: prev.y + deltaX * 0.5
    }));

    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // タッチ対応
  const handleTouchStart = (e) => {
    setIsDragging(true);
    lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const deltaX = e.touches[0].clientX - lastMouse.current.x;
    const deltaY = e.touches[0].clientY - lastMouse.current.y;
    setRotation(prev => ({
      x: Math.max(-90, Math.min(90, prev.x - deltaY * 0.5)),
      y: prev.y + deltaX * 0.5
    }));
    lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };


  // 辺クリック時の処理
  const handleEdgeClick = (edge) => {
    if (boxState.placedEdges.includes(edge.id)) return;

    if (activeTool === edge.type) {
      setBoxState(prev => ({
        ...prev,
        placedEdges: [...prev.placedEdges, edge.id]
      }));
    } else if (activeTool && activeTool !== 'clay') {
      showMessage("長さがちがうよ！", "error");
    } else {
      showMessage("左から「ひご」をえらんでね", "info");
    }
  };

  // 頂点クリック時の処理
  const handleVertexClick = (id) => {
    if (boxState.placedVertices.includes(id)) return;

    if (activeTool === 'clay') {
      setBoxState(prev => ({
        ...prev,
        placedVertices: [...prev.placedVertices, id]
      }));
    } else if (activeTool) {
      showMessage("ここは ちょう点 だよ。「ねん土」をつかおう！", "error");
    } else {
      showMessage("左から「ねん土」をえらんでね", "info");
    }
  };

  return (
    <div
      className="w-full h-full flex items-center justify-center overflow-hidden cursor-move bg-slate-50 relative select-none"
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handlePointerUp}
    >
      {/* 回転中心のコンテナ */}
      <div
        style={{
          transformStyle: 'preserve-3d',
          transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          width: '0px',
          height: '0px',
          position: 'relative'
        }}
      >
        {/* 座標軸ガイド (床) */}
        <div className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{
            width: '400px', height: '400px',
            transform: 'rotateX(90deg) translateZ(-150px)',
            background: 'radial-gradient(circle, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0) 60%)',
            borderRadius: '50%'
          }}
        />

        {/* 辺の描画 */}
        {edges.map(edge => (
          <Stick3D
            key={`edge-${edge.id}`}
            edge={edge}
            isPlaced={boxState.placedEdges.includes(edge.id)}
            activeTool={activeTool}
            onClick={handleEdgeClick}
          />
        ))}

        {/* 頂点の描画 */}
        {vertices.map(vertex => (
          <Clay3D
            key={`vert-${vertex.id}`}
            vertex={vertex}
            isPlaced={boxState.placedVertices.includes(vertex.id)}
            activeTool={activeTool}
            onClick={handleVertexClick}
          />
        ))}

        {/* 中心ガイド（デバッグ用・あるいは回転中心の目安） */}
        <div className="absolute w-2 h-2 bg-indigo-500 rounded-full opacity-20 -ml-1 -mt-1"></div>
      </div>

      {/* 操作ガイド */}
      <div className="absolute bottom-4 right-4 bg-white/80 px-3 py-1 rounded-full text-xs text-gray-500 pointer-events-none flex items-center gap-1">
        <RefreshCw size={12} /> ドラッグして回転
      </div>
    </div>
  );
};

// --- UIコンポーネント ---

const ToolButton = ({ id, label, color, count, max, active, onClick, icon }) => (
  <button
    onClick={() => onClick(id)}
    className={`relative w-full p-3 mb-3 rounded-xl border-2 transition-all flex items-center justify-between group
            ${active
        ? 'border-indigo-600 bg-indigo-50 shadow-md transform scale-[1.02]'
        : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-gray-50'
      }`}
  >
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm"
        style={{ backgroundColor: color }}
      >
        {icon ? (
          <span className="text-xl">{icon}</span>
        ) : (
          <div className="w-full h-2 bg-white/50 rounded mx-1"></div>
        )}
      </div>
      <div className="text-left">
        <span className="block font-bold text-gray-700 text-sm">{label}</span>
        <span className="text-xs text-gray-400 font-medium">のこり: {max - parseInt(count) || 0}本</span>
      </div>
    </div>
    <div className={`px-3 py-1 rounded-full border border-gray-200 font-bold text-gray-600 shadow-sm transition-colors ${count === max ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white'}`}>
      {count === max ? 'OK!' : `${count}/${max}`}
    </div>
    {active && (
      <div className="absolute -right-2 top-1/2 -translate-y-1/2 bg-indigo-600 text-white w-6 h-6 flex items-center justify-center rounded-full shadow-lg animate-pulse text-xs">
        <MousePointer2 size={14} />
      </div>
    )}
  </button>
);

const MessageToast = ({ message, type, onClose }) => {
  if (!message) return null;
  return (
    <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-xl z-50 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300
            ${type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-indigo-600 text-white'}`}>
      {type === 'error' ? <AlertCircle size={18} /> : <Info size={18} />}
      <span className="font-bold text-sm">{message}</span>
    </div>
  );
};

const MenuScreen = ({ onSelect }) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-2xl w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-indigo-600 p-4 rounded-2xl text-white shadow-lg rotate-3 transform hover:rotate-6 transition-transform duration-300">
            <Package size={48} strokeWidth={1.5} />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">はこの形を作ろう</h1>
        <p className="text-slate-500 mb-10">作りたい形をえらんでね</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => onSelect(SHAPES.RECTANGULAR)}
            className="group relative bg-white border-2 border-indigo-100 hover:border-indigo-500 rounded-2xl p-6 transition-all hover:shadow-lg hover:-translate-y-1 text-left"
          >
            <div className="w-16 h-12 border-2 border-indigo-500 bg-indigo-50 mb-4 rounded transform group-hover:scale-110 transition-transform origin-bottom-left"></div>
            <h3 className="text-xl font-bold text-indigo-900 mb-1">直方体</h3>
            <p className="text-xs text-gray-500">（ちょくほうたい）</p>
          </button>

          <button
            onClick={() => onSelect(SHAPES.CUBE)}
            className="group relative bg-white border-2 border-indigo-100 hover:border-indigo-500 rounded-2xl p-6 transition-all hover:shadow-lg hover:-translate-y-1 text-left"
          >
            <div className="w-12 h-12 border-2 border-pink-500 bg-pink-50 mb-4 rounded transform group-hover:scale-110 transition-transform origin-bottom-left"></div>
            <h3 className="text-xl font-bold text-pink-900 mb-1">立方体</h3>
            <p className="text-xs text-gray-500">（りっぽうたい）</p>
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 text-xs text-gray-400">
          2年 算数 「はこの形」
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [activeTool, setActiveTool] = useState(null);
  const [boxState, setBoxState] = useState({
    placedEdges: [],    // 配置済みの辺IDリスト
    placedVertices: []  // 配置済みの頂点Indexリスト
  });
  const [message, setMessage] = useState({ text: null, type: null });
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [currentShape, setCurrentShape] = useState(null); // null means menu is shown

  // メッセージ表示ヘルパー
  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: null, type: null }), 2000);
  };

  // 集計
  const counts = useMemo(() => {
    if (!currentShape) return {};

    const edges = getEdges(currentShape.sizes, currentShape.edgeConfig);
    const result = {
      clay: boxState.placedVertices.length
    };

    // ツールごとのカウント
    currentShape.tools.forEach(tool => {
      if (tool.id === 'clay') return;
      // エッジIDからエッジ定義を取得してタイプを比較
      result[tool.id] = boxState.placedEdges.filter(id => {
        const edge = edges.find(e => e.id === id);
        return edge && edge.type === tool.id;
      }).length;
    });

    return result;
  }, [boxState, currentShape]);

  // 完了判定
  const isComplete = useMemo(() => {
    if (!currentShape) return false;
    const clayOK = counts.clay === 8;
    const toolsOK = currentShape.tools.every(tool => {
      if (tool.id === 'clay') return true;
      return counts[tool.id] === tool.max;
    });
    return clayOK && toolsOK;
  }, [counts, currentShape]);

  useEffect(() => {
    if (isComplete) {
      setShowCompletionModal(true);
    }
  }, [isComplete]);

  const reset = () => {
    if (window.confirm("最初からやり直しますか？")) {
      setBoxState({ placedEdges: [], placedVertices: [] });
      setActiveTool(null);
      setShowCompletionModal(false);
    }
  };

  const goHome = () => {
    if (boxState.placedEdges.length > 0 || boxState.placedVertices.length > 0) {
      if (!window.confirm("メニューに戻りますか？作成中の箱は消えてしまいます。")) {
        return;
      }
    }
    setCurrentShape(null);
    setBoxState({ placedEdges: [], placedVertices: [] });
    setActiveTool(null);
    setShowCompletionModal(false);
  };

  // 完了時の紙吹雪（簡易版）
  const renderConfetti = () => {
    return Array.from({ length: 30 }).map((_, i) => (
      <div key={i} className="absolute animate-bounce"
        style={{
          left: `${Math.random() * 100}%`,
          top: `-20px`,
          animationDuration: `${Math.random() * 2 + 1}s`,
          animationDelay: `${Math.random() * 2}s`
        }}>
        <div className="w-3 h-3 rounded-sm"
          style={{ backgroundColor: ['#FFD700', '#FF69B4', '#00BFFF', '#32CD32'][Math.floor(Math.random() * 4)] }} />
      </div>
    ));
  };

  if (!currentShape) {
    return <MenuScreen onSelect={setCurrentShape} />;
  }

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden">
      {/* ヘッダー */}
      <header className="bg-white px-6 py-3 shadow-sm z-10 flex justify-between items-center border-b border-gray-200">
        <div className="flex items-center gap-2">
          <button onClick={goHome} className="bg-indigo-600 p-2 rounded-lg text-white hover:bg-indigo-700 transition-colors" title="メニューに戻る">
            <Home size={20} />
          </button>
          <div>
            <h1 className="font-bold text-lg leading-tight text-gray-800">{currentShape.name}</h1>
            <p className="text-xs text-gray-500">2年 算数 「はこの形」</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            <RefreshCw size={16} /> やりなおす
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">

        {/* 左サイドバー：道具 */}
        <div className="w-72 bg-white border-r border-gray-200 flex flex-col shadow-lg z-10">
          <div className="p-4 bg-indigo-50/50 border-b border-indigo-100">
            <h2 className="font-bold text-indigo-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center text-xs">1</span>
              どうぐをえらぶ
            </h2>
          </div>

          <div className="p-4 flex-1 overflow-y-auto">
            <p className="text-xs text-gray-500 mb-4 bg-yellow-50 p-2 rounded border border-yellow-100 flex gap-2">
              <span className="text-xl">💡</span>
              ボタンをおしてから、画面のうすい線をタッチしよう！
            </p>

            {currentShape.tools.map(tool => (
              <ToolButton
                key={tool.id}
                id={tool.id}
                label={tool.label}
                color={tool.color}
                count={tool.id === 'clay' ? counts.clay : counts[tool.id]}
                max={tool.max}
                active={activeTool === tool.id}
                onClick={setActiveTool}
                icon={tool.icon}
              />
            ))}
          </div>
        </div>

        {/* メインエリア：CSS 3Dキャンバス */}
        <div className="flex-1 relative bg-slate-50 overflow-hidden">
          <CSS3DScene
            activeTool={activeTool}
            boxState={boxState}
            setBoxState={setBoxState}
            showMessage={showMessage}
            currentShape={currentShape}
          />

          <MessageToast message={message.text} type={message.type} />

          {/* ガイドメッセージ */}
          {!activeTool && !isComplete && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur px-6 py-4 rounded-2xl shadow-xl border border-indigo-100 text-center pointer-events-none transition-opacity">
              <div className="text-4xl mb-2 animate-bounce">👆</div>
              <p className="font-bold text-indigo-900">左からどうぐをえらんでね</p>
            </div>
          )}

          {/* 完成アニメーションオーバーレイ */}
          {showCompletionModal && (
            <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-500">
              {renderConfetti()}
              <div className="bg-white p-8 rounded-3xl shadow-2xl text-center transform scale-100 animate-in zoom-in duration-300 max-w-sm w-full mx-4">
                <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-bounce">
                  <span className="text-4xl">🎉</span>
                </div>
                <h2 className="text-3xl font-bold text-indigo-900 mb-2">かんせい！</h2>
                <p className="text-gray-600 mb-6">{currentShape.name}が上手にできたね！</p>
                <div className="flex flex-col gap-3">
                  <button onClick={() => setShowCompletionModal(false)} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-500 transition shadow-lg w-full flex items-center justify-center gap-2">
                    <MousePointer2 size={18} />
                    じっくり見る
                  </button>
                  <button onClick={reset} className="bg-white text-gray-600 border border-gray-200 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition w-full flex items-center justify-center gap-2">
                    <RefreshCw size={18} />
                    もういちど遊ぶ
                  </button>
                  <button onClick={goHome} className="text-indigo-400 text-sm font-bold hover:text-indigo-600 mt-2">
                    メニューにもどる
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 右サイドバー：問題 */}
        <div className="w-80 bg-white border-l border-gray-200 shadow-xl z-20 flex flex-col">
          <div className="p-4 bg-green-50 border-b border-green-100">
            <h2 className="font-bold text-green-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-green-200 text-green-700 flex items-center justify-center text-xs">2</span>
              教科書の答え
            </h2>
          </div>

          <div className="p-6 flex-1 overflow-y-auto space-y-8">
            {currentShape.questions.map((q, idx) => (
              <div key={q.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10 text-6xl grayscale">
                  <Package />
                </div>
                <h3 className="font-bold text-gray-800 text-sm mb-3">{q.text}</h3>

                <div className="space-y-3">
                  {q.items.map(itemId => {
                    const tool = currentShape.tools.find(t => t.id === itemId);
                    const currentCount = itemId === 'clay' ? counts.clay : counts[itemId];
                    const isCompleted = currentCount === tool.max;

                    return (
                      <div key={itemId} className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${isCompleted ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-100'}`}>
                        <span className="font-bold text-gray-700 text-sm flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ background: tool.color }}></span>
                          {tool.label.replace(' (ちょう点)', '')}
                        </span>
                        <div className="flex items-end gap-1">
                          <span className={`text-2xl font-bold ${isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                            {currentCount === 0 ? '?' : currentCount}
                          </span>
                          <span className="text-xs text-gray-500 mb-1">{itemId === 'clay' ? 'こ' : '本'}</span>
                          {isCompleted && <Check size={16} className="text-green-500 ml-1 mb-1" strokeWidth={3} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
