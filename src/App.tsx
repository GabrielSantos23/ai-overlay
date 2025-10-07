import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/electron-vite.animate.svg";
import Menu from "./pages/menu";

interface CustomIpcRenderer {
  setClickThrough: (enabled: boolean) => void;
}

function App() {
  const [count, setCount] = useState(0);

  const handleMouseEnter = () => {
    const ipcRenderer = (window as any).ipcRenderer as CustomIpcRenderer;
    if (ipcRenderer) {
      ipcRenderer.setClickThrough(false);
    }
  };

  const handleMouseLeave = () => {
    const ipcRenderer = (window as any).ipcRenderer as CustomIpcRenderer;
    if (ipcRenderer) {
      ipcRenderer.setClickThrough(true);
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none">
      <div
        className="absolute top-10 left-1/2 right-1/2 pointer-events-auto"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Menu />
      </div>
    </div>
  );
}

export default App;
